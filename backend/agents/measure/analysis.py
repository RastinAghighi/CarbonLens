"""Measure Agent 4: Analysis & Recommendations.

Takes calculated items, computes aggregations (by category, by supplier,
totals) in pure Python, then uses Claude Sonnet to generate hotspot
analysis and actionable recommendations.

Input:  state["calculated_items"]
Output: state["analysis"]
"""

import json
import os

import anthropic

MODEL = "claude-sonnet-4-20250514"

SCOPE3_CATEGORY_NAMES = {
    1: "Purchased goods and services",
    2: "Capital goods",
    3: "Fuel- and energy-related activities",
    4: "Upstream transportation and distribution",
    5: "Waste generated in operations",
    6: "Business travel",
    7: "Employee commuting",
    8: "Upstream leased assets",
    9: "Downstream transportation",
    10: "Processing of sold products",
    11: "Use of sold products",
    12: "End-of-life treatment of sold products",
    13: "Downstream leased assets",
    14: "Franchises",
    15: "Investments",
}

SYSTEM_PROMPT = """\
You are a carbon accounting analyst. You will receive pre-computed emission
aggregations from a company's procurement data. Your job is to:

1. Identify the top emission hotspots and explain WHY they are significant.
2. Provide specific, actionable recommendations to reduce emissions.

Return ONLY valid JSON (no markdown fencing) with this structure:
{
  "hotspots": [
    {
      "type": "<category | supplier | item>",
      "title": "<short title>",
      "description": "<2-3 sentences explaining the hotspot and why it matters>",
      "emissions_kgco2e": <number>,
      "percent_of_total": <number>
    }
  ],
  "recommendations": [
    {
      "priority": <1-5, 1 = highest>,
      "target": "<what to change — specific supplier, category, or practice>",
      "recommendation": "<specific actionable recommendation>",
      "potential_reduction_percent": "<estimated % reduction, e.g. '10-20%'>",
      "difficulty": "<low | medium | high>",
      "timeframe": "<short-term | medium-term | long-term>"
    }
  ],
  "data_quality_summary": "<brief assessment of overall data quality and gaps>"
}\
"""


