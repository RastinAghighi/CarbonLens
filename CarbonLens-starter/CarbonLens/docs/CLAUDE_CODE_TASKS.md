# CarbonLens — Claude Code Task List

## How to use this file:
1. Open Claude Code in the /home/claude/CarbonLens directory (or wherever you clone the project)
2. Give Claude Code ONE task at a time from the list below
3. After each task, REVIEW the output before moving to the next task
4. If something is wrong, fix it before proceeding
5. Each task references specific files in docs/ for context

---

## TASK 1: Project setup and dependencies

"Set up the Python backend and React frontend for CarbonLens. 

Backend: Create a Python project in /backend with FastAPI. Create requirements.txt with: fastapi, uvicorn, anthropic, python-multipart, langraph, langgraph, sqlite3 (stdlib). Create a basic main.py with a health check endpoint. Create __init__.py files in agents/, agents/verify/, agents/measure/, core/.

Frontend: Initialize a React + Vite project in /frontend with TypeScript disabled (plain JSX). Install tailwindcss. Create a basic App.jsx that renders 'CarbonLens' as a heading.

Don't build any features yet. Just get both servers running."

**Done when:** `uvicorn main:app --reload` works and `npm run dev` serves a page that says CarbonLens.

---

## TASK 2: Database initialization script

"Read docs/ARCHITECTURE.md — specifically the DATABASE SCHEMAS section and the ESTIMATION ENGINE section. 

