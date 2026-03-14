"""Verify Agent 3: Independent Data Agent.

Gathers independent verification data from local databases and estimation
engine (CODE — not LLM), then uses Claude Sonnet for news/third-party
findings only.

Input:  state["company_name"], state["company_profile"], state["claims_extracted"]
Output: state["independent_data"]
"""

import json
import os

import anthropic

from core.database import query_ghgrp_facilities, query_industry_benchmark
from core.estimation_engine import estimate_emissions

MODEL = "claude-sonnet-4-20250514"

NEWS_SYSTEM_PROMPT = """\
You are an environmental research analyst. Given a company name, its sector,
and its extracted sustainability claims, provide a summary of relevant
third-party findings about the company's environmental record.

Return ONLY valid JSON (no markdown fencing, no commentary) with this exact structure:

{
  "cdp_score": "<letter grade A through F, or 'Not disclosed' if unknown>",
  "science_based_targets": {
    "status": "<Committed | Targets Set | Targets Validated | Not committed | Unknown>",
    "details": "<brief description of SBTi status>"
  },
  "controversies": [
    {
      "title": "<short title>",
      "description": "<1-2 sentence description>",
      "year": <year as integer or null>,
      "severity": "<high | medium | low>"
    }
  ],
  "third_party_ratings": [
    {
      "source": "<rating agency or index name>",
      "rating": "<the rating or score>",
      "year": <year as integer or null>
    }
  ],
  "regulatory_actions": [
    {
      "agency": "<regulatory body>",
      "action": "<brief description>",
      "year": <year as integer or null>
    }
  ],
  "notable_findings": "<2-3 sentence summary of the most important third-party findings about this company's environmental performance>"
}

Be factual. Only include information you are confident about from your training
data. If you are unsure about a specific item, omit it rather than fabricate it.\
"""


def _aggregate_ghgrp_data(facilities: list[dict]) -> dict:
    """Aggregate GHGRP facility data for the independent data section.

    Sums total emissions for the most recent year and computes year-over-year
    trend if multiple years exist.
    """
    if not facilities:
        return {
            "available": False,
            "facilities_count": 0,
            "most_recent_year": None,
            "total_emissions_mtco2e": 0,
            "facilities": [],
            "year_over_year_trend": None,
        }

    # Group by year
    yearly_totals: dict[int, float] = {}
    yearly_facilities: dict[int, list[dict]] = {}
    for f in facilities:
        yr = f["reporting_year"]
        yearly_totals[yr] = yearly_totals.get(yr, 0) + f["total_emissions_mtco2e"]
        yearly_facilities.setdefault(yr, []).append(f)

    most_recent_year = max(yearly_totals.keys())
    total_recent = yearly_totals[most_recent_year]

    # Build facility list for most recent year (top 10)
    recent = sorted(
        yearly_facilities[most_recent_year],
        key=lambda f: f["total_emissions_mtco2e"],
        reverse=True,
    )
    facility_list = [
        {
            "facility_name": f["facility_name"],
            "city": f["city"],
            "state": f["state"],
            "emissions_mtco2e": round(f["total_emissions_mtco2e"], 2),
            "naics_code": f.get("naics_code"),
            "industry_sector": f.get("industry_sector"),
        }
        for f in recent[:10]
    ]

    # Year-over-year trend
    trend = None
    sorted_years = sorted(yearly_totals.keys())
    if len(sorted_years) >= 2:
        trend_data = {yr: round(yearly_totals[yr], 2) for yr in sorted_years}
        prev_year = sorted_years[-2]
        prev_total = yearly_totals[prev_year]
        if prev_total > 0:
            pct_change = ((total_recent - prev_total) / prev_total) * 100
            trend = {
                "yearly_totals_mtco2e": trend_data,
                "latest_change_pct": round(pct_change, 1),
                "direction": "increasing" if pct_change > 0 else "decreasing",
            }
        else:
            trend = {
                "yearly_totals_mtco2e": trend_data,
                "latest_change_pct": None,
                "direction": "unknown",
            }

    return {
        "available": True,
        "source": "EPA GHGRP (local database)",
        "facilities_count": len(recent),
        "most_recent_year": most_recent_year,
        "total_emissions_mtco2e": round(total_recent, 2),
        "facilities": facility_list,
        "year_over_year_trend": trend,
    }