def _compute_aggregations(items: list[dict]) -> dict:
    """Compute aggregations from calculated items using pure Python."""
    calculated = [i for i in items if i.get("calculation_status") == "calculated"]
    unfactored = [i for i in items if i.get("calculation_status") == "no_emission_factor"]
    invalid = [i for i in items if i.get("calculation_status") == "invalid_amount"]

    total_emissions = sum(i["emissions_kgco2e"] for i in calculated)
    total_spend = sum(i.get("amount_usd", 0) for i in items if isinstance(i.get("amount_usd"), (int, float)))

    # By Scope 3 category
    by_category: dict[int, dict] = {}
    for item in calculated:
        cat = item.get("scope3_category", 0)
        if cat not in by_category:
            by_category[cat] = {
                "category_number": cat,
                "category_name": SCOPE3_CATEGORY_NAMES.get(cat, f"Category {cat}"),
                "emissions_kgco2e": 0.0,
                "spend_usd": 0.0,
                "item_count": 0,
                "top_contributors": [],
            }
        by_category[cat]["emissions_kgco2e"] += item["emissions_kgco2e"]
        by_category[cat]["spend_usd"] += item.get("amount_usd", 0)
        by_category[cat]["item_count"] += 1
        by_category[cat]["top_contributors"].append({
            "supplier": item.get("supplier_name", "Unknown"),
            "description": item.get("description", ""),
            "emissions_kgco2e": item["emissions_kgco2e"],
        })

    # Sort contributors within each category and keep top 3
    for cat_data in by_category.values():
        cat_data["top_contributors"].sort(key=lambda x: x["emissions_kgco2e"], reverse=True)
        cat_data["top_contributors"] = cat_data["top_contributors"][:3]
        cat_data["emissions_kgco2e"] = round(cat_data["emissions_kgco2e"], 2)
        cat_data["spend_usd"] = round(cat_data["spend_usd"], 2)
        if total_emissions > 0:
            cat_data["percent_of_total"] = round(
                cat_data["emissions_kgco2e"] / total_emissions * 100, 1
            )
        else:
            cat_data["percent_of_total"] = 0.0

    by_category_list = sorted(
        by_category.values(), key=lambda x: x["emissions_kgco2e"], reverse=True
    )

    # By supplier
    by_supplier: dict[str, dict] = {}
    for item in calculated:
        supplier = item.get("supplier_name", "Unknown")
        if supplier not in by_supplier:
            by_supplier[supplier] = {
                "supplier_name": supplier,
                "total_emissions_kgco2e": 0.0,
                "total_spend_usd": 0.0,
                "item_count": 0,
            }
        by_supplier[supplier]["total_emissions_kgco2e"] += item["emissions_kgco2e"]
        by_supplier[supplier]["total_spend_usd"] += item.get("amount_usd", 0)
        by_supplier[supplier]["item_count"] += 1

    for s_data in by_supplier.values():
        s_data["total_emissions_kgco2e"] = round(s_data["total_emissions_kgco2e"], 2)
        s_data["total_spend_usd"] = round(s_data["total_spend_usd"], 2)
        if s_data["total_spend_usd"] > 0:
            s_data["emission_intensity_kgco2e_per_usd"] = round(
                s_data["total_emissions_kgco2e"] / s_data["total_spend_usd"], 4
            )
        else:
            s_data["emission_intensity_kgco2e_per_usd"] = 0.0
        if total_emissions > 0:
            s_data["percent_of_total"] = round(
                s_data["total_emissions_kgco2e"] / total_emissions * 100, 1
            )
        else:
            s_data["percent_of_total"] = 0.0

    by_supplier_list = sorted(
        by_supplier.values(), key=lambda x: x["total_emissions_kgco2e"], reverse=True
    )

    # Add rank
    for rank, s in enumerate(by_supplier_list, 1):
        s["rank"] = rank

    return {
        "summary": {
            "total_scope3_kgco2e": round(total_emissions, 2),
            "total_scope3_tco2e": round(total_emissions / 1000, 2),
            "total_spend_usd": round(total_spend, 2),
            "line_items_processed": len(items),
            "line_items_calculated": len(calculated),
            "line_items_no_factor": len(unfactored),
            "line_items_invalid": len(invalid),
        },
        "by_scope3_category": by_category_list,
        "by_supplier": by_supplier_list,
    }


async def analysis_recommendation_agent(state: dict) -> dict:
    """Agent 4: Compute aggregations and generate analysis with recommendations.

    Input:  state["calculated_items"]
    Output: state["analysis"]
    """
    items = state.get("calculated_items", [])

    # Step 1: Pure Python aggregations
    aggregations = _compute_aggregations(items)

    # Step 2: Use Claude for hotspot analysis and recommendations
    client = anthropic.Anthropic()

    agg_json = json.dumps(aggregations, indent=2)

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Analyze the following emission aggregations from a "
                    "procurement-based Scope 3 calculation. Identify hotspots "
                    "and provide specific recommendations.\n\n"
                    f"{agg_json}"
                ),
            }
        ],
    )

    raw_text = response.content[0].text.strip()

    # Strip markdown fencing if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
        if raw_text.endswith("```"):
            raw_text = raw_text[: raw_text.rfind("```")]
        raw_text = raw_text.strip()

    try:
        llm_analysis = json.loads(raw_text)
    except json.JSONDecodeError:
        llm_analysis = {
            "hotspots": [],
            "recommendations": [],
            "data_quality_summary": "Failed to generate analysis",
            "parse_error": raw_text[:500],
        }

    # Combine pure-Python aggregations with LLM analysis
    state["analysis"] = {
        **aggregations,
        "hotspots": llm_analysis.get("hotspots", []),
        "recommendations": llm_analysis.get("recommendations", []),
        "data_quality_summary": llm_analysis.get("data_quality_summary", ""),
        "confidence": "medium",
        "caveat": (
            "Emissions calculated using EPA EEIO spend-based factors. "
            "Actual emissions may vary based on specific supplier practices, "
            "energy sources, and production methods."
        ),
    }

    return state
