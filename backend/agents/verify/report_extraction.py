"""Verify Agent 2: Report Extraction Agent.

Simulates extracting quantitative environmental claims from a company's
sustainability report using Claude's knowledge of publicly available disclosures.

Input:  state["company_name"], state["company_profile"]
Output: state["claims_extracted"]
"""

import json
import os

import anthropic

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are an expert sustainability report analyst. Your task is to generate the
quantitative environmental claims that a specific company has made in their
publicly available sustainability reports and ESG disclosures.

Based on your knowledge of the company's real, publicly available sustainability
reports and disclosures, generate the quantitative environmental claims they
have made. Be specific and realistic - use actual numbers this company has
published. If you are not confident about an exact figure, use your best
estimate based on the company's sector, size, and known commitments, but keep
it realistic.

Return ONLY a valid JSON array (no markdown fencing, no commentary). Each element
must be an object with ALL of the following fields:

- "text": the full claim as it would appear in the report (1-2 sentences)
- "category": one of "emissions_reduction", "renewable_energy", "water",
  "waste", "net_zero_target", "carbon_intensity", "supply_chain",
  "biodiversity", "circular_economy"
- "scope": one of "scope_1", "scope_2", "scope_3", "scope_1_2",
  "scope_1_2_3", "non_ghg", or "all_scopes"
- "metric_type": one of "absolute", "intensity", "percentage", "target",
  "cumulative"
- "value": the numeric value as a number (not a string)
- "unit": the unit of measurement (e.g., "MtCO2e", "tCO2e", "%",
  "kWh", "gallons", "tonnes", "MWh", "GJ")
- "baseline_year": the baseline or reference year as an integer (e.g., 2019)
- "page": the simulated page number in the report as an integer

Generate between 8 and 15 claims that cover a realistic mix of:
- Scope 1 and Scope 2 absolute emissions
- Scope 3 emissions (if the company reports them)
- Emission reduction targets and progress
- Renewable energy usage or procurement
- Water usage or reduction (if relevant to the industry)
- Waste diversion or circular economy metrics (if relevant)
- Carbon intensity metrics

Ensure claims are internally consistent (e.g., Scope 1+2 should roughly equal
Scope 1 + Scope 2, reduction percentages should align with absolute numbers).\
"""


async def report_extraction_agent(state: dict) -> dict:
    """Agent 2: Extract quantitative claims from sustainability reports.

    Uses Claude to simulate report extraction based on its knowledge of the
    company's publicly available sustainability disclosures.

    Input:  state["company_name"], state["company_profile"]
    Output: state["claims_extracted"]
    """
    company_name = state["company_name"]
    profile = state.get("company_profile", {})

    # Build context from Agent 1's output
    context_parts = [
        f"Company: {company_name}",
        f"Industry: {profile.get('industry', 'Unknown')}",
        f"Revenue: ${profile.get('revenue_usd', 0):,.0f} ({profile.get('revenue_year', 'N/A')})",
        f"Headquarters: {profile.get('headquarters', 'Unknown')}",
        f"Employees: {profile.get('employees', 'N/A')}",
    ]

    if profile.get("sustainability_report_title"):
        context_parts.append(
            f"Latest report: {profile['sustainability_report_title']} "
            f"({profile.get('sustainability_report_year', 'N/A')})"
        )

    if profile.get("known_climate_commitments"):
        context_parts.append(
            "Known commitments: " + "; ".join(profile["known_climate_commitments"])
        )

    if profile.get("ghgrp_data", {}).get("facilities_found", 0) > 0:
        ghgrp = profile["ghgrp_data"]
        context_parts.append(
            f"EPA GHGRP data: {ghgrp['facilities_found']} facilities, "
            f"{ghgrp.get('total_emissions_mtco2e', 0):.1f} MtCO2e total reported"
        )

    if profile.get("business_segments"):
        context_parts.append(
            "Business segments: " + ", ".join(profile["business_segments"])
        )

    user_message = (
        "Based on your knowledge of this company's publicly available "
        "sustainability reports and ESG disclosures, generate the quantitative "
        "environmental claims they have made.\n\n"
        + "\n".join(context_parts)
    )

    # Call Claude Sonnet
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text = response.content[0].text.strip()

    # Strip markdown fencing if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]  # drop first ``` line
        if raw_text.endswith("```"):
            raw_text = raw_text[: raw_text.rfind("```")]
        raw_text = raw_text.strip()

    try:
        claims = json.loads(raw_text)
    except json.JSONDecodeError:
        claims = [
            {
                "text": f"Unable to parse claims for {company_name}",
                "category": "emissions_reduction",
                "scope": "scope_1_2",
                "metric_type": "absolute",
                "value": 0,
                "unit": "MtCO2e",
                "baseline_year": 2023,
                "page": 1,
                "parse_error": True,
                "raw_response": raw_text[:500],
            }
        ]

    # Validate and normalize each claim
    required_fields = [
        "text", "category", "scope", "metric_type", "value", "unit",
        "baseline_year", "page",
    ]
    validated_claims = []
    for claim in claims:
        if not isinstance(claim, dict):
            continue
        # Ensure all required fields exist
        for field in required_fields:
            if field not in claim:
                claim[field] = None
        # Coerce numeric fields
        if claim["value"] is not None:
            try:
                claim["value"] = float(claim["value"])
            except (TypeError, ValueError):
                claim["value"] = 0
        if claim["baseline_year"] is not None:
            try:
                claim["baseline_year"] = int(claim["baseline_year"])
            except (TypeError, ValueError):
                claim["baseline_year"] = None
        if claim["page"] is not None:
            try:
                claim["page"] = int(claim["page"])
            except (TypeError, ValueError):
                claim["page"] = 1
        validated_claims.append(claim)

    state["claims_extracted"] = validated_claims
    return state
