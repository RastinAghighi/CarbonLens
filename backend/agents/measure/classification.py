"""Measure Agent 2: Category Classification.

Takes normalized procurement items, uses Claude Sonnet to classify each
into GHG Protocol Scope 3 categories (1-15) and map to EPA EEIO sector
codes for emission factor lookup.

Input:  state["normalized_procurement"]
Output: state["classified_items"]
"""

import json
import os

import anthropic

MODEL = "claude-sonnet-4-20250514"

# These are the actual sector_codes in our eeio_factors database table.
AVAILABLE_SECTOR_CODES = """\
324110 - Petroleum refineries
324190 - Other petroleum and coal products
211120 - Crude petroleum extraction
221100 - Electric power generation
221200 - Natural gas distribution
331110 - Iron and steel mills
331310 - Alumina and aluminum production
331400 - Nonferrous metal production (copper, etc.)
325110 - Petrochemical manufacturing
325211 - Plastics material and resin mfg
325400 - Pharmaceutical and medicine mfg
326100 - Plastics product manufacturing
327310 - Cement manufacturing
327400 - Lime and gypsum product mfg
334400 - Semiconductor and electronic component
334410 - Semiconductor manufacturing
334412 - Bare printed circuit board mfg
334100 - Computer and peripheral equipment
336100 - Motor vehicle manufacturing
336400 - Aerospace product and parts mfg
481000 - Air transportation
484000 - Truck transportation
483000 - Water transportation (ocean freight)
482000 - Rail transportation
493000 - Warehousing and storage
511200 - Software publishers
518200 - Data processing and hosting
541100 - Legal services
541600 - Management consulting services
541700 - Scientific research and development
522000 - Financial services (banking)
524100 - Insurance carriers
722500 - Restaurants and food services
424100 - Paper and paper product wholesalers
453200 - Office supplies and stationery stores
311000 - Food manufacturing
312100 - Beverage manufacturing\
"""

SYSTEM_PROMPT = f"""\
You are an environmental accounting specialist. You will receive a JSON array
of normalized procurement line items. For EACH item, classify it into:

1. A GHG Protocol Scope 3 category (1-15):
   - Cat 1: Purchased goods and services
   - Cat 2: Capital goods
   - Cat 3: Fuel- and energy-related activities
   - Cat 4: Upstream transportation and distribution
   - Cat 5: Waste generated in operations
   - Cat 6: Business travel
   - Cat 7: Employee commuting
   - Cat 8: Upstream leased assets
   - Cat 9: Downstream transportation
   - Cat 10: Processing of sold products
   - Cat 11: Use of sold products
   - Cat 12: End-of-life treatment of sold products
   - Cat 13: Downstream leased assets
   - Cat 14: Franchises
   - Cat 15: Investments

2. An EPA EEIO sector code for emission factor lookup. You MUST choose from
   this exact list of available codes:

{AVAILABLE_SECTOR_CODES}

Pick the BEST matching sector code for each item. If nothing fits well,
use the closest reasonable match. If truly no match exists, set
ef_lookup_key to null.

Return ONLY a JSON array where each item is the original item PLUS these
added fields:
{{
  ...original fields...,
  "scope3_category": <integer 1-15>,
  "scope3_category_name": "<category name>",
  "ef_lookup_key": "<6-digit sector code or null>",
  "classification_reasoning": "<brief 1-sentence justification>"
}}

Return ONLY valid JSON — no markdown fencing, no commentary.\
"""


async def category_classification_agent(state: dict) -> dict:
    """Agent 2: Classify procurement items into Scope 3 categories and EEIO sectors.

    Input:  state["normalized_procurement"]
    Output: state["classified_items"]
    """
    items = state["normalized_procurement"]

    if not items:
        state["classified_items"] = []
        return state

    client = anthropic.Anthropic()

    # Process in batches if large, but our sample is ~50 items so one call is fine
    items_json = json.dumps(items, indent=2)

    response = client.messages.create(
        model=MODEL,
        max_tokens=16384,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Classify each of the following procurement line items into "
                    "GHG Protocol Scope 3 categories and map to EPA EEIO sector "
                    "codes.\n\n"
                    f"{items_json}"
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
        classified = json.loads(raw_text)
    except json.JSONDecodeError:
        classified = []
        state["classification_error"] = f"Failed to parse LLM response: {raw_text[:500]}"

    state["classified_items"] = classified
    return state
