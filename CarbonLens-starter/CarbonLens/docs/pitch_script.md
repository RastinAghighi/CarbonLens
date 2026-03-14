# CarbonLens — Pitch Script (3-5 Minutes)

**Target: 4 minutes total. Rehearse until natural.**

---

## OPENING HOOK (30 seconds)

"Let me start with a number: seven percent. That's how many companies in the world comprehensively measure their emissions across all scopes. And here's the alarming part — that number used to be ten percent. It's going *down*.

Meanwhile, eighty to ninety percent of a typical company's carbon footprint sits in Scope 3 — the supply chain. These are the emissions companies don't directly control and can barely measure. Even Google — in their 2025 Environmental Report — said supply chain emissions drove an eleven percent year-over-year increase in their total footprint.

The tools that exist to solve this — Watershed, Persefoni — cost fifty thousand dollars a year and take months to set up. So what do most companies do? Nothing. They either can't measure, or they publish sustainability reports that sound good but can't be independently verified.

CarbonLens solves both problems."

---

## PRODUCT INTRO (15 seconds)

"CarbonLens is a multi-agent AI platform with two modes. Verify mode analyzes any company's sustainability claims against independent public data. Measure mode calculates your Scope 3 supply chain emissions from procurement data you already have. Think of it as: a carrot and a stick. Help companies who want to improve, and hold accountable those who don't.

Let me show you."

---

## VERIFY MODE DEMO (90 seconds)

"Let's start with Verify mode. I'm going to type in a company name — let's use ExxonMobil."

[TYPE "ExxonMobil" AND CLICK ANALYZE]

"Watch what happens. CarbonLens deploys five specialized AI agents, and you can see each one working in real-time."

[PAUSE — LET AGENTS RUN, NARRATE WHAT'S ON SCREEN]

"The first agent is building a company profile — pulling financial data, identifying EPA-registered facilities. It found forty-seven facilities in the EPA's greenhouse gas reporting database.

Now the second agent is downloading and parsing ExxonMobil's actual sustainability report. It's extracting every quantitative environmental claim — every number, every percentage, every target they published.

Agent three is gathering independent data — EPA facility-level emissions, enforcement records, industry benchmarks. This is the evidence the system will use to cross-reference the company's own claims.

Now the key agent — the cross-reference engine. This is running Claude Opus, doing deep forensic analysis. It's comparing thirty-one extracted claims against eight independent data sources."

[PAUSE — WAIT FOR COMPLETION, ~10 SECONDS]

"And here's the result. ExxonMobil receives a Transparency Score of thirty-four out of one hundred — Low Transparency.

Let me show you why. The system found six key findings. Here's the most critical one: ExxonMobil reports a fifteen percent reduction in emission *intensity* — that's emissions per unit of production. But when the system checked EPA facility data, total *absolute* emissions actually increased over the same period. Production growth outpaced efficiency gains. This is a classic reporting pattern: intensity metrics making things look better while absolute emissions go up.

Another finding: Scope 3 emissions — which for an oil and gas company represent roughly eighty-five percent of the total footprint — are largely excluded from their reduction targets. The system flagged this using industry benchmarks and revenue-based estimation.

Every finding is cited. Every number traces back to a specific public data source. This isn't opinion — it's forensic analysis."

---

## MEASURE MODE DEMO (60 seconds)

"Now let's flip to the other side — helping companies who *want* to measure.

I have a procurement CSV from a fictional mid-size electronics manufacturer. This is messy, real-world data — inconsistent formatting, missing fields, mixed categories."

[UPLOAD THE CSV FILE]

"Four agents deploy. The first one parses and normalizes the data — it figured out the column structure and cleaned sixty-seven line items.

The second classifies each purchase into GHG Protocol Scope 3 categories. The third — and this is critical — looks up *verified* emission factors from EPA and DEFRA databases. No AI generates these numbers. Every emission factor comes from a published government database, and every calculation is done in code, not by the LLM. That's our anti-hallucination guarantee."

[PAUSE — WAIT FOR RESULTS]

"The result: an estimated forty-two hundred fifty tonnes CO2e in annual Scope 3 emissions. Here's the breakdown — Purchased Goods and Services dominates at sixty-six percent, with steel and aluminum as the biggest contributors.

The system ranks suppliers by carbon impact. The top three suppliers account for over fifty percent of emissions. And it gives *specific* recommendations — not generic advice. For example: the steel supplier is likely using blast furnace production. Switching to an electric arc furnace supplier could reduce that line item by up to sixty percent.

This takes a company from zero Scope 3 visibility to having actionable intelligence — in under thirty seconds."

---

## CLOSING (30 seconds)

"The climate data gap is real. Ninety-three percent of companies don't measure comprehensively. Corporate reports are often unverifiable. And the tools that exist cost fifty thousand dollars a year.

CarbonLens makes emissions intelligence accessible — powered by multi-agent AI, built on public data, transparent about every number.

Help companies who want to improve. Hold accountable those who don't. CarbonLens is both.

Thank you."

---

## NOTES FOR DELIVERY

- **Energy:** Start calm and factual (the numbers speak for themselves). Build energy through the demo. Close with conviction.
- **Screen sharing:** Make sure the agent progress display is visible. This is the visual "wow" moment.
- **Backup:** If live demo fails, have a screen recording ready. Switch to it seamlessly: "Let me show you a recording of the system in action."
- **Timer:** The verify demo is the longest section. If running long, skip narrating agents 1-2 in detail and jump to the results.
- **Judge questions to prepare for:** "How accurate are the spend-based estimates?" → "Directional — within an order of magnitude. Good enough to identify hotspots, not precise enough for regulatory reporting. We're transparent about confidence levels on every number." | "Why not use Gemini?" → "We tested multiple models and selected the best-performing one for each task. Our infrastructure runs entirely on Google Cloud." | "What's your moat?" → "Multi-source cross-referencing against public data. No one else combines corporate report extraction, EPA facility data, enforcement records, and industry benchmarks in a single automated pipeline."
