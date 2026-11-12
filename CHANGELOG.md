# Changelog

## Unreleased

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