def _get_industry_benchmark(sector: str) -> dict:
    """Query local industry benchmarks for the given sector."""
    benchmark = query_industry_benchmark(sector)
    if not benchmark:
        return {
            "available": False,
            "sector": sector,
            "message": f"No benchmark data found for sector: {sector}",
        }

    return {
        "available": True,
        "source": benchmark.get("source", "Industry Benchmarks DB"),
        "sector": benchmark["sector"],
        "year": benchmark.get("year"),
        "avg_intensity_tco2e_per_m_revenue": benchmark.get("avg_intensity_tco2e_per_m_revenue"),
        "median_intensity": benchmark.get("median_intensity"),
        "p25_intensity": benchmark.get("p25_intensity"),
        "p75_intensity": benchmark.get("p75_intensity"),
        "sample_size": benchmark.get("sample_size"),
    }


def _get_emission_estimates(revenue_usd: float, sector: str) -> dict:
    """Run the revenue-based estimation engine."""
    if not revenue_usd or revenue_usd <= 0:
        return {
            "available": False,
            "message": "No revenue data available for estimation",
        }

    result = estimate_emissions(revenue_usd, sector)
    if "error" in result:
        return {
            "available": False,
            "message": result["error"],
        }

    result["available"] = True
    result["revenue_used_usd"] = revenue_usd
    result["sector_used"] = sector
    return result


async def independent_data_agent(state: dict) -> dict:
    """Agent 3: Gather independent verification data.

    Steps 1-3 use CODE (database queries, Python functions).
    Step 4 uses Claude Sonnet for news/third-party findings only.

    Input:  state["company_name"], state["company_profile"], state["claims_extracted"]
    Output: state["independent_data"]
    """
    company_name = state["company_name"]
    profile = state.get("company_profile", {})
    claims = state.get("claims_extracted", [])
    sector = profile.get("industry", "Unknown")
    revenue = profile.get("revenue_usd", 0)

    # ── Step 1: Query local GHGRP database (CODE) ─────────────────────
    facilities = query_ghgrp_facilities(company_name)
    ghgrp_data = _aggregate_ghgrp_data(facilities)

    # ── Step 2: Query local industry benchmarks (CODE) ────────────────
    benchmark_data = _get_industry_benchmark(sector)

    # ── Step 3: Revenue-based emission estimation (CODE) ──────────────
    estimation_data = _get_emission_estimates(revenue, sector)

    # ── Step 4: News & third-party findings (LLM) ─────────────────────
    claims_summary = []
    for c in claims[:10]:
        claims_summary.append(
            f"- [{c.get('category', 'unknown')}] {c.get('text', '')}"
        )
    claims_text = "\n".join(claims_summary) if claims_summary else "No claims extracted."

    user_message = (
        f"Company: {company_name}\n"
        f"Sector: {sector}\n"
        f"Revenue: ${revenue:,.0f}\n"
        f"Headquarters: {profile.get('headquarters', 'Unknown')}\n\n"
        f"Extracted sustainability claims:\n{claims_text}\n\n"
        f"Provide third-party findings about this company's environmental record."
    )

    client = anthropic.Anthropic()

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=NEWS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text = response.content[0].text.strip()

    # Strip markdown fencing if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
        if raw_text.endswith("```"):
            raw_text = raw_text[: raw_text.rfind("```")]
        raw_text = raw_text.strip()

    try:
        news_data = json.loads(raw_text)
    except json.JSONDecodeError:
        news_data = {
            "parse_error": "LLM response was not valid JSON",
            "raw_response": raw_text[:500],
            "cdp_score": "Unknown",
            "science_based_targets": {"status": "Unknown", "details": ""},
            "controversies": [],
            "third_party_ratings": [],
            "regulatory_actions": [],
            "notable_findings": "",
        }

    news_data["source"] = "Claude LLM (training knowledge)"

    # ── Assemble independent_data ─────────────────────────────────────
    state["independent_data"] = {
        "ghgrp_emissions": ghgrp_data,
        "industry_benchmark": benchmark_data,
        "emission_estimates": estimation_data,
        "news_and_third_party": news_data,
        "data_sources": [
            *(["EPA GHGRP (local database)"] if ghgrp_data["available"] else []),
            *(["Industry Benchmarks (local database)"] if benchmark_data["available"] else []),
            *(["Revenue-based EEIO estimation"] if estimation_data["available"] else []),
            "Claude LLM (third-party findings)",
        ],
    }

    return state