Create backend/scripts/init_database.py that:
1. Creates a SQLite database at backend/data/carbonlens.db
2. Creates all 4 tables (eeio_factors, defra_factors, ghgrp_facilities, industry_benchmarks)
3. Populates industry_benchmarks with the SECTOR_INTENSITIES data from the architecture doc (convert the Python dict into INSERT statements)
4. For eeio_factors: create ~30-40 representative rows covering major sectors. Use realistic EPA EEIO emission factors. Key sectors needed: petroleum refining, steel mills, aluminum, plastics, semiconductor manufacturing, PCB manufacturing, air transportation, truck transportation, ocean freight, software publishers, legal services, management consulting, food services, office supplies, insurance. The emission factors should be in kgCO2e per USD.
5. For defra_factors: create ~20 rows for common activity-based factors: electricity (kWh), natural gas (therm), air travel domestic (passenger-km), air travel international (passenger-km), hotel nights, car rental (km), truck freight (tonne-km), ocean freight (tonne-km), rail freight (tonne-km).
6. Leave ghgrp_facilities empty for now (we'll load real data in Task 3).

Print a summary of what was created when the script runs."

**Done when:** Running `python scripts/init_database.py` creates the database and you can query `SELECT COUNT(*) FROM eeio_factors` and get rows back.

---

## TASK 3: Load EPA GHGRP data for demo companies

"Create backend/scripts/load_ghgrp_data.py that populates the ghgrp_facilities table with realistic facility data for our demo companies.

We need data for at least these companies:
- ExxonMobil (primary demo): ~40-50 facilities. Mix of refineries, chemical plants, natural gas processing. Total emissions should be roughly 70-80M tCO2e across all facilities. Largest facilities: Baytown TX refinery (~12M tCO2e), Baton Rouge LA refinery (~8M tCO2e), Beaumont TX refinery (~6M tCO2e). Include facility names, cities, states, NAICS codes, and emissions breakdowns (CO2, CH4, N2O).
- Shell: ~30 facilities, total ~45M tCO2e
- Amazon: ~15 facilities (data centers), total ~5M tCO2e  
- Chevron: ~35 facilities, total ~55M tCO2e

Also create backend/data/company_aliases.json using the COMPANY_ALIASES dict from docs/ARCHITECTURE.md.

Use realistic but synthetic data — we're simulating what EPA GHGRP data looks like. Include multiple reporting years (2021, 2022, 2023) for ExxonMobil so the trend analysis works."

**Done when:** You can query `SELECT parent_company, SUM(total_emissions_mtco2e) FROM ghgrp_facilities WHERE parent_company LIKE '%Exxon%' GROUP BY reporting_year` and get meaningful results.

---

## TASK 4: Core utility modules

"Create these utility modules in backend/core/:

1. backend/core/database.py — Database connection helper. A function get_db() that returns a SQLite connection to backend/data/carbonlens.db. Helper functions: query_eeio_factor(sector_code), query_defra_factor(category, subcategory), query_ghgrp_facilities(company_name) that handles alias matching using company_aliases.json, query_industry_benchmark(sector).

2. backend/core/estimation_engine.py — The estimate_emissions() function from docs/ARCHITECTURE.md. Takes revenue_usd and sector string, returns estimated emissions dict.

3. backend/core/schemas.py — Pydantic models for: VerifyRequest (company_name: str), MeasureRequest (file upload), JobStatus (job_id, status, current_agent, agents list, result), VerifyResult (matching the verify output schema in ARCHITECTURE.md), MeasureResult (matching the measure output schema).

Read docs/ARCHITECTURE.md for the exact schemas and estimation engine code."

**Done when:** You can import from all three modules and run `estimate_emissions(344_600_000_000, "Oil & Gas - Integrated")` and get a reasonable result.

---

## TASK 5: Verify Agent 1 — Company Intelligence Agent

"Build backend/agents/verify/company_intel.py.

Read the Agent 1 prompt from docs/ARCHITECTURE.md (Verify Mode Agent Pipeline section). This agent:
- Takes state dict with company_name
- Uses Claude Sonnet API to research the company
- Queries local SQLite (ghgrp_facilities table) for EPA facility data
- Returns state with company_profile added

For the hackathon, this agent does NOT need real web search. Instead:
- Use Claude to generate the company profile from its training knowledge (industry, revenue, segments)
- Query the LOCAL ghgrp_facilities SQLite table for facility data
- The company_profile output should match the JSON schema in the agent prompt

Create the agent as a plain Python async function: async def company_intelligence_agent(state: dict) -> dict

Use the anthropic Python SDK. Model: claude-sonnet-4-20250514."

**Done when:** You can call `company_intelligence_agent({"company_name": "ExxonMobil"})` and get back a state dict with a populated company_profile.

---

## TASK 6: Verify Agent 2 — Report Extraction Agent

"Build backend/agents/verify/report_extraction.py.

This agent extracts quantitative environmental claims from a sustainability report. For the hackathon, we will NOT download real PDFs. Instead:
- Use Claude to simulate extracting claims based on its knowledge of the company's public sustainability reports
- The system prompt should instruct Claude to generate realistic claims that this company would actually make in their sustainability report
- Every claim must include: text, category, scope, metric_type, value, unit, baseline_year, page (simulated page numbers are fine)

The prompt should be the Report Extraction Agent prompt (for the hackathon adaptation, tell Claude: 'Based on your knowledge of [company]'s publicly available sustainability reports and disclosures, generate the quantitative environmental claims they have made.')

Output: state.claims_extracted (array of claim objects)

Use claude-sonnet-4-20250514."

**Done when:** Running the agent for ExxonMobil produces 15-30 realistic environmental claims with proper structure.

---

## TASK 7: Verify Agent 3 — Independent Data Agent

"Build backend/agents/verify/independent_data.py.

This agent gathers independent verification data. It:
- Queries LOCAL SQLite for GHGRP facility emissions (using core/database.py helper)
- Queries LOCAL SQLite for industry benchmarks
- Calls core/estimation_engine.py to get revenue-based emission estimates
- Uses Claude to generate relevant news/third-party findings based on its knowledge

The agent should assemble all independent data into the output schema from the Agent 3 prompt in docs/ARCHITECTURE.md. 

Key: the GHGRP data and estimation engine results must come from CODE (database queries and Python functions), NOT from the LLM. Only the news/third-party section should use Claude.

Use claude-sonnet-4-20250514 for the news research portion only."

**Done when:** Running on ExxonMobil returns GHGRP facility totals from your database, industry benchmark comparison, estimation engine output, AND news findings.

---

## TASK 8: Verify Agent 4 — Cross-Reference & Scoring Agent

"Build backend/agents/verify/cross_reference.py.

This is the most important agent. It takes ALL accumulated state (company_profile, claims_extracted, independent_data) and produces the forensic cross-reference analysis.

Use the Cross-Reference & Scoring Agent prompt from the architecture planning. This is the FULL prompt with all 9 finding types (INTENSITY_VS_ABSOLUTE, MISSING_SCOPE, BOUNDARY_EXCLUSION, etc.) and the scoring methodology (Completeness 25%, Consistency 30%, Verifiability 25%, Ambition 20%).

This agent uses Claude OPUS: claude-opus-4-20250514. It's the reasoning-heavy step that justifies the cost.

Output: state.cross_reference_analysis with transparency_score and findings array.

CRITICAL: The prompt must include the rule 'ONLY flag findings where you have concrete evidence. Never speculate. Every finding must cite a specific data point.'"

**Done when:** Running the full pipeline (Agents 1-4) on ExxonMobil produces a transparency score and 4-8 specific findings with evidence citations.

---

## TASK 9: Verify Agent 5 — Report Generation Agent  

"Build backend/agents/verify/report_generation.py.

This agent takes the full state and produces the final human-readable report. Use the Report Generation Agent prompt from the architecture docs.

Output: state.final_report with executive_summary, score_context, findings_narrative, positive_notes, data_gaps, methodology.

Use claude-sonnet-4-20250514."

**Done when:** The full 5-agent Verify pipeline produces a complete, well-written transparency report.

---

## TASK 10: Verify pipeline orchestration + API endpoint

"Create backend/agents/verify/pipeline.py that chains all 5 verify agents together.

Then update backend/main.py to add:
- POST /api/verify — accepts {company_name}, starts the pipeline in a background thread, returns {job_id}
- GET /api/verify/{job_id} — returns current status including which agent is running, status messages, and the final result when complete

Use a simple in-memory dict to track jobs. Each agent updates the job status as it starts/completes. The status response should include:
{
  job_id: string,
  status: 'running' | 'complete' | 'error',
  current_agent: number (1-5),
  agents: [{name, status: 'pending'|'running'|'complete'|'error', message, summary}],
  result: null | final_verify_result
}

Test by calling POST /api/verify with 'ExxonMobil' and polling the status endpoint."

**Done when:** You can start a verify job via API and poll until it completes with a full result.

---

## TASK 11: Frontend — Landing page

"Read docs/frontend_design_spec.md — Screen 1 (Landing / Home) section.

Build the landing page in frontend/src/ following the design spec exactly. Two mode cards side by side — Verify with a text input and Analyze button, Measure with a file upload zone and Calculate button. Stats bar at the bottom with the three research statistics.

Use Tailwind CSS. Font: Inter from Google Fonts. Color system from the design spec (teal #0D9488 primary, etc.).

No backend connection yet — just the static UI."

**Done when:** The landing page matches the design spec and looks professional, not like a hackathon toy.

---

## TASK 12: Frontend — Verify progress + results pages

"Read docs/frontend_design_spec.md — Screen 2 (Verify Progress) and Screen 3 (Verify Results) sections.

Build these two views:
1. Verify Progress: Agent stepper timeline showing 5 agents with pending/running/complete states. Poll GET /api/verify/{job_id} every 1.5 seconds to update status. Show live status messages for the running agent.
2. Verify Results: Transparency score gauge (circular), sub-score bars, executive summary card, findings cards with severity badges, estimation comparison visualization.

Connect to the real backend — clicking Analyze on the landing page should POST to /api/verify, navigate to the progress view, poll until complete, then show results.

Use the color system from the design spec. Score colors: 0-39 red, 40-59 amber, 60-79 teal, 80-100 green."

**Done when:** You can type ExxonMobil on the landing page, watch agents work in real-time, and see a complete transparency report rendered.

---

## TASK 13: Measure mode — All 4 agents

"Build the Measure mode pipeline. Read docs/ARCHITECTURE.md for the Measure mode agent pipeline.

Create:
- backend/agents/measure/data_ingestion.py (Agent 1 — LLM parses CSV)
- backend/agents/measure/classification.py (Agent 2 — LLM classifies into Scope 3 categories)
- backend/agents/measure/emission_calc.py (Agent 3 — PURE PYTHON, no LLM. Queries SQLite for emission factors, does math)
- backend/agents/measure/analysis.py (Agent 4 — LLM generates recommendations)
- backend/agents/measure/pipeline.py (chains them together)

Then add POST /api/measure and GET /api/measure/{job_id} to main.py.

Test with the sample CSV in sample_data/sample_procurement_nexus_electronics.csv.

CRITICAL for Agent 3: NO LLM CALLS. Every emission factor comes from the database. Every calculation is Python multiplication. Include the full calculation formula as a string in each result for traceability."

**Done when:** Uploading the sample CSV returns a complete Scope 3 breakdown with ranked suppliers.

---

## TASK 14: Frontend — Measure progress + results pages

"Read docs/frontend_design_spec.md — Screen 4 (Measure Progress) and Screen 5 (Measure Results).

Build the Measure mode frontend:
1. File upload on landing page triggers POST /api/measure
2. Progress view shows 4 agents working
3. Results page shows: total emissions summary, category breakdown chart (horizontal bars), supplier ranking table, hotspot cards, recommendation cards

Connect to the real backend."

**Done when:** Full end-to-end Measure mode works from file upload to rendered results.

---

## TASK 15: Polish and demo prep

"Final polish:
1. Add a 'New Analysis' button on both results pages to return to home
2. Test Verify mode on ExxonMobil — make sure output is dramatic and correct
3. Test Measure mode on sample CSV — make sure output is reasonable  
4. Fix any UI issues visible at 1920x1080 (Zoom screen share resolution)
5. Add proper error handling — if an agent fails, show error in the UI, don't crash
6. Add the methodology/about section in the footer

Don't add new features. Just make what exists work reliably and look good."

**Done when:** You can do a full demo of both modes without any crashes or visual bugs.
