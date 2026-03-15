"""Verify pipeline: chains all 5 verify agents with status tracking."""

import asyncio
import traceback
import uuid

from .company_intel import company_intelligence_agent
from .report_extraction import report_extraction_agent
from .independent_data import independent_data_agent
from .cross_reference import cross_reference_agent
from .report_generation import report_generation_agent

# In-memory job store: job_id -> job dict
_jobs: dict[str, dict] = {}

AGENT_DEFS = [
    {"name": "Company Intelligence", "fn": company_intelligence_agent},
    {"name": "Report Extraction", "fn": report_extraction_agent},
    {"name": "Independent Data", "fn": independent_data_agent},
    {"name": "Cross-Reference & Scoring", "fn": cross_reference_agent},
    {"name": "Report Generation", "fn": report_generation_agent},
]


def _make_agents_status() -> list[dict]:
    return [{"name": a["name"], "status": "pending", "message": None} for a in AGENT_DEFS]


def create_job(company_name: str) -> str:
    """Create a new verify job and return its ID."""
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {
        "job_id": job_id,
        "company_name": company_name,
        "status": "running",
        "current_agent": 1,
        "agents": _make_agents_status(),
        "result": None,
    }
    return job_id


def get_job(job_id: str) -> dict | None:
    job = _jobs.get(job_id)
    if job is not None:
        return job
    # Fall back to SQLite for completed jobs (survives restarts / direct URL loads)
    import db
    return db.load_job("verify", job_id)


async def _run_pipeline(job_id: str) -> None:
    """Execute the 5-agent pipeline, updating job status as we go."""
    job = _jobs[job_id]
    state = {"company_name": job["company_name"]}

    try:
        for i, agent_def in enumerate(AGENT_DEFS):
            job["current_agent"] = i + 1
            job["agents"][i]["status"] = "running"
            job["agents"][i]["message"] = f"Running {agent_def['name']}..."

            state = await agent_def["fn"](state)

            # Build a short summary message per agent
            job["agents"][i]["status"] = "complete"
            job["agents"][i]["message"] = _agent_summary(i, state)

        job["status"] = "complete"
        job["result"] = _normalize_result(state)
        # Persist to SQLite so the report survives server restarts
        import db
        db.save_job("verify", job_id, job["result"], job["company_name"])

    except Exception as e:
        current = job["current_agent"] - 1
        job["status"] = "error"
        job["agents"][current]["status"] = "error"
        job["agents"][current]["message"] = f"Error: {e}"
        traceback.print_exc()


def run_pipeline_in_background(job_id: str) -> None:
    """Start the pipeline in a background thread with its own event loop."""
    import threading

    def _thread_target():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_run_pipeline(job_id))
        finally:
            loop.close()

    t = threading.Thread(target=_thread_target, daemon=True)
    t.start()


