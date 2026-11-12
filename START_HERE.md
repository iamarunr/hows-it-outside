# Paste this prompt into the implementation agent

Build **Outside?**, an open-source outdoor weather decision app, from the attached specification pack. Read README.md, PRODUCT.md, AGENTS.md, WORKFLOW.md, DESIGN.md, and every numbered document in docs/ before changing application code.

Use a separate Astro project intended for outside.knnaresh.com. Do not modify the existing knnaresh.com portfolio. Inspect the working repository and its instructions before scaffolding. If the repository is empty, scaffold there. If it contains unrelated work, create a sibling project or isolated worktree without overwriting it.

Implement the MVP completely: location permission and city search; General Outdoors, Walk, Run, Bike and Hang out; current conditions; hourly timeline; activity preferences; best duration-based windows; deterministic explanations; stale and partial data handling; responsive accessible UI; tests; CI; privacy and methodology pages; open-source documentation. Follow the exact data normalization and scoring contract. Scores are preference heuristics, not safety or clinical assessments.

Work in the milestones in docs/07-IMPLEMENTATION-PLAN.md. Begin with fixture-driven tests for normalization, DST, scoring, missing data, and window selection. Use a static Astro shell and one React island; no database, account system, AI API, map library, or secret in the browser. Do not create mock live weather or treat null as zero. Make routine implementation choices autonomously and record deviations in the decision log.

Install mutually compatible current stable dependencies and commit a lockfile. Verify documentation against installed versions rather than using unpinned latest versions throughout the project. Keep all domain calculations in SI units and display in the selected units. Use target-location IANA time zones, never the device zone for forecast labels.

Deliver working code, meaningful passing tests, responsive screenshots from desktop and mobile, accessibility results, build and bundle evidence, a deployment runbook, and a concise known-limitations list. Run local production preview, not just the dev server. A failing check must be disclosed, not bypassed or described as passing.

Complete local implementation and reviewable deployment configuration. Publishing to production, purchasing a service, or changing DNS requires deployment authorization from the owner. Do not block ordinary coding on deployment decisions. Before public launch resolve the Open-Meteo hosted API eligibility for this portfolio-linked site. If a commercial key is needed, use the documented proxy migration; never add it to PUBLIC_* or client code.

Start by reporting your repository findings and a short implementation checklist, then build. Ask only about genuinely blocking missing information, not routine preferences already covered by this pack.
