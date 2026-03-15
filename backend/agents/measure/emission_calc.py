"""Measure Agent 3: Emission Factor Lookup & Calculation.

PURE PYTHON - NO LLM CALLS.

Queries SQLite for emission factors via core.database.query_eeio_factor,
calculates emissions_kgco2e = amount_usd * ef_kgco2e_per_usd.
Every result includes the full calculation formula string for traceability.
Items with no matching factor are flagged as "no_emission_factor".

Input:  state["classified_items"]
Output: state["calculated_items"]
"""

from core.database import query_eeio_factor


async def emission_factor_calculate(state: dict) -> dict:
    """Agent 3: Look up emission factors and calculate emissions.

    Input:  state["classified_items"]
    Output: state["calculated_items"]
    """
    classified = state.get("classified_items", [])
    calculated = []

    for item in classified:
        ef_lookup_key = item.get("ef_lookup_key")
        amount_usd = item.get("amount_usd")

        result = {**item}

        # Validate amount
        if amount_usd is None or not isinstance(amount_usd, (int, float)) or amount_usd <= 0:
            result["emissions_kgco2e"] = None
            result["emission_factor"] = None
            result["calculation_formula"] = None
            result["calculation_status"] = "invalid_amount"
            result["calculation_note"] = f"Invalid or missing amount_usd: {amount_usd}"
            calculated.append(result)
            continue

        # Look up emission factor
        if not ef_lookup_key:
            result["emissions_kgco2e"] = None
            result["emission_factor"] = None
            result["calculation_formula"] = None
            result["calculation_status"] = "no_emission_factor"
            result["calculation_note"] = "No EEIO sector code assigned during classification"
            calculated.append(result)
            continue

        factor = query_eeio_factor(ef_lookup_key)

        if factor is None:
            result["emissions_kgco2e"] = None
            result["emission_factor"] = None
            result["calculation_formula"] = None
            result["calculation_status"] = "no_emission_factor"
            result["calculation_note"] = (
                f"No emission factor found in database for sector_code '{ef_lookup_key}'"
            )
            calculated.append(result)
            continue

        # Calculate emissions
        ef_value = factor["ef_kgco2e_per_usd"]
        emissions_kgco2e = amount_usd * ef_value

        result["emissions_kgco2e"] = round(emissions_kgco2e, 2)
        result["emission_factor"] = {
            "sector_code": factor["sector_code"],
            "sector_name": factor["sector_name"],
            "ef_kgco2e_per_usd": ef_value,
            "ef_year": factor.get("ef_year"),
            "source": factor.get("source", "EPA_EEIO"),
        }
        result["calculation_formula"] = (
            f"{amount_usd} USD × {ef_value} kgCO2e/USD "
            f"(sector: {factor['sector_code']} - {factor['sector_name']}) "
            f"= {round(emissions_kgco2e, 2)} kgCO2e"
        )
        result["calculation_status"] = "calculated"
        result["calculation_note"] = None

        calculated.append(result)

    state["calculated_items"] = calculated
    return state
