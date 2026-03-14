"""Revenue-based emission estimation engine.

Copied verbatim from docs/ARCHITECTURE.md — ESTIMATION ENGINE section.
"""

SECTOR_INTENSITIES = {
    "Oil & Gas - Integrated": {"scope1_2_tco2e_per_m_revenue": 210, "scope3_multiplier": 5.5, "source": "IEA/EPA"},
    "Oil & Gas - Exploration & Production": {"scope1_2_tco2e_per_m_revenue": 280, "scope3_multiplier": 5.0, "source": "IEA/EPA"},
    "Technology - Internet Services": {"scope1_2_tco2e_per_m_revenue": 15, "scope3_multiplier": 3.2, "source": "EPA EEIO"},
    "Technology - Hardware": {"scope1_2_tco2e_per_m_revenue": 25, "scope3_multiplier": 4.0, "source": "EPA EEIO"},
    "Technology - Software": {"scope1_2_tco2e_per_m_revenue": 8, "scope3_multiplier": 3.5, "source": "EPA EEIO"},
    "Utilities - Electric": {"scope1_2_tco2e_per_m_revenue": 900, "scope3_multiplier": 0.3, "source": "EPA"},
    "Automotive": {"scope1_2_tco2e_per_m_revenue": 35, "scope3_multiplier": 6.0, "source": "EPA EEIO"},
    "Airlines": {"scope1_2_tco2e_per_m_revenue": 350, "scope3_multiplier": 0.5, "source": "IEA"},
    "Cement & Building Materials": {"scope1_2_tco2e_per_m_revenue": 800, "scope3_multiplier": 0.4, "source": "EPA"},
    "Steel & Metals": {"scope1_2_tco2e_per_m_revenue": 450, "scope3_multiplier": 1.5, "source": "EPA"},
    "Retail - General": {"scope1_2_tco2e_per_m_revenue": 10, "scope3_multiplier": 8.0, "source": "EPA EEIO"},
    "Pharmaceuticals": {"scope1_2_tco2e_per_m_revenue": 15, "scope3_multiplier": 4.5, "source": "EPA EEIO"},
    "Financial Services": {"scope1_2_tco2e_per_m_revenue": 5, "scope3_multiplier": 12.0, "source": "EPA EEIO"},
    "Food & Beverage": {"scope1_2_tco2e_per_m_revenue": 45, "scope3_multiplier": 5.5, "source": "EPA EEIO"},
    "Chemicals": {"scope1_2_tco2e_per_m_revenue": 200, "scope3_multiplier": 2.0, "source": "EPA"},
}


def estimate_emissions(revenue_usd: float, sector: str) -> dict:
    """Estimate Scope 1+2 and Scope 3 emissions from revenue and sector.

    Returns a dict with estimated values in MtCO2e, the method used,
    confidence level, and data source.
    """
    intensities = SECTOR_INTENSITIES.get(sector)
    if not intensities:
        return {"error": f"No benchmark for sector: {sector}"}
    revenue_m = revenue_usd / 1_000_000
    scope1_2 = revenue_m * intensities["scope1_2_tco2e_per_m_revenue"]
    scope3 = scope1_2 * intensities["scope3_multiplier"]
    return {
        "estimated_scope1_2_mtco2e": round(scope1_2, 1),
        "estimated_scope3_mtco2e": round(scope3, 1),
        "estimated_total_mtco2e": round(scope1_2 + scope3, 1),
        "method": "Revenue-based EEIO estimation",
        "confidence": "low",
        "source": intensities["source"],
    }
