# Implementation status

Last updated: 12 November 2026 · Milestone: **M6 in progress (redesign done; deployment next)** · Branch: `main` · Last-known-good commit: `0ab22c7` (M5; M4 `e692375`, M3 `0c0126a`, M2 `f91f0df`, M1 `f159c50`, M0 `1f0934e`)

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

## M2 — Data and location slice
| Area | Module | Tests |
|---|---|---|
| Freshness tiers, current-block usability | `src/domain/freshness.ts` | `cache.test.ts` (15 min / 60 min / 2 h boundaries; 90 min old / 10 min future) |
| Safe storage with memory fallback | `src/services/storageAdapter.ts` | `cache.test.ts`, `settings.test.ts` (disabled, quota, throwing access) |
| Forecast session cache | `src/services/cache.ts` | `cache.test.ts` (key has no display units, expiry, future fetchedAt, key mismatch, LRU 5, corrupt/old/invalid entries, clear) |
| Versioned settings, remember opt-in | `src/services/settings.ts` | `settings.test.ts` (corrupt, old version, per-activity fallback, remember off removes location, rounding on restore, forget/reset) |
| Forecast provider with in-flight dedupe | `src/services/weather/provider.ts` | `provider.test.ts` (normalize, dedupe, abort only when all callers abort, invalid payload) |
| Explicit geolocation | `src/services/geolocation.ts` | `provider.test.ts` (options, rounding, denied/unavailable/timeout/unsupported, NaN not 0,0) |
| Geocoding memory cache (24 h, 50) | `src/services/geocoding.ts` | `geocoding.test.ts` |
| Controller reducer + view model | `src/features/outside/controller/reducer.ts` | `reducer.test.ts` (old response cannot overwrite newer place, key mismatch, abort not an error, refresh without flicker, stale/expired, cooldown, denial keeps previous place) |
| Controller hook (requests, cache, refresh triggers) | `controller/useWeatherController.ts` | E2E |
| UI: location picker, Now, data status | `components/LocationPicker.tsx`, `ConditionsSummary.tsx`, `DataStatus.tsx` | E2E |

E2E journeys added (`tests/e2e/location.spec.ts`, all Chromium, stable over 5 repeats): two cities in turn; slow earlier response cannot overwrite the newer place; no prompt before the button and denied permission keeps search usable; device location sends 2-decimal coordinates and is labeled Current area; null current values show Unavailable; 503 → one retry → error → Try again recovers, provider text never shown; 429 busy message with disabled retry; session cache avoids a second request; failed refresh keeps data, then stale notice after an hour.

M2 command results (11 Nov 2026): `npm run check` 0 errors · `npm run lint` clean · `npm run test` 15 files, 214 tests · `npm run build` clean (CSP 2 script + 1 style hashes) · `npm run test:e2e` 12 passed.

Bundle after M2 (gzip -9): JS 87.3 KB of 100 KB (React DOM 65.7, react 3.0, island 18.5); CSS 1.4 KB. **Budget risk:** ~12.7 KB remain for M3–M4, and the scoring/windows/explanations modules are not yet imported by the island. M3 must measure after each slice; if the budget is exceeded, the owner decides between accepting the overage, trimming, or Preact.

## M3 — Complete product experience
| Area | Module | Evidence |
|---|---|---|
| Results view model (pure; no network) | `controller/results.ts` | `results.test.ts` |
| Activity, units, duration and daylight controls (native radios/checkbox) | `components/Controls.tsx` | E2E |
| Next-hour summary: flags first, headline, ≤2 reasons, comparison; stale → "Suggestions paused" | `components/Summary.tsx` | E2E |
| Ranked windows and empty states with horizon flags | `components/WindowSuggestions.tsx` | E2E |
| 24-hour timeline (one Tab stop, arrows/Home/End) and selected-hour details | `components/HourlyTimeline.tsx` | E2E |
| Preferences (comfort range in display units with inline errors, rain, wind, per-activity reset) and device data controls (remember, forget, reset, clear all) | `components/PreferencesPanel.tsx` | E2E |
| Explanation threshold for notable factors | `domain/explanations.ts` | `explanations.test.ts` |

E2E journeys added (`tests/e2e/experience.spec.ts`): all activities switch with one forecast request; duration, wind preference and units apply instantly, persist after reload and never refetch; invalid comfort edits keep the last valid range; remember location off by default, restored as Saved location without stealing focus, Forget clears settings location and session cache; missing probability → Limited data, no positive match; thunderstorm hours lead the summary, show in the timeline and are excluded from windows; timeline single Tab stop; Chicago fall-back shows unique 1:00 AM CDT/CST labels and the date after midnight. `tests/e2e/screenshots.spec.ts` captures review screenshots when `SCREENSHOT_DIR` is set.

Screenshot review (360×800 and 1440×900, synthetic London): layout readable, no horizontal page overflow at 360 px; fixed in this milestone: trivial-penalty reasons (IMP-023), "then Light rain" capitalization, native checkbox color. Remaining for M4: desktop two-column summary/Now layout, visual hierarchy polish, supporting pages, contrast verification.

M3 command results (11 Nov 2026): `npm run check` 0 errors · `npm run lint` clean · `npm run test` 16 files, 219 tests · `npm run build` clean · `npm run test:e2e` 20 passed, 2 skipped (screenshots), stable over 3 repeats.

Bundle after M3 (gzip -9): **JS 94.8 KB of 100 KB** (React DOM 65.7, react 3.0, island 26.0); CSS 2.3 KB of 30 KB. About 5 KB of JS headroom remains for M4; supporting pages are static and add no JS.

