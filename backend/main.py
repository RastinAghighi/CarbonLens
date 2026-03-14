from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.verify.pipeline import create_job, get_job, run_pipeline_in_background

app = FastAPI(title="CarbonLens", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CarbonLens"}


# ── Verify endpoints ─────────────────────────────────────────────────


class VerifyRequest(BaseModel):
    company_name: str


@app.post("/api/verify")
async def start_verify(req: VerifyRequest):
    job_id = create_job(req.company_name)
    run_pipeline_in_background(job_id)
    return {"job_id": job_id}


@app.get("/api/verify/{job_id}")
async def get_verify_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "current_agent": job["current_agent"],
        "agents": job["agents"],
        "result": job["result"],
    }
