"""Verify Agent 5: Report Generation Agent.

Takes the full accumulated state (company_profile, claims_extracted,
independent_data, cross_reference_analysis) and produces a polished,
human-readable transparency report suitable for non-expert audiences.

Uses Claude Sonnet for narrative generation — no tool calls.

Input:  all of state (agents 1-4 outputs)
Output: state["final_report"]
"""

import json
import os

import anthropic

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are a sustainability transparency report writer. You will receive the \
complete analysis of a company's environmental claims, including:

1. **company_profile** — basic info (sector, revenue, headquarters, facilities)
2. **claims_extracted** — quantitative sustainability claims from the company's \
own reports
3. **independent_data** — EPA GHGRP facility emissions, industry benchmarks, \
revenue-based estimates, third-party ratings, and news
4. **cross_reference_analysis** — forensic findings, transparency score with \
breakdown, positive observations, and data limitations

Your task: transform this raw analysis into a polished, human-readable \
transparency report that a non-expert (journalist, investor, concerned \
citizen) can understand.

## Writing Guidelines

- **Fair and evidence-based.** This is forensic analysis, not activism. \
Present facts and let them speak. Avoid loaded language.
- **Plain language.** If you must use a technical term (Scope 1, GHGRP, \
intensity metric), define it briefly in parentheses on first use.
- **Concrete.** Cite specific numbers, percentages, and comparisons. \
Avoid vague statements like "the company could do better."
- **Balanced.** Acknowledge what the company does well alongside concerns. \
No report should be entirely negative or positive.
- **Structured.** Each section should stand on its own so readers can \
skim to the part they care about.

## Output Format

Return ONLY valid JSON (no markdown fencing, no commentary) with this exact \
structure:

{
  "executive_summary": "<2-3 sentences summarizing the single most important \
takeaway from this analysis. Lead with the transparency score and its meaning, \
then the key finding. Write for someone who will only read this paragraph.>",

  "score_context": {
    "overall": "<1-2 sentences interpreting the overall transparency score — \
what does this number mean in practical terms?>",
    "completeness": "<1-2 sentences: what does the company disclose, and what \
is missing?>",
    "consistency": "<1-2 sentences: do the company's numbers match independent \
data?>",
    "verifiability": "<1-2 sentences: can the company's claims be checked \
against outside sources?>",
    "ambition": "<1-2 sentences: are the company's targets meaningful and \
backed by action?>"
  },

  "findings_narrative": [
    {
      "title": "<clear, descriptive title for this finding>",
      "severity": "<high | medium | low>",
      "narrative": "<1-2 paragraph narrative explaining this finding in plain \
language. Include: what the company claims, what the independent data shows, \
and why the gap matters. A reader with no climate expertise should understand \
this.>"
    }
  ],

  "positive_notes": [
    "<each item is a 1-2 sentence acknowledgment of something the company does \
well, with specific evidence>"
  ],

  "data_gaps": [
    {
      "gap": "<what couldn't be verified>",
      "reason": "<why — e.g., no GHGRP match, company is private, report not \
publicly available>",
      "impact": "<how this gap affects the analysis — e.g., 'This means we \
cannot independently confirm Scope 1 emissions'>"
    }
  ],

  "methodology": "<2-3 sentence summary of how this analysis was conducted. \
Mention: data sources used (EPA GHGRP, industry benchmarks, company reports), \
the cross-referencing approach, and the scoring framework. This helps the \
reader understand the basis for the conclusions.>"
}\
"""


async def report_generation_agent(state: dict) -> dict:
    """Agent 5: Generate a polished, human-readable transparency report.

    Pure narrative generation over accumulated state — no tool calls.
    Uses Claude Sonnet for clear, accessible writing.

    Input:  state (all outputs from agents 1-4)
    Output: state["final_report"]
    """
    company_profile = state.get("company_profile", {})
    claims_extracted = state.get("claims_extracted", [])
    independent_data = state.get("independent_data", {})
    cross_reference_analysis = state.get("cross_reference_analysis", {})

    user_message = (
        "Generate a polished transparency report from this analysis.\n\n"
        "## Company Profile\n"
        f"```json\n{json.dumps(company_profile, indent=2)}\n```\n\n"
        "## Extracted Claims (from company reports)\n"
        f"```json\n{json.dumps(claims_extracted, indent=2)}\n```\n\n"
        "## Independent Data\n"
        f"```json\n{json.dumps(independent_data, indent=2)}\n```\n\n"
        "## Cross-Reference Analysis (findings & scores)\n"
        f"```json\n{json.dumps(cross_reference_analysis, indent=2)}\n```\n\n"
        "Transform this into a clear, readable transparency report. "
        "Write for a non-expert audience. Be fair, specific, and evidence-based."
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
        final_report = json.loads(raw_text)
    except json.JSONDecodeError:
        final_report = {
            "parse_error": "LLM response was not valid JSON",
            "raw_response": raw_text[:2000],
            "executive_summary": "Report generation encountered a parsing error. "
            "The raw analysis data is still available.",
            "score_context": {
                "overall": "Score interpretation unavailable due to parsing error.",
                "completeness": "Unavailable.",
                "consistency": "Unavailable.",
                "verifiability": "Unavailable.",
                "ambition": "Unavailable.",
            },
            "findings_narrative": [],
            "positive_notes": [],
            "data_gaps": [],
            "methodology": "Analysis was conducted using EPA GHGRP data, industry "
            "benchmarks, and company self-reported claims, but the final report "
            "could not be formatted correctly.",
        }

    state["final_report"] = final_report
    return state
