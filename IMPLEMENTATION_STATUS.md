# Implementation status

Last updated: 11 November 2026 · Milestone: **M1 complete (uncommitted)** · Branch: `main` · Last-known-good commit: `6342d19` (M0)

## Baseline
Folder contained only the single-file spec (v1.1). Not a git repository; `git init -b main` run. Spec split into repository paths (README.md, START_HERE.md, PRODUCT.md, AGENTS.md, WORKFLOW.md, DESIGN.md, docs/01–10); original kept at `docs/archive/Outside_Complete_Agent_Specification.md`.

## Toolchain (installed, pinned by package-lock.json)
Node 26.8.1 (`.nvmrc` 26, current LTS line), npm 11.19.0 · Astro 7.4.11 · @astrojs/react 7.1.8 · React 19.3.1 · TypeScript 6.0.3 · Zod 4.6.7 (`zod/mini`) · Vitest 5.1.0 · Playwright 1.65.0 · ESLint 10.14.0 + typescript-eslint 8.72.2, eslint-plugin-astro 3.2.1, eslint-plugin-jsx-a11y-x 0.2.0, eslint-plugin-react-hooks 7.1.1 · @axe-core/playwright 4.14.0 (installed, not yet used).

## M0 exit criteria
| Criterion | Status | Evidence |
|---|---|---|
| Static Astro + one React island, strict TS | Done | `astro.config.mjs` (output static), `tsconfig.json` extends `strictest` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Scripts: dev, build, preview, check, lint, test, test:e2e | Done | `package.json`; all run with real tools |
| CI skeleton | Written, not run | `.github/workflows/ci.yml` (no remote yet) |
| Source config module | Done | `src/lib/config.ts` (fixed provider origins; PUBLIC_* only; unset Source link hidden) |
| Multi-region field-availability check | Done | `docs/FIELD-AVAILABILITY.md`: 8 cities, all hourly/current fields 0% null in next 24 h and 72 h; units SI; time steps 3600 s |
| CSP mechanism proven on build | Done | `scripts/csp.ts`, `scripts/csp-headers.ts` write `dist/_headers`; E2E asserts headers and hydration; negative test (hash removed) fails as expected |
| Playwright clock + route harness, one fixture journey | Done | `tests/e2e/support/harness.ts`; `search.spec.ts` (2 journeys), `security.spec.ts` |
| Temporal-mapping and time-zone fixtures | Done | `tests/fixtures/forecast/temporal-mapping.json`, `tests/fixtures/time/timezones.json` (verified against Intl), captured live sample `open-meteo-sample-st-louis.json` |
| No live weather behind fake UI | Done | Page shows only real place search; forecast area explicitly says not built yet |

## Command results (11 Nov 2026, local macOS, Chromium)
- `npm run check` — 0 errors, 0 warnings (28 files)
- `npm run lint` — clean
- `npm run test` — 5 files, 30 tests passed
- `npm run build` — 3 pages; CSP: 2 script + 1 style hashes; `verify-dist` clean
- `npm run test:e2e` — 3 passed (Chromium, against built `dist/` with `_headers` applied)
- `npm run preview` — `astro preview` on port 4321 serves the build (HTTP 200). Note: it does not apply `_headers`; E2E uses `scripts/serve-dist.ts` on port 4322 for that.

## Bundle (gzip -9, M0)
JS: React DOM client 65.7 KB + react 3.0 KB + island 8.7 KB = **77.4 KB of 100 KB budget**. CSS 1.0 KB of 30 KB.
Risk: React DOM alone uses about two thirds of the JS budget, leaving ~23 KB for M1–M4. Switching from full `zod` to `zod/mini` already saved ~17 KB. If the budget is exceeded later, options are code review/splitting first, then an owner decision on Preact (`preact/compat`), which is a spec deviation.

## M1 — Domain engine
| Area | Module | Tests |
|---|---|---|
| Types | `src/domain/types.ts` | — |
| Units and display formatting | `src/lib/units.ts` | `units.test.ts` (conversions, round-trip, <0.1 mm / <0.01 in, nulls, locale defaults) |
| Time zones and hour labels | `src/lib/time.ts` | `time.test.ts` (fixture DST/offset cases, unique repeated-hour labels, date on change, UTC fallback, device zone forced to Pacific/Chatham) |
| Provider contract and field semantics registry | `src/services/weather/openMeteo.ts` | `normalize.test.ts` |
| Normalization | `src/services/weather/normalize.ts` | `normalize.test.ts` (fixture contract, t0/t1 mapping, nulls, missing/short arrays, duplicates, unsorted, gaps, units, ranges, unknown codes incl. 97, daylight table, invalid zone, current independence, live sample → 71 intervals with no diagnostics) |
| Weather codes | `src/domain/weatherCodes.ts` | via normalization/flags |
| Presets and constants (scoringVersion 1) | `src/domain/activities.ts` | `score.test.ts` (exact preset table, comfort validation) |
| Interval score, worst-factor cap | `src/domain/score.ts` | `score.test.ts` (all golden examples, 45/75 boundaries, cap 100/70/40, saturated → Poor for every preset, null vs zero, no mutation, seeded monotonicity properties) |
| Flags and notes | `src/domain/flags.ts` | `score.test.ts` (every code incl. 97, inclusive thresholds, fog note, flags survive missing data and preferences) |
| Windows, ranking, next hour | `src/domain/windows.ts` | `windows.test.ts` (74 golden window, unequal overlap, gust 50, no prorating, coverage gaps, 30/60/90/120 candidates, horizon, midnight, ranking/adjacency/ties, no poor fillers, min<45 rejection, daylight incl. polar day/night and missing is_day, empty-reason priority, stale, comparisons, timeline) |
| Explanations and copy | `src/domain/explanations.ts` | `explanations.test.ts` (measured units, peak hourly wording, ≤2 drivers, tie order, cap lead, drivers ⊆ penalized, headlines, empty copy, prohibited-word sweep) |

Lint enforces that domain, `lib/time|units|geo` and `normalize.ts` import no React, network or storage modules and use no browser globals (verified with a probe file).

M1 command results (11 Nov 2026): `npm run check` 0 errors · `npm run lint` clean · `npm run test` 11 files, 168 tests passed · `npm run build` clean · `npm run test:e2e` 3 passed (Chromium). JS bundle unchanged at 77.4 KB gzip (domain not yet imported by the island).

## Not done / pending
- CI has never run (no GitHub remote). Firefox/WebKit not run (Chromium only by default; `E2E_ALL_BROWSERS=1` adds them).
- axe checks not yet wired (M4).
- `fsevents` install script not approved by npm's allowScripts (macOS-only optional dependency; no effect on build/tests).
- README.md is still the handoff README; contributor README is M5.

## Next exact task
M2: forecast request service (`buildForecastUrl` + `fetchJson` + `normalizeForecast`), freshness tiers and sessionStorage cache (key excludes display units, LRU 5, future fetchedAt rejection), versioned localStorage preferences with memory fallback, explicit geolocation with rounding, controller reducer with generation IDs so stale responses cannot overwrite a newer selection.

## Local preview
```
npm ci && npm run build && npm run preview   # http://localhost:4321
```
