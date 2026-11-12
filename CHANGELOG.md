# Changelog

## Unreleased

### M0 — Foundation (11 November 2026)
- Scaffolded static Astro 7 + single React 19 island, strict TypeScript 6.0, Vitest, Playwright, ESLint 10.
- Fixed provider configuration module; fetch client with timeout, abort, one retry, 429 Retry-After handling.
- Place search slice wired to Open-Meteo geocoding (2-code-point auto-search, Enter submits, rounded coordinates).
- Build-time CSP: inline script/style hashes written to `dist/_headers`; post-build guard against test markers.
- E2E harness with Playwright clock and provider route interception; first fixture journeys.
- Live multi-region field-availability report; temporal-mapping and time-zone fixtures.
- Spec pack v1.1 split into repository files.