## M4 — Design and resilience
| Area | Change | Evidence |
|---|---|---|
| Contrast | All text tokens ≥4.5:1 on background, surface and selected fill (lowest 5.97:1); new control-border token ≥3:1 | `tests/unit/contrast.test.ts` (25 pairs) |
| Layout | Desktop two-column overview; place name shown once; footer spacing fixed | Screenshots at 320, 360, 390, 768, 1440 px |
| States | Offline banner; settings-reset notice; storage-blocked note; distinct offline load error | `accessibility.spec.ts` offline/storage journeys |
| Supporting pages | `/methodology/` (presets table generated from code, formulas, cap, flags, windows, approximations, freshness, sources), `/privacy/`, `/about/`, footer links, 404 | axe + one-H1 checks |
| No-JS | `html.js` class; explanation with links; inert tool hidden | E2E with JavaScript disabled |
| Forced colors | Selected radios and hour use system Highlight colors | E2E with emulated forced colors + axe |

Automated accessibility evidence (axe-core 4.14 via @axe-core/playwright, WCAG 2.0/2.1/2.2 A and AA tags, Chromium): **0 violations** on home (empty), home (loaded, preferences open), forced colors, About, Methodology, Privacy and 404. Reflow at 320 px (≈400% zoom) and 640 px (≈200%): no horizontal page scrolling. All visible targets ≥24×24 px at 360 px (most 44 px). Automated evidence only, not a conformance claim; manual screen-reader and real-device checks are still pending.

Screenshot review (synthetic London): the review pass found a duplicate place name on mobile, missing spaces in the footer attribution and 20 px checkboxes; all fixed and confirmed in a second pass.

M4 command results (11 Nov 2026): `npm run check` 0 errors · `npm run lint` clean · `npm run test` 17 files, 244 tests · `npm run build` 5 pages, CSP 3 script + 1 style hashes · `npm run test:e2e` 34 passed, 5 skipped (screenshots), stable over 3 repeats (102/102).

Bundle after M4 (gzip -9): **JS 94.9 KB of 100 KB**; CSS 2.7 KB of 30 KB. Supporting pages ship no JS beyond the one-line `js` class script.

## M5 — Open-source and release preparation
- Root `README.md` for contributors (screenshot, setup, scripts, configuration, architecture, deployment, limitations); spec-pack README moved to `docs/00-HANDOFF.md`.
- `LICENSE` (MIT, 2026 Naresh Kumar), `THIRD_PARTY_NOTICES.md`, `CONTRIBUTING.md`, `SECURITY.md` (private route **pending owner**; no invented address).
- Issue forms (bug, feature, scoring feedback; privacy warnings; blank issues off) and PR template; advisory `npm audit` CI job.
- Preview noindex (`PUBLIC_NOINDEX`) and a hosted-build guard for `PUBLIC_SITE_URL`; both verified locally.
- Cross-browser: Firefox and WebKit installed and run. Findings fixed: Safari select height, Firefox forced-colors contrast, Firefox geolocation never answering (20 s guard). Result: 101 passed, 16 skipped across 3 engines.
- Fresh-copy verification: only committable files, no `.env`, `npm ci` → check, lint, 247 unit tests, build, 34 E2E all pass.
- Lab performance (Chromium, 4× CPU, throttled network): LCP 416–436 ms, CLS 0, activity switch 23–40 ms.
- `docs/ACCEPTANCE-RESULTS.md` maps every P0 ID and test-plan journey to evidence; `docs/08-DEPLOYMENT.md` has the implemented runbook; `docs/PORTFOLIO.md` drafts the portfolio entry.

M5 command results (11 Nov 2026): `npm run check` 0 errors · `npm run lint` clean · `npm run test` 17 files, 247 tests · `npm run build` 5 pages · `npm run test:e2e` 34 passed (Chromium) · `E2E_ALL_BROWSERS=1` 101 passed, 16 skipped.

## Not done / pending
- CI has never run (no GitHub remote). CI runs Chromium only; Firefox/WebKit were run locally.
- Manual screen-reader and real iOS/Android device checks not done.
- `fsevents` install script not approved by npm's allowScripts (macOS-only optional dependency; no effect on build/tests).

## Redesign (12 November 2026)
Owner asked to follow the Dutchblue reference (Landbook). Decisions: its look but tool-first; self-hosted Bebas Neue; weather-aware CSS sky. Built with the Impeccable skill, code-led (no image generation). Independent finish review: round 1 fix (8 items) → round 2 seven resolved, one partial → owner funded a third round → **ship**. DESIGN.md and `.impeccable/design.json` rewritten from the build. Checks: 279 unit tests; 101 E2E across Chromium, Firefox, WebKit; 0 axe violations; detector clean. JS 95.9 KB gzip, CSS 6.0 KB, font 13.8 KB; LCP 560–568 ms, CLS 0.

## Owner decisions (resolved 2026-11-12)
1. Free Open-Meteo API: owner confirms non-commercial use.
2. Repository: https://github.com/iamarunr/hows-it-outside (commits published with the owner's GitHub noreply address).
3. Security reports: GitHub private vulnerability reporting.
4. Deploy: Cloudflare Pages on the owner's account; preview first, then outside.knnaresh.com.

## Next exact task
M6 (needs owner authorization): resolve the decisions above, create the Pages project with the documented settings, verify a preview deployment (headers, noindex, search, location, attribution), add the custom domain, verify production headers and live smoke in 5+ cities, record the release commit and rollback target in `docs/ACCEPTANCE-RESULTS.md`.

## Local preview
```
npm ci && npm run build && npm run preview   # http://localhost:4321
```
