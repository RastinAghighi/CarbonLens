"""Measure Agent 1: Data Ingestion.

Takes raw CSV text, uses Claude Sonnet to parse and normalize messy
procurement data. Detects columns, handles inconsistent formatting,
excludes header/subtotal/blank rows.

Input:  state["raw_input"] (raw CSV string)
Output: state["normalized_procurement"] (clean JSON array of line items)
"""

import json
import os

import anthropic

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are a procurement data normalization specialist. You will receive raw CSV
text from a procurement/purchasing spreadsheet. Your job is to parse it into
a clean, normalized JSON array of line items.

RULES:
1. Detect column headers automatically — they may be in the first row or
   embedded in the data.
2. EXCLUDE any rows that are:
   - Column headers
   - Subtotal / total / summary rows
   - Blank or empty rows
   - Notes-only rows with no line-item data
3. For each valid line item, extract and normalize into this exact JSON schema:
   {
     "supplier_name": "<cleaned vendor/supplier name>",
     "description": "<item description>",
     "amount_usd": <numeric dollar amount as a number, no $ or commas>,
     "quantity": <numeric quantity or null if not provided>,
     "unit": "<unit of measure or null>",
     "location": "<ship-from / origin location or null>",
     "po_number": "<purchase order number or null>",
     "date": "<date in ISO format YYYY-MM-DD or null>",
     "data_quality": "<high | medium | low>"
   }
4. data_quality rules:
   - "high": supplier, description, amount, quantity, and unit are all present
   - "medium": supplier, description, and amount present but quantity or unit missing
   - "low": amount or description is missing/unclear
5. If a supplier name is missing but can be inferred from surrounding rows
   (e.g., same PO prefix), infer it.
6. Clean up inconsistent location formatting (e.g., "Gary IN" → "Gary, IN",
   "Shenzhen China" → "Shenzhen, China").
7. Return ONLY the JSON array — no markdown fencing, no commentary.\
"""


async def data_ingestion_agent(state: dict) -> dict:
    """Agent 1: Parse and normalize raw procurement CSV data.

    Input:  state["raw_input"]
    Output: state["normalized_procurement"]
    """
    raw_input = state["raw_input"]

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

    response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Parse the following procurement CSV data into a normalized "
                    "JSON array of line items. Exclude headers, subtotals, "
                    "blank rows, and summary rows.\n\n"
                    f"```csv\n{raw_input}\n```"
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
        normalized = json.loads(raw_text)
    except json.JSONDecodeError:
        normalized = []
        state["ingestion_error"] = f"Failed to parse LLM response as JSON: {raw_text[:500]}"

    state["normalized_procurement"] = normalized
    return state
