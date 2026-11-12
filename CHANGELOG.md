# Changelog

## Unreleased

### M5 — Open-source and release preparation (11 November 2026)
- Contributor README, MIT license, third-party notices, contributing and security guides, issue forms and PR template.
- Preview deployments can be marked noindex; hosted builds require a canonical site URL.
- Fixed in cross-browser testing: select height in Safari, forced-colors selection contrast, and a stuck "Finding your location…" in Firefox when the permission prompt is ignored.
- Acceptance results, implemented deployment runbook, lab performance check and portfolio entry draft.

### M4 — Design and resilience (11 November 2026)
- Verified token contrast with automated tests; stronger border for interactive hour buttons.
- Desktop two-column overview; place name shown once on small screens; forced-colors support.
- Offline, storage-blocked and settings-reset notices.
- Methodology, Privacy and expanded About pages; footer navigation and full attribution.
- No-JavaScript explanation on the home page; inert controls hidden.
- Automated axe, reflow, target-size, forced-colors, no-JS, offline and storage journeys.

### M3 — Complete product experience (11 November 2026)
- Activity choice (Outdoors, Walk, Run, Bike, Hang out), units, outing length and daylight-only controls; all recompute locally without refetching.
- Next-hour summary with concerning-weather notices first, up to two reasons and a comparison with the best window.
- Up to three suggested windows with empty-state explanations; 24-hour timeline with keyboard navigation and hour details.
- Preferences disclosure with per-activity comfort range, rain and wind tolerance, per-activity reset, remember location, forget location, reset all and clear all local data.
- Explanations name a factor only when it is notable (no "higher chance of precipitation" for a 5% chance).

### M2 — Data and location slice (11 November 2026)
- Forecast provider (validate, normalize, dedupe in-flight requests) and freshness tiers.
- Session forecast cache (LRU 5, re-validated on read) and versioned local settings with remember-location opt-in; storage failures fall back to memory.
- Explicit one-shot geolocation with 2-decimal rounding; denial keeps search and any previous place.
- Controller with generation IDs so slow earlier responses never replace a newer place; refresh on visibility, reconnect and a minute check; 429 cooldown.
- Location picker, Now conditions and data-status notices with a single polite live region.

### M1 — Domain engine (11 November 2026)
- Forecast normalization with an explicit field-to-time semantics registry: instantaneous fields from the interval start, precipitation, probability and gusts from the interval end; conservative weather-code and daylight handling.
- Units and IANA time-zone helpers (DST-safe labels, UTC fallback flag).
- Scoring version 1: activity presets, temperature/rain/wind penalties, worst-factor cap, concerning-weather flags.
- Duration windows (30–120 min), deterministic ranking of up to three non-overlapping windows, empty-state reasons, next-hour summary and comparison.
- Template-based explanations and headlines derived from the scoring contributions.

### M0 — Foundation (11 November 2026)
- Scaffolded static Astro 7 + single React 19 island, strict TypeScript 6.0, Vitest, Playwright, ESLint 10.
- Fixed provider configuration module; fetch client with timeout, abort, one retry, 429 Retry-After handling.
- Place search slice wired to Open-Meteo geocoding (2-code-point auto-search, Enter submits, rounded coordinates).
- Build-time CSP: inline script/style hashes written to `dist/_headers`; post-build guard against test markers.
- E2E harness with Playwright clock and provider route interception; first fixture journeys.
- Live multi-region field-availability report; temporal-mapping and time-zone fixtures.
- Spec pack v1.1 split into repository files.
