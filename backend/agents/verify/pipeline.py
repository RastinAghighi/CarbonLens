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
    return _jobs.get(job_id)


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
        job["result"] = state.get("final_report", state)

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
