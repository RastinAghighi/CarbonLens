"""End-to-end test: run Verify agents 1-4 on ExxonMobil and print results."""

import asyncio
import sys
import os

# Ensure backend/ is on the import path
sys.path.insert(0, os.path.dirname(__file__))

from agents.verify.company_intel import company_intelligence_agent
from agents.verify.report_extraction import report_extraction_agent
from agents.verify.independent_data import independent_data_agent
from agents.verify.cross_reference import cross_reference_agent


async def main():
    state = {"company_name": "ExxonMobil"}

    # ── Agent 1: Company Intelligence ──────────────────────────────────
    print("=" * 60)
    print("AGENT 1: Company Intelligence")
    print("=" * 60)
    state = await company_intelligence_agent(state)
    profile = state.get("company_profile", {})
    print(f"  Company:  {profile.get('name', 'N/A')}")
    print(f"  Industry: {profile.get('industry', 'N/A')}")
    print(f"  Revenue:  {profile.get('revenue_usd', 'N/A')}")
    print()

    # ── Agent 2: Report Extraction ─────────────────────────────────────
    print("=" * 60)
    print("AGENT 2: Report Extraction")
    print("=" * 60)
    state = await report_extraction_agent(state)
    claims = state.get("claims_extracted", [])
    print(f"  Claims extracted: {len(claims)}")
    for i, c in enumerate(claims):
        print(f"    [{i}] ({c.get('category', '?')}) {c.get('text', '')[:80]}")
    print()

    # ── Agent 3: Independent Data ──────────────────────────────────────
    print("=" * 60)
    print("AGENT 3: Independent Data")
    print("=" * 60)
    state = await independent_data_agent(state)
    ind = state.get("independent_data", {})
    ghgrp = ind.get("ghgrp_emissions", {})
    print(f"  GHGRP facilities: {ghgrp.get('facilities_count', 0)}")
    print(f"  GHGRP total (mtCO2e): {ghgrp.get('total_emissions_mtco2e', 'N/A')}")
    est = ind.get("emission_estimates", {})
    if est.get("available"):
        print(f"  Estimated Scope 1+2: {est.get('estimated_scope1_2_mtco2e')} mtCO2e")
        print(f"  Estimated Scope 3:   {est.get('estimated_scope3_mtco2e')} mtCO2e")
    print(f"  Data sources: {ind.get('data_sources', [])}")
    print()

    # ── Agent 4: Cross-Reference & Scoring ─────────────────────────────
    print("=" * 60)
    print("AGENT 4: Cross-Reference & Scoring")
    print("=" * 60)
    state = await cross_reference_agent(state)
    analysis = state.get("cross_reference_analysis", {})

    # Transparency Score
    score = analysis.get("transparency_score", {})
    breakdown = score.get("breakdown", {})
    print()
    print("  TRANSPARENCY SCORE")
    print(f"    Overall:       {score.get('overall', 'N/A')} / 100")
    print(f"    Completeness:  {breakdown.get('completeness', 'N/A')} / 100  (25%)")
    print(f"    Consistency:   {breakdown.get('consistency', 'N/A')} / 100  (30%)")
    print(f"    Verifiability: {breakdown.get('verifiability', 'N/A')} / 100  (25%)")
    print(f"    Ambition:      {breakdown.get('ambition', 'N/A')} / 100  (20%)")
    print(f"    Confidence:    {score.get('confidence', 'N/A')} — {score.get('confidence_rationale', '')}")
    print()

    # Findings
    findings = analysis.get("findings", [])
    print(f"  FINDINGS ({len(findings)} total)")
    for f in findings:
        sev = f.get("severity", "?").upper()
        ftype = f.get("type", "?")
        title = f.get("title", "Untitled")
        print(f"    [{sev}] {ftype}: {title}")
    print()

    # Positive observations
    positives = analysis.get("positive_observations", [])
    if positives:
        print(f"  POSITIVE OBSERVATIONS ({len(positives)})")
        for p in positives:
            print(f"    + {p}")
        print()

    # Summary
    summary = analysis.get("analysis_summary", "")
    if summary:
        print("  ANALYSIS SUMMARY")
        print(f"    {summary}")
        print()

    # Data limitations
    limitations = analysis.get("data_limitations", "")
    if limitations:
        print("  DATA LIMITATIONS")
        print(f"    {limitations}")


if __name__ == "__main__":
    asyncio.run(main())
