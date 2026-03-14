"""Measure pipeline: chains all 4 measure agents with status tracking."""

import asyncio
import traceback
import uuid

from .data_ingestion import data_ingestion_agent
from .classification import category_classification_agent
from .emission_calc import emission_factor_calculate
from .analysis import analysis_recommendation_agent

# In-memory job store: job_id -> job dict
_jobs: dict[str, dict] = {}

AGENT_DEFS = [
    {"name": "Data Ingestion", "fn": data_ingestion_agent},
    {"name": "Category Classification", "fn": category_classification_agent},
    {"name": "Emission Calculation", "fn": emission_factor_calculate},
    {"name": "Analysis & Recommendations", "fn": analysis_recommendation_agent},
]


def _make_agents_status() -> list[dict]:
    return [{"name": a["name"], "status": "pending", "message": None} for a in AGENT_DEFS]


def create_job(file_content: str) -> str:
    """Create a new measure job and return its ID."""
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "running",
        "current_agent": 1,
        "agents": _make_agents_status(),
        "result": None,
    }
    # Store file content separately (not returned in status)
    _jobs[job_id]["_file_content"] = file_content
    return job_id


def get_job(job_id: str) -> dict | None:
    return _jobs.get(job_id)


async def _run_pipeline(job_id: str) -> None:
    """Execute the 4-agent pipeline, updating job status as we go."""
    job = _jobs[job_id]
    state = {"raw_input": job["_file_content"]}

    try:
        for i, agent_def in enumerate(AGENT_DEFS):
            job["current_agent"] = i + 1
            job["agents"][i]["status"] = "running"
            job["agents"][i]["message"] = f"Running {agent_def['name']}..."

            state = await agent_def["fn"](state)

            # Debug: print state keys after each agent completes
            print(f"\n[DEBUG] Agent {i+1} ({agent_def['name']}) complete.")
            print(f"[DEBUG]   State keys: {list(state.keys())}")
            for key in state:
                val = state[key]
                if isinstance(val, list):
                    print(f"[DEBUG]   state['{key}']: list with {len(val)} items")
                elif isinstance(val, dict):
                    print(f"[DEBUG]   state['{key}']: dict with keys {list(val.keys())[:5]}")
                elif isinstance(val, str) and len(val) > 200:
                    print(f"[DEBUG]   state['{key}']: str ({len(val)} chars)")
                else:
                    print(f"[DEBUG]   state['{key}']: {repr(val)[:100]}")

            job["agents"][i]["status"] = "complete"
            job["agents"][i]["message"] = _agent_summary(i, state)

        job["status"] = "complete"
        job["result"] = state.get("analysis", state)

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
        items = state.get("normalized_procurement", [])
        return f"Parsed {len(items)} line items from procurement data"

    if agent_index == 1:
        items = state.get("classified_items", [])
        categories = set(i.get("scope3_category") for i in items if i.get("scope3_category"))
        return f"Classified {len(items)} items into {len(categories)} Scope 3 categories"

    if agent_index == 2:
        items = state.get("calculated_items", [])
        calculated = [i for i in items if i.get("calculation_status") == "calculated"]
        no_factor = [i for i in items if i.get("calculation_status") == "no_emission_factor"]
        total = sum(i.get("emissions_kgco2e", 0) for i in calculated)
        msg = f"Calculated emissions for {len(calculated)} items ({total:,.0f} kgCO2e)"
        if no_factor:
            msg += f", {len(no_factor)} items missing factors"
        return msg

    if agent_index == 3:
        analysis = state.get("analysis", {})
        summary = analysis.get("summary", {})
        total_tco2e = summary.get("total_scope3_tco2e", 0)
        hotspots = analysis.get("hotspots", [])
        recs = analysis.get("recommendations", [])
        return (
            f"Total: {total_tco2e:,.1f} tCO2e, "
            f"{len(hotspots)} hotspots, {len(recs)} recommendations"
        )

    return "Complete"