def _normalize_result(state: dict) -> dict:
    """Assemble a normalized result dict from the full pipeline state.

    Merges final_report fields with cross_reference scores, normalizes field
    names expected by the frontend, and includes raw agent data for the
    dashboard charts.
    """
    import re
    final = state.get("final_report", {})
    cross_ref = state.get("cross_reference_analysis", {})
    ts_raw = cross_ref.get("transparency_score", {})
    # ts_raw may be a dict with various key names, or a raw number
    if isinstance(ts_raw, (int, float)):
        transparency_score_value = int(ts_raw)
        ts = {}
    else:
        ts = ts_raw if isinstance(ts_raw, dict) else {}
        raw_score = (
            ts.get("overall")
            or ts.get("score")
            or ts.get("overall_score")
            or 0
        )
        try:
            transparency_score_value = int(raw_score) if raw_score is not None else 0
        except (TypeError, ValueError):
            transparency_score_value = 0
    # Fallback: if score still 0 but executive summary mentions "XX/100", use it so UI matches narrative
    if transparency_score_value == 0 and final.get("executive_summary"):
        summary = final.get("executive_summary", "")
        match = re.search(r"\b(\d{1,3})\s*/\s*100\b", summary)
        if match:
            transparency_score_value = max(0, min(100, int(match.group(1))))
    breakdown = ts.get("breakdown", {})
    company_profile = state.get("company_profile", {})
    claims = state.get("claims_extracted", [])
    indep = state.get("independent_data", {})

    # Normalize findings (final_report uses 'findings_narrative')
    findings = [
        {
            "title": f.get("title", ""),
            "severity": f.get("severity", "medium").upper(),
            "narrative": f.get("narrative", ""),
            "evidence": [],
        }
        for f in final.get("findings_narrative", [])
    ]

    # Normalize positive observations (final_report uses 'positive_notes' list of strings)
    positive_observations = [
        {"title": note, "description": ""}
        for note in final.get("positive_notes", [])
    ]

    # Normalize data_gaps (final_report returns list of {gap, reason, impact}); safe for missing keys
    _raw_gaps = final.get("data_gaps") or []
    if not isinstance(_raw_gaps, list):
        _raw_gaps = []
    data_gaps = []
    for g in _raw_gaps:
        try:
            data_gaps.append(g.get("gap", str(g)) if isinstance(g, dict) else str(g))
        except Exception:
            data_gaps.append(str(g) if g is not None else "Unknown gap")

    # Build estimation_comparison from independent_data
    emission_estimates = indep.get("emission_estimates", {})
    ghgrp_emissions = indep.get("ghgrp_emissions", {})
    estimation_comparison = None
    estimated_total = float(
        emission_estimates.get("estimated_total_mtco2e")
        or emission_estimates.get("total_estimated")
        or 0
    )
    if emission_estimates.get("available") and estimated_total > 0:
        reported = 0.0
        if ghgrp_emissions.get("available") and ghgrp_emissions.get("total_emissions_mtco2e", 0) > 0:
            reported = float(ghgrp_emissions["total_emissions_mtco2e"])
        estimation_comparison = {
            "reported_total": reported,
            "estimated_total": estimated_total,
            "gap_explanation": (
                "The gap between EPA-reported facility emissions and the independent "
                "revenue-based estimate reflects unreported or unverified supply chain "
                "emissions (Scope 3 'dark matter')."
            ),
        }

    return {
        # Scores from cross_reference_analysis
        "transparency_score": transparency_score_value,
        "sub_scores": {
            "data_completeness": breakdown.get("completeness", 0),
            "consistency": breakdown.get("consistency", 0),
            "ambition": breakdown.get("ambition", 0),
            "verification": breakdown.get("verifiability", 0),
        },
        # Company metadata
        "industry": company_profile.get("industry", ""),
        # Narrative fields from final_report
        "executive_summary": final.get("executive_summary", ""),
        "score_context": final.get("score_context", {}),
        "methodology": final.get("methodology", ""),
        # Normalized collections
        "findings": findings,
        "positive_observations": positive_observations,
        "data_gaps": data_gaps,
        "estimation_comparison": estimation_comparison,
        # Raw agent outputs for dashboard charts
        "_raw": {
            "company_profile": company_profile,
            "claims_extracted": claims,
            "independent_data": indep,
            "cross_reference_analysis": cross_ref,
        },
    }


def _agent_summary(agent_index: int, state: dict) -> str:
    """Return a concise status message after an agent completes."""
    if agent_index == 0:
        profile = state.get("company_profile", {})
        parts = []
        fac = profile.get("facilities_found", 0)
        if fac:
            parts.append(f"Found {fac} EPA facilities")
        industry = profile.get("industry")
        if industry:
            parts.append(industry)
        rev = profile.get("revenue_usd")
        if rev and isinstance(rev, (int, float)):
            if rev >= 1e9:
                parts.append(f"${rev / 1e9:.1f}B revenue")
            elif rev >= 1e6:
                parts.append(f"${rev / 1e6:.1f}M revenue")
        return ", ".join(parts) if parts else "Company profile built"

    if agent_index == 1:
        claims = state.get("claims_extracted", [])
        if isinstance(claims, list):
            return f"Extracted {len(claims)} claims from sustainability report"
        return "Report extraction complete"

    if agent_index == 2:
        ind = state.get("independent_data", {})
        sources = []
        if ind.get("ghgrp_analysis"):
            sources.append("GHGRP")
        if ind.get("estimation"):
            sources.append("estimation engine")
        if ind.get("benchmarks"):
            sources.append("benchmarks")
        return f"Gathered independent data ({', '.join(sources)})" if sources else "Independent data gathered"

    if agent_index == 3:
        xref = state.get("cross_reference_analysis", {})
        score = xref.get("transparency_score", {}).get("overall")
        findings = xref.get("findings", [])
        parts = []
        if score is not None:
            parts.append(f"Transparency score: {score}/100")
        if findings:
            parts.append(f"{len(findings)} findings")
        return ", ".join(parts) if parts else "Cross-reference complete"

    if agent_index == 4:
        return "Final report generated"

    return "Complete"
