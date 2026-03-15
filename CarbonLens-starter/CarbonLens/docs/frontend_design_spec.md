# CarbonLens - Frontend Design Specification

This document describes every screen, component, and interaction in the CarbonLens UI. Hand this to Claude Code to build the frontend.

---

## Design Philosophy

**Goal:** Look like an early-stage product from a well-funded startup, not a hackathon project. Think: clean, data-dense, authoritative. References: Stripe Dashboard, Linear, Vercel.

**Color system:**
- Background: white (#FFFFFF) with very light gray panels (#F9FAFB)
- Primary accent: deep teal (#0D9488) - conveys sustainability without being cliché green
- Danger/high severity: red-orange (#DC2626)
- Warning/medium severity: amber (#D97706)
- Success/low severity: green (#059669)
- Text: near-black (#111827) for headings, dark gray (#374151) for body, medium gray (#6B7280) for secondary
- Score colors: 0-39 red, 40-59 amber, 60-79 teal, 80-100 green
- Card borders: light gray (#E5E7EB), subtle shadow on hover

**Typography:**
- Font: Inter (Google Fonts) - clean, professional, highly legible
- Headings: 600 weight (semibold)
- Body: 400 weight (regular)
- Monospace for numbers, scores, data: JetBrains Mono or similar

**Layout:** Max-width 1200px, centered. Generous whitespace. No sidebar - single column with panels.

---

## Screen 1: Landing / Home

**What the user sees when they first load CarbonLens.**

Top section - full-width hero area, white background:
- Large logo: "CarbonLens" in semibold, with a small lens/magnifying glass icon in teal
- Tagline below the logo: "AI-powered supply chain emissions intelligence"
- One sentence description: "Measure your Scope 3 footprint or verify any company's sustainability claims - powered by multi-agent AI and public data."

Below the tagline - two large mode selection cards, side by side, equal width:

**Left card - Verify mode:**
- Icon: a magnifying glass with a checkmark/x overlay
- Title: "Verify"
- Subtitle: "Analyze any company's sustainability claims"
- Description (small text): "Cross-references corporate reports against EPA facility data, industry benchmarks, and public records to generate a transparency score."
- A text input field embedded in the card: placeholder "Enter a company name..."
- Button: "Analyze" (teal, solid)

**Right card - Measure mode:**
- Icon: a bar chart with an upward arrow
- Title: "Measure"
- Subtitle: "Calculate your Scope 3 emissions"
- Description (small text): "Upload procurement data and get an AI-powered Scope 3 breakdown with ranked suppliers and actionable recommendations."
- A file upload zone embedded in the card: drag-and-drop area with "Drop CSV, Excel, or PDF files here" and a "Browse files" link
- Button: "Calculate" (teal, outlined - secondary to Verify since Verify is the demo lead)

Below the cards - a stats bar spanning the full width, light gray background:
Three statistics displayed in a row, each with a large number and a small attribution:
- "7%" + "of companies measure all emission scopes" + "BCG 2025"
- "80-90%" + "of emissions are in the supply chain (Scope 3)" + "GHG Protocol"
- "$50K+/year" + "cost of current enterprise tools" + "Industry average"

Footer - minimal. "Data from EPA, DEFRA, GHG Protocol • CarbonLens 2026"

---

## Screen 2: Verify Mode - Agent Progress View

**What the user sees after clicking "Analyze" on a company name. This is the most important screen for the demo.**

**Layout:** Full-width panel, light gray background. The screen shows agents working in real-time.

**Top bar:**
- Back arrow to return to home
- Company name large and bold: "Analyzing: ExxonMobil"
- Small elapsed time counter: "Running for 12s..."

**Agent progress panel - the centerpiece:**

This is a vertical timeline/stepper layout. Each agent is a row in the timeline. The timeline shows agents sequentially, with visual states for each:

**Visual states for each agent row:**
1. **Pending** (gray, dimmed): Agent name with a gray circle. Not yet started.
2. **Running** (teal, animated): Agent name with a spinning/pulsing teal circle. Below the name, show a live status message that updates as the agent works. Example messages:
   - Agent 1: "Searching SEC EDGAR for financial data..." → "Found 47 EPA GHGRP facilities..." → "Compiling company profile..."
   - Agent 2: "Downloading sustainability report PDF..." → "Extracting quantitative claims... (found 23 so far)" → "Identified 31 environmental claims"
   - Agent 3: "Querying EPA GHGRP facility data..." → "Searching for independent verification sources..." → "Computing industry benchmark estimates..."
   - Agent 4: "Cross-referencing 31 claims against 8 data sources..." → "Analyzing emission intensity trends..." → "Scoring transparency..."
   - Agent 5: "Generating transparency report..."
3. **Complete** (green check): Agent name with a green checkmark. Shows a one-line summary of what was found. Example: "✓ Company Intelligence - Found profile: Oil & Gas, $344.6B revenue, 47 EPA facilities"
4. **Error** (red x): Agent name with a red x. Shows what went wrong. Example: "✗ Report Extraction - Could not find sustainability report PDF. Falling back to web sources."

**Agent rows (in order):**
1. Company Intelligence Agent
2. Report Extraction Agent
3. Independent Data Agent
4. Cross-Reference & Scoring Agent
5. Report Generation Agent

**Below the timeline - a live data preview panel:**
As agents complete, show small preview cards of what they found:
- After Agent 1: "47 facilities found • 3 EPA violations on record"
- After Agent 2: "31 claims extracted from 'Advancing Climate Solutions 2024'"
- After Agent 3: "EPA GHGRP total: 72.3M tCO2e • Industry benchmark estimate: 68B tCO2e total"

This panel builds up as the analysis proceeds, giving the viewer a sense of data accumulating.

**Transition to results:** When all agents complete, the progress view slides up/fades and the results page slides in from below. A brief "Analysis complete" state with the transparency score appearing dramatically (number counts up from 0 to the final score over ~1 second).

---

## Screen 3: Verify Mode - Results Page

**The full transparency report. This is what judges evaluate.**

**Top section - Score Hero:**
- Company name (large, bold): "ExxonMobil"
- Industry label below: "Oil & Gas - Integrated"
- Large circular score gauge on the right: transparency score (0-100) displayed as a circular progress ring. Number in the center in large monospace font. Color matches the score range (red for 0-39, amber for 40-59, teal for 60-79, green for 80-100).
- Score label below gauge: "Low Transparency" (or appropriate label)
- Four small sub-score bars below the main gauge, horizontal:
  - Completeness: [bar] 25/100
  - Consistency: [bar] 40/100
  - Verifiability: [bar] 45/100
  - Ambition: [bar] 25/100

**Executive Summary - right below the score:**
- A light gray card with the 2-3 sentence executive summary from Agent 5.
- This should feel like the "thesis statement" of the report.

**Key Findings section:**
- Section heading: "Key Findings" with the count "(6 findings)"
- Each finding is a card. Cards are stacked vertically with spacing between them.
- Each finding card has:
  - A severity badge on the left: red pill for "Critical", amber for "Significant", teal for "Moderate"
  - Finding title (bold): e.g., "Intensity reduction masks absolute emissions increase"
  - Finding narrative (body text): 1-2 paragraphs explaining the finding in plain language
  - Evidence section (collapsible, starts collapsed): Shows the specific data points with sources and URLs
  - "Company perspective" note (italic, smaller text): Possible legitimate explanation

**Claims Extracted section (collapsible, starts collapsed):**
- Section heading: "Claims Extracted from Report" with count "(31 claims)"
- Table format: Claim text | Scope | Type | Value | Page
- Each row links to the original report page reference

**Independent Data section (collapsible, starts collapsed):**
- Section heading: "Independent Data Sources"
- Sub-sections for: EPA GHGRP Data, EPA Enforcement History, Industry Benchmarks, News & Third Party
- Each with relevant data displayed in tables or lists

**Estimation Comparison section:**
- A visual comparison: two stacked horizontal bars
  - Bar 1: "Company Reported" - Scope 1+2 reported figure
  - Bar 2: "Independent Estimate" - estimation engine total
  - Scope 3 bar extending to the right showing the estimated Scope 3 that the company didn't fully report
- This visually shows the "dark matter" - the gap between what's reported and what's estimated

**Methodology section (bottom):**
- Small text, collapsed by default
- How the analysis was conducted, limitations, sources

**Export / Share section (bottom):**
- "Download PDF Report" button
- "Share link" button (post-hackathon)

---

## Screen 4: Measure Mode - Agent Progress View

**Same layout pattern as Verify progress, different agents:**

**Agent rows (in order):**
1. Data Ingestion Agent - "Parsing uploaded file..." → "Normalized 67 line items, detected 5 columns" → "✓ 67 line items processed, 3 excluded (blank rows)"
2. Category Classification Agent - "Classifying procurement items..." → "Mapping to GHG Protocol categories..." → "✓ 64 items classified (3 low confidence)"
3. Emission Factor Lookup - "Looking up emission factors..." → "Calculating emissions for 64 items..." → "✓ 61 items calculated, 3 factors not found"
4. Analysis & Recommendations - "Identifying emission hotspots..." → "Generating recommendations..." → "✓ Analysis complete: 4,250 tCO2e total"

**Live preview panel builds up:**
- After Agent 1: "67 line items • 12 unique suppliers • $48.2M total procurement"
- After Agent 2: "Top categories: Purchased Goods (65%), Upstream Transport (18%), Business Travel (8%)"
- After Agent 3: "Total estimate: 4,250 tCO2e • 61/67 items calculated"

---

## Screen 5: Measure Mode - Results Page

**Top section - Summary Hero:**
- Large number: "4,250 tCO2e" (total Scope 3 estimate)
- Subtitle: "Estimated annual Scope 3 emissions from 67 procurement line items"
- Confidence badge: "Medium Confidence - Spend-based estimation"
- Small contextual stat: "Equivalent to ~920 passenger cars driven for one year"

**Scope 3 Category Breakdown:**
- Horizontal bar chart showing emissions by Scope 3 category
- Categories sorted by emissions (largest first)
- Each bar is labeled with: category name, emissions (tCO2e), percentage of total
- Color gradient from darkest (highest) to lightest

**Supplier Ranking:**
- Section heading: "Suppliers by Carbon Impact"
- Table with columns: Rank | Supplier | Total Emissions (tCO2e) | Spend ($) | Emission Intensity (kgCO2e/$) | % of Total
- Top 3 suppliers highlighted with a subtle background tint
- Each row expandable to show individual line items

**Hotspots section:**
- Cards for each identified hotspot (same card pattern as Verify findings)
- Each with a description and why it matters

**Recommendations section:**
- Cards for each recommendation, ordered by priority
- Each card shows: priority badge (high/medium/low), target supplier/category, specific recommendation text, potential reduction, difficulty, timeframe
- High priority recommendations have a teal left border accent

**Data Quality section:**
- How many items were calculated vs. failed
- Suggestions for improving accuracy
- Methodology note

**Unclassified Items section (collapsible):**
- Table of items that couldn't be classified or calculated
- Shows reason for each

**Export:**
- "Download CSV Report" button
- "Download PDF Report" button

---

## Component: Agent Progress Display (Shared)

This is the key UX component. Design it to be dramatic but not gimmicky.

**Implementation approach (polling-based):**
- Frontend polls `GET /api/{job_id}/status` every 1-2 seconds
- Response includes: `{ current_agent: 2, agents: [{name, status, message, summary}] }`
- Frontend updates the stepper based on this status

**Visual details:**
- The running agent has a subtle pulse animation on its icon (CSS animation, not heavy JS)
- Status messages fade in/out as they update (CSS transition)
- Completed agents slide from "running" to "complete" smoothly
- The live data preview cards fade in as they appear
- Overall feel: calm, professional, confident - like watching a system work, not a loading spinner

**Timing guidance:**
- Verify mode total: ~30-60 seconds (some web search latency)
- Measure mode total: ~15-30 seconds (less external data needed)
- Agents should NOT all complete instantly - some visual pacing is good. If an agent finishes in <2 seconds, hold the "complete" state for a beat so the user can see it.

---

## General UI Notes

- Responsive is NOT a priority for hackathon. Optimize for 1920x1080 screen being shared over Zoom.
- Dark mode is NOT needed.
- No authentication. No user accounts. This is a public demo tool.
- Error states: if something fails, show a clean error message in the agent progress stepper, not a crash screen. The system should degrade gracefully.
- Loading states: skeleton screens or simple spinners while waiting for initial API response.
- Animations should be subtle. No bouncing, no confetti. Professional.
- All data displayed should use proper number formatting: thousands separators, 1-2 decimal places for percentages, appropriate units.
