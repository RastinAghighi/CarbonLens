"""Verify Agent 4: Cross-Reference & Scoring Agent.

Takes ALL accumulated state (company_profile, claims_extracted, independent_data)
and produces a forensic cross-reference analysis with a Transparency Score.

Uses Claude OPUS for reasoning-intensive cross-referencing.

Input:  state["company_profile"], state["claims_extracted"], state["independent_data"]
Output: state["cross_reference_analysis"] with transparency_score and findings
"""

import json
import os

import anthropic

MODEL = "claude-opus-4-20250514"

SYSTEM_PROMPT = """\
You are a forensic carbon-accounting analyst. You will receive three structured \
JSON inputs about a company:

1. **company_profile** - basic info (sector, revenue, headquarters, facilities)
2. **claims_extracted** - quantitative sustainability claims pulled from the \
company's own reports (each has an index you can reference)
3. **independent_data** - EPA GHGRP facility emissions, industry benchmarks, \
revenue-based emission estimates, third-party ratings, and news

Your task: cross-reference the company's claims against the independent data \
and produce a forensic analysis.

## Finding Types

Check for ALL of the following. Only include a finding if you have concrete \
evidence for it:

1. **INTENSITY_VS_ABSOLUTE** - Company reports intensity metric improvements \
(e.g., "reduced emissions per unit of revenue") while absolute emissions \
actually increased. This is a common greenwashing tactic.
2. **MISSING_SCOPE** - Company omits Scope 3 from reduction targets or \
headline emissions numbers. Scope 3 is often 80-95% of total emissions for \
many sectors.
3. **BOUNDARY_EXCLUSION** - Company excludes subsidiaries, joint ventures, \
acquired entities, or specific divisions from its emissions boundary.
4. **BASELINE_MANIPULATION** - Cherry-picked or retroactively adjusted \
baseline year (e.g., choosing a high-emission year as baseline to inflate \
apparent reductions).
5. **EPA_DISCREPANCY** - Company's self-reported numbers conflict with EPA \
GHGRP facility-level data. Compare GHGRP totals against the company's \
reported Scope 1 for the relevant year.
6. **UNVERIFIABLE_CLAIM** - Major claims (large reductions, net-zero targets, \
renewable energy percentages) with no independent data to cross-reference.
7. **SELECTIVE_REPORTING** - Company highlights positive metrics while \
omitting negative trends visible in the independent data (e.g., rising \
methane, increasing absolute emissions).
8. **TARGET_WITHOUT_PLAN** - Ambitious long-term targets (e.g., "net-zero by \
2050") without interim milestones, capital expenditure plans, or demonstrated \
year-over-year progress.
9. **OFFSET_RELIANCE** - Emission reductions achieved primarily through \
carbon offsets or RECs rather than operational/engineering changes.

## Scoring Methodology

Score the company on four dimensions (each 0-100):

- **Completeness (25%)**: Does the company report all scopes (1, 2, 3)? All \
facilities? Full boundary disclosure? Are methodologies described?
- **Consistency (30%)**: Do the company's numbers align with independent \
data (GHGRP, benchmarks, estimates)? Are figures internally consistent \
across different parts of the report?
- **Verifiability (25%)**: What percentage of the company's major claims can \
be cross-referenced against independent sources? Are there third-party \
audits or certifications?
- **Ambition (20%)**: Are targets aligned with science-based pathways (1.5C \
or well-below 2C)? Is there demonstrated year-over-year progress, not just \
future promises?

**Overall Transparency Score** = weighted average of the four dimensions.

## Critical Rules

- **ONLY flag findings where you have concrete evidence. Never speculate.**
- **Every finding MUST cite a specific data point** from the company's claims \
or the independent data.
- **Distinguish between "the company is wrong" and "the company uses a \
different methodology."** Methodology differences are medium-severity at most.
- **Acknowledge where the company IS transparent or doing well.** Include \
positive observations in your analysis summary.
- If independent data is limited (e.g., no GHGRP matches, no benchmarks), \
state this clearly and adjust confidence/scoring accordingly.

## Output Format

Return ONLY valid JSON (no markdown fencing, no commentary) with this exact \
structure:

{
  "transparency_score": {
    "overall": <integer 0-100>,
    "breakdown": {
      "completeness": <integer 0-100>,
      "consistency": <integer 0-100>,
      "verifiability": <integer 0-100>,
      "ambition": <integer 0-100>
    },
    "confidence": "<high | medium | low>",
    "confidence_rationale": "<why this confidence level - based on data availability>"
  },
  "findings": [
    {
      "severity": "<high | medium | low>",
      "type": "<one of the 9 finding types above>",
      "title": "<short descriptive title>",
      "description": "<detailed explanation of the finding - 2-4 sentences>",
      "claim_refs": [<integer indices of relevant claims from claims_extracted>],
      "evidence": [
        {
          "source": "<data source name>",
          "detail": "<specific data point or comparison>",
          "url": "<url if available, otherwise null>"
        }
      ]
    }
  ],
  "positive_observations": [
    "<things the company is doing well or being transparent about>"
  ],
  "analysis_summary": "<3-5 sentence overall assessment of the company's transparency and environmental reporting quality>",
  "data_limitations": "<note any gaps in independent data that limited the analysis>"
}\
"""


async def cross_reference_agent(state: dict) -> dict:
    """Agent 4: Cross-reference claims against independent data and score.

    Pure reasoning over accumulated state - no tool calls, no database access.
    Uses Claude Opus for deep analytical reasoning.

    Input:  state["company_profile"], state["claims_extracted"], state["independent_data"]
    Output: state["cross_reference_analysis"]
    """
    company_profile = state.get("company_profile", {})
    claims_extracted = state.get("claims_extracted", [])
    independent_data = state.get("independent_data", {})

    # Build the user message with all accumulated state
    user_message = (
        "Perform a forensic cross-reference analysis of this company's "
        "sustainability claims against independent data.\n\n"
        "## Company Profile\n"
        f"```json\n{json.dumps(company_profile, indent=2)}\n```\n\n"
        "## Extracted Claims (from company reports)\n"
        f"```json\n{json.dumps(claims_extracted, indent=2)}\n```\n\n"
        "## Independent Data\n"
        f"```json\n{json.dumps(independent_data, indent=2)}\n```\n\n"
        "Cross-reference the claims against the independent data. "
        "Produce your findings and transparency score."
    )

    client = anthropic.Anthropic()

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
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
        cross_reference_analysis = json.loads(raw_text)
    except json.JSONDecodeError:
        cross_reference_analysis = {
            "parse_error": "LLM response was not valid JSON",
            "raw_response": raw_text[:2000],
            "transparency_score": {
                "overall": 0,
                "breakdown": {
                    "completeness": 0,
                    "consistency": 0,
                    "verifiability": 0,
                    "ambition": 0,
                },
                "confidence": "low",
                "confidence_rationale": "Failed to parse LLM output",
            },
            "findings": [],
            "positive_observations": [],
            "analysis_summary": "Analysis could not be completed due to a parsing error.",
            "data_limitations": "LLM output was not valid JSON.",
        }

    state["cross_reference_analysis"] = cross_reference_analysis
    return state
