"""Verify Agent 1: Company Intelligence Agent.

Takes state["company_name"], queries local GHGRP data, calls Claude Sonnet
to build a company profile, and returns state with company_profile added.
"""

import json
import os

import anthropic

from core.database import query_ghgrp_facilities

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are a corporate sustainability research analyst. Given a company name,
produce a detailed company profile in JSON format using your training knowledge.

Return ONLY valid JSON (no markdown fencing, no commentary) with this exact structure:

{
  "name": "<official company name>",
  "ticker": "<stock ticker or null>",
  "industry": "<primary industry sector - must match one of: Oil & Gas - Integrated, Oil & Gas - Exploration & Production, Technology - Internet Services, Technology - Hardware, Technology - Software, Utilities - Electric, Automotive, Airlines, Cement & Building Materials, Steel & Metals, Retail - General, Pharmaceuticals, Financial Services, Food & Beverage, Chemicals>",
  "headquarters": "<city, state/country>",
  "revenue_usd": <most recent annual revenue in USD as a number>,
  "revenue_year": <year of that revenue figure>,
  "employees": <approximate employee count as a number>,
  "business_segments": ["<segment 1>", "<segment 2>", ...],
  "key_regions": ["<region 1>", "<region 2>", ...],
  "sustainability_report_title": "<title of their most recent sustainability/ESG report or null>",
  "sustainability_report_year": <year of that report or null>,
  "known_climate_commitments": ["<commitment 1>", "<commitment 2>", ...],
  "controversies": ["<relevant environmental controversy 1>", ...]
}

Be factual. Use real, publicly known data from your training. If you are unsure
about a specific number, give your best estimate and round to reasonable precision.
Do NOT fabricate commitments or controversies - only include ones you are confident about.\
"""


def _summarize_ghgrp(facilities: list[dict]) -> dict:
    """Aggregate GHGRP facility data into a summary dict."""
    if not facilities:
        return {
            "facilities_found": 0,
            "total_emissions_mtco2e": 0,
            "reporting_years": [],
            "top_facilities": [],
            "states": [],
            "industry_sectors": [],
        }

    total = sum(f["total_emissions_mtco2e"] for f in facilities)
    years = sorted(set(f["reporting_year"] for f in facilities))
    states = sorted(set(f["state"] for f in facilities))
    sectors = sorted(set(f["industry_sector"] for f in facilities))

    # Top 10 facilities by emissions (use most recent year if multi-year)
    latest_year = max(years)
    latest = [f for f in facilities if f["reporting_year"] == latest_year]
    latest.sort(key=lambda f: f["total_emissions_mtco2e"], reverse=True)
    top = [
        {
            "facility_name": f["facility_name"],
            "city": f["city"],
            "state": f["state"],
            "total_emissions_mtco2e": round(f["total_emissions_mtco2e"], 2),
            "industry_sector": f["industry_sector"],
        }
        for f in latest[:10]
    ]

    # Year-over-year totals (for trend analysis)
    yearly_totals = {}
    for f in facilities:
        yr = f["reporting_year"]
        yearly_totals[yr] = yearly_totals.get(yr, 0) + f["total_emissions_mtco2e"]
    yearly_totals = {yr: round(v, 2) for yr, v in sorted(yearly_totals.items())}

    return {
        "facilities_found": len(latest),
        "total_facilities_all_years": len(facilities),
        "total_emissions_mtco2e": round(sum(f["total_emissions_mtco2e"] for f in latest), 2),
        "reporting_years": years,
        "yearly_totals_mtco2e": yearly_totals,
        "top_facilities": top,
        "states": states,
        "industry_sectors": sectors,
    }


async def company_intelligence_agent(state: dict) -> dict:
    """Agent 1: Build a company profile from LLM knowledge + local GHGRP data.

    Input:  state["company_name"]
    Output: state["company_profile"]
    """
    company_name = state["company_name"]

    # ── Step 1: Query local GHGRP database ──────────────────────────────
    facilities = query_ghgrp_facilities(company_name)
    ghgrp_summary = _summarize_ghgrp(facilities)

    # ── Step 2: Call Claude Sonnet for company profile ──────────────────
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

    user_message = (
        f"Produce the company profile JSON for: {company_name}\n\n"
        f"I already have EPA GHGRP data showing {ghgrp_summary['facilities_found']} "
        f"reporting facilities with total emissions of "
        f"{ghgrp_summary.get('total_emissions_mtco2e', 0):.1f} MtCO2e. "
        f"You do NOT need to estimate facility emissions - just provide the "
        f"corporate profile fields."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    # Parse the JSON from Claude's response
    raw_text = response.content[0].text.strip()

    # Strip markdown fencing if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]  # drop first ``` line
        if raw_text.endswith("```"):
            raw_text = raw_text[: raw_text.rfind("```")]
        raw_text = raw_text.strip()

    try:
        llm_profile = json.loads(raw_text)
    except json.JSONDecodeError:
        llm_profile = {
            "name": company_name,
            "parse_error": "LLM response was not valid JSON",
            "raw_response": raw_text[:500],
        }

    # ── Step 3: Merge LLM profile + GHGRP data into company_profile ────
    company_profile = {
        # Core identity (from LLM)
        "name": llm_profile.get("name", company_name),
        "ticker": llm_profile.get("ticker"),
        "industry": llm_profile.get("industry", "Unknown"),
        "headquarters": llm_profile.get("headquarters", "Unknown"),
        "revenue_usd": llm_profile.get("revenue_usd", 0),
        "revenue_year": llm_profile.get("revenue_year"),
        "employees": llm_profile.get("employees", 0),
        "business_segments": llm_profile.get("business_segments", []),
        "key_regions": llm_profile.get("key_regions", []),
        # Sustainability context (from LLM)
        "sustainability_report_title": llm_profile.get("sustainability_report_title"),
        "sustainability_report_year": llm_profile.get("sustainability_report_year"),
        "known_climate_commitments": llm_profile.get("known_climate_commitments", []),
        "controversies": llm_profile.get("controversies", []),
        # EPA GHGRP data (from local database)
        "ghgrp_data": ghgrp_summary,
        # Metadata
        "data_sources": [
            "Claude LLM (training knowledge)",
            *(["EPA GHGRP (local database)"] if ghgrp_summary["facilities_found"] > 0 else []),
        ],
        "facilities_found": ghgrp_summary["facilities_found"],
    }

    state["company_profile"] = company_profile
    return state
