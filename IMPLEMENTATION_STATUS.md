# Implementation status

Last updated: 11 November 2026 · Milestone: **M0 complete (uncommitted)** · Branch: `main` (no commits yet)

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

## Not done / pending
- CI has never run (no GitHub remote). Firefox/WebKit not run (Chromium only by default; `E2E_ALL_BROWSERS=1` adds them).
- axe checks not yet wired (M4).
- `fsevents` install script not approved by npm's allowScripts (macOS-only optional dependency; no effect on build/tests).
- README.md is still the handoff README; contributor README is M5.

## Next exact task
M1: write failing tests for normalization (consume `temporal-mapping.json`), units, time formatting (consume `timezones.json`), scoring golden examples incl. the worst-factor cap, flags, windows and explanations; then implement `src/domain/*`, `src/lib/time.ts`, `src/lib/units.ts`, `src/services/weather/normalize.ts`.

## Local preview
```
npm ci && npm run build && npm run preview   # http://localhost:4321
```
