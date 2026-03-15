from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend directory before any imports that use env vars (e.g. Anthropic client)
load_dotenv(Path(__file__).resolve().parent / ".env")

import json
import os
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import db

from agents.verify.pipeline import create_job, get_job, run_pipeline_in_background
from agents.measure.pipeline import (
    create_job as measure_create_job,
    get_job as measure_get_job,
    run_pipeline_in_background as measure_run_pipeline,
)

app = FastAPI(title="CarbonLens", version="0.1.0")


@app.on_event("startup")
async def startup_event():
    db.init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Gemini 429 / quota handling ───────────────────────────────────────

def _is_gemini_429_or_quota(exc: BaseException) -> bool:
    """True if the exception looks like a Gemini 429 / quota / rate-limit error."""
    msg = (getattr(exc, "message", None) or str(exc)).lower()
    return (
        "429" in msg
        or "resource exhausted" in msg
        or "resource_exhausted" in msg
        or "quota" in msg
        or "rate limit" in msg
        or "rate_limit" in msg
    )


# Canned fallback answers for landing-page chat when Gemini returns 429.
_LANDING_429_FALLBACKS = [
    # (keywords in user message, answer)
    (
        ["verify", "what does verify", "verify mode", "what does verify do"],
        "Verify mode analyzes any company's sustainability claims. You enter a company name; "
        "CarbonLens cross-references public disclosures, EPA GHGRP data, industry benchmarks, "
        "and third-party sources to produce a Transparency Score (0–100) with detailed findings.",
    ),
    (
        ["measure", "what does measure", "measure mode", "what does measure do"],
        "Measure mode calculates your Scope 3 supply chain emissions. Upload a CSV or Excel file "
        "of procurement or spend data; CarbonLens maps each line to EPA emission factors and "
        "outputs a full Scope 3 breakdown, supplier rankings, and reduction recommendations.",
    ),
    (
        ["how long", "how fast", "how much time", "analysis take", "how long does"],
        "Analysis typically completes in a few minutes. CarbonLens runs multiple AI agents in "
        "parallel and uses public data sources, so you get results without the months-long "
        "delays of traditional consulting or manual ESG audits.",
    ),
    (
        ["faster", "why carbonlens", "traditional esg", "vs traditional", "quicker"],
        "CarbonLens is faster than traditional ESG tools because it automates data gathering "
        "and cross-referencing with AI, uses public EPA and DEFRA data, and runs analysis in "
        "minutes instead of requiring consultants or manual report reviews.",
    ),
]


def _landing_canned_reply_for_429(last_user_message: str) -> str | None:
    """If the last user message matches a common product question, return a canned reply; else None."""
    if not last_user_message or not last_user_message.strip():
        return None
    lower = last_user_message.strip().lower()
    for keywords, answer in _LANDING_429_FALLBACKS:
        if any(kw in lower for kw in keywords):
            return answer
    return None


# User-facing message when Gemini is rate-limited (no canned answer available).
_GEMINI_429_MESSAGE = (
    "The AI assistant is temporarily at capacity (rate limit). Please try again in a minute or two."
)


# ── Gemini system prompts ─────────────────────────────────────────────

_LANDING_SYSTEM = """\
You are the CarbonLens product guide — a concise, friendly assistant helping \
users understand CarbonLens, an AI-powered supply chain emissions intelligence \
platform.

CarbonLens has two modes:
1. **Verify** — Analyzes any company's sustainability claims. The user enters \
a company name; CarbonLens cross-references public disclosures, EPA GHGRP \
facility data, industry benchmarks, and third-party sources to produce a \
Transparency Score (0–100) with detailed findings.
2. **Measure** — Calculates your own Scope 3 supply chain emissions. Upload a \
CSV or Excel file of procurement/spend data; CarbonLens maps each line item to \
EPA emission factors and outputs a full Scope 3 breakdown, supplier rankings, \
and reduction recommendations.

Key facts:
- No consultants or $50K enterprise contracts needed
- Results in minutes, not months
- EPA GHGRP, DEFRA, GHG Protocol emission factors used
- Greenwashing detection built in

Answer questions briefly (2-4 sentences). Be practical and specific.\
"""

