# 07 — Implementation milestones and backlog

## M0 — Foundation and contract validation
Inspect repo (initialize git if absent), choose compatible toolchain, scaffold static Astro plus React, set strict TypeScript, create scripts/CI skeleton and source config. Commit package lock. Run the multi-region field-availability check (DATA-AND-API §2) without storing personal location. Decide and prove the CSP mechanism on the scaffolded build (PRIVACY-SECURITY, Implementation mechanics). Set up the Playwright clock and route-interception harness with one passing fixture journey. Write fixtures for temporal mapping and time zones. Exit: build and test harness work; CSP header generated and verified on preview; field-availability note recorded; no live weather hidden behind fake UI.

## M1 — Domain engine
Implement types/runtime schemas, normalization, unit/time helpers, presets, score/flags, candidate windows and explanations. Write tests first for golden cases and all temporal boundaries. Exit: deterministic domain suite passes; no framework dependency in domain; test coverage specifically includes precipitation/gust interval alignment and DST.

## M2 — Data and location slice
Implement request client, timeout/retry, geocoding, explicit geolocation, coordinate rounding, cache and storage. Assemble accessible location selection and basic loaded weather. Exit: can choose two different cities reliably; denied permission works; slow old response cannot overwrite newer selection; nulls and outage handled.

## M3 — Complete product experience
Add activity controls, next-hour summary, current metrics, duration/daylight preferences, ranked windows, timeline and details, remembered preferences and location opt-in. Exit: full user journey works with fixtures and live data; activity changes make no unnecessary network call; default page needs no setup questionnaire.

## M4 — Design and resilience
Apply DESIGN.md, all loading/error/stale/empty/partial states, mobile layouts, keyboard focus and live announcements. Add supporting static pages and visible attribution. Exit: responsive review complete, accessibility defects resolved, no unsupported claims in copy.

## M5 — Open-source and release preparation
README, MIT license, contributing/security docs, issue templates, deployment instructions, CSP/header verification and CI. Run full acceptance suite and production preview. Prepare screenshots and short portfolio description. Exit: fresh clone works with npm ci and no secrets; all P0 gates pass or explicit release-only blockers recorded.

## M6 — Authorized release
Confirm hosted API eligibility, real repo/contact URLs, Cloudflare project, subdomain DNS, HTTPS, cache headers, production CSP and preview indexing. Deploy only with authorization, run live smoke checks and record release commit. Exit: production URL works independently of portfolio; rollback procedure validated at documentation/config level.

## Dependencies and effort
M1 and data contract decisions precede recommendation UI. M2 precedes live E2E. Visual styling can begin on fixtures after M1, but don't defer accessibility to the end. Estimate work by milestone after repo inspection; do not promise a fixed number of hours based on this spec alone.

## Suggested backlog after v1
P1: share a searched city, multiple saved places, localization, optional dark theme, user-controlled available hours. P2: AQI with regional standards clearly identified; UV; official alerts per jurisdiction; installable PWA with explicit stale behavior. P3: route-aware cycling wind or hiking profiles only with appropriate new data and limitations. Each addition needs a small PRB, tests and privacy review; do not prebuild infrastructure for them.

## Milestone handoff template
Record: completed acceptance IDs; changed modules; commands/results; screenshots; dependency decisions; unresolved questions; next exact task; current commit/last-known-good commit. Keep status factual and succinct.