_ANALYST_SYSTEM_BASE = """\
You are the CarbonLens AI Analyst — an expert in corporate sustainability, \
ESG reporting, and climate disclosure analysis. You have been given a \
structured ESG transparency analysis report.

Your role: help users understand the analysis by answering questions clearly \
and concisely in plain language.

Guidelines:
- Be direct — cite specific numbers, scores, and findings from the report
- Explain jargon briefly when needed (e.g., "Scope 3 = supply chain emissions")
- Be balanced — acknowledge both strengths and concerns
- Keep responses focused (3-5 sentences, or a short list when appropriate)
- If asked about something not in the report, say so clearly\
"""


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CarbonLens"}


# ── AI Chat endpoint ──────────────────────────────────────────────────
# NOTE: POST /api/chat must be deployed for Verify AI Analyst and landing
# guide to work. If you see 404 in production, redeploy the backend.


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str = "landing"          # "landing" | "report"
    report_data: Optional[dict] = None


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"reply": "AI assistant is not configured (GEMINI_API_KEY missing)."}

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        # Build system instruction
        if req.context == "report" and req.report_data:
            # Condense report data to keep prompt size manageable
            compact = {k: v for k, v in req.report_data.items() if k != "_raw"}
            raw = req.report_data.get("_raw", {})
            compact["_summary"] = {
                "claims_count": len(raw.get("claims_extracted", [])),
                "ghgrp_available": raw.get("independent_data", {}).get("ghgrp_emissions", {}).get("available"),
                "cdp_score": raw.get("independent_data", {}).get("news_and_third_party", {}).get("cdp_score"),
                "sbt_status": raw.get("independent_data", {}).get("news_and_third_party", {}).get("science_based_targets", {}).get("status"),
                "top_facilities": raw.get("company_profile", {}).get("ghgrp_data", {}).get("top_facilities", [])[:3],
                "benchmark_sector": raw.get("independent_data", {}).get("industry_benchmark", {}).get("sector"),
                "controversies": raw.get("independent_data", {}).get("news_and_third_party", {}).get("controversies", []),
            }
            system_instruction = (
                _ANALYST_SYSTEM_BASE
                + "\n\n## Report Data\n```json\n"
                + json.dumps(compact, indent=2)[:12000]   # cap at ~12k chars
                + "\n```"
            )
        else:
            system_instruction = _LANDING_SYSTEM

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_instruction,
        )

        # Build history (all messages except the last one)
        history = []
        for msg in req.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})

        chat = model.start_chat(history=history)
        last = req.messages[-1].content
        response = chat.send_message(last)
        return {"reply": response.text}

    except Exception as e:
        if _is_gemini_429_or_quota(e):
            if req.context == "landing" and req.messages:
                canned = _landing_canned_reply_for_429(req.messages[-1].content)
                if canned:
                    return {"reply": canned}
            return {"reply": _GEMINI_429_MESSAGE}
        return {"reply": f"Assistant error: {str(e)}"}


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
        "company_name": job.get("company_name"),
        "status": job["status"],
        "current_agent": job["current_agent"],
        "agents": job["agents"],
        "result": job["result"],
    }


# ── Measure endpoints ────────────────────────────────────────────────


@app.post("/api/measure")
async def start_measure(file: UploadFile = File(...)):
    content = await file.read()
    file_text = content.decode("utf-8", errors="replace")
    job_id = measure_create_job(file_text)
    measure_run_pipeline(job_id)
    return {"job_id": job_id}


@app.get("/api/measure/{job_id}")
async def get_measure_status(job_id: str):
    job = measure_get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "current_agent": job["current_agent"],
        "agents": job["agents"],
        "result": job["result"],
    }
