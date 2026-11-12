# Acceptance results

Recorded 11 November 2026 on macOS (Apple Silicon), Node 26.8.1, Playwright 1.65.0 (Chromium, Firefox and WebKit builds bundled with Playwright), against the production build served with its generated `_headers`. Commit: the M5 commit that adds this file (M4 last-known-good: `e692375`).

All weather in automated tests is **synthetic fixture data**. Live-provider evidence is limited to the field-availability check (`docs/FIELD-AVAILABILITY.md`) and one captured sample response. Results that need the real deployment are marked **Pending (release)**.

## P0 requirements

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| LOC-01 | Explicit "Use my location"; no prompt before action; failures offer search | E2E `location.spec.ts`: no provider request or prompt before click; denied → alert + usable search (Chromium, WebKit); unit `provider.test.ts`: denied/unavailable/timeout/unsupported, 20 s guard when the browser never answers | Pass. Firefox denial can't be scripted; covered by the guard unit test |
| LOC-02 | Global city search, keyboard-selectable, region + country | E2E `search.spec.ts` (two same-name St. Louis results), `location.spec.ts` (London, Chennai); unit `geocoding.test.ts` (2-code-point CJK, Enter for 1 char, 120 limit, rounding) | Pass |
| LOC-03 | Returning location only with remember; labeled Saved; no silent GPS | E2E `experience.spec.ts` remember journey; unit `settings.test.ts` | Pass |
| LOC-04 | Forget clears persisted location and forecast cache; app stays usable | E2E `experience.spec.ts` (localStorage and sessionStorage checked); unit `settings.test.ts`, `cache.test.ts` | Pass |
| WX-01 | Current conditions with timestamps; unavailable shown | E2E `location.spec.ts` null-current journey; unit `cache.test.ts` (90 min / 10 min rules) | Pass |
| WX-02 | Next 24 hours with local dates and time zone | E2E `experience.spec.ts` timeline and Chicago DST journeys; unit `time.test.ts` | Pass |
| WX-03 | Missing → unavailable; stale marked; critical missing blocks recommendations | E2E Limited data and stale journeys; unit `normalize.test.ts`, `score.test.ts`, `reducer.test.ts` | Pass |
| ACT-01 | Five activities; switching reranks locally | E2E all activities with exactly one forecast request; lab switch latency 23–40 ms (target < 100 ms) | Pass |
| PREF-01 | Feels-like range, rain, wind, daylight-only, duration, units; reset per activity | E2E persistence and invalid-edit journeys; unit `settings.test.ts`, `units.test.ts` | Pass |
| WIN-01 | Up to three non-overlapping windows, deterministic | Unit `windows.test.ts` (ranking, ties, adjacency, 30–120 min); E2E window journeys | Pass |
| WIN-02 | Honest empty results | Unit `windows.test.ts` empty-reason priority; E2E flagged-hours journey | Pass |
| EXP-01 | Explanations from scoring engine, no LLM | Unit `explanations.test.ts` (drivers ⊆ penalized, threshold, prohibited-word sweep) | Pass |
| ACC-01 | Keyboard, focus, semantics, live status, no color-only meaning | axe 0 violations on all pages in Chromium, Firefox and WebKit (incl. forced colors); timeline single Tab stop; contrast unit tests; reflow 320/640 px; targets ≥ 24 px | Pass (automated). Manual screen reader and real devices: **Pending** |
| OSS-01 | MIT, setup, tests, deployment, attribution, commercial caveat | `LICENSE`, `README.md`, `CONTRIBUTING.md`, `THIRD_PARTY_NOTICES.md`, `docs/08-DEPLOYMENT.md`; fresh-copy `npm ci` → all checks pass without `.env` | Pass |
| OPS-01 | Debounce, cancellation, bounded retries, 429 feedback, cache | Unit `fetchJson.test.ts`, `provider.test.ts`, `cache.test.ts`, `reducer.test.ts`; E2E outage, 429, race and cache journeys | Pass |
| DOC-01 | About, methodology, privacy, not-found pages | Built pages; axe and one-H1 checks; readable without JS | Pass |

## End-to-end journeys (docs/06-TEST-PLAN.md)

| # | Journey | Spec file | Result |
|---|---|---|---|
| 1 | Fresh browser, no prompt, search, attribution | `search.spec.ts` | Pass |
| 2 | Device location success, rounded, Current area | `location.spec.ts` | Pass |
| 3 | Permission denied/timeout/unavailable | `location.spec.ts`, `provider.test.ts` | Pass (see LOC-01 note) |
| 4 | Same-name cities; newest response wins | `search.spec.ts`, `location.spec.ts` race | Pass |
| 5 | Switch all activities, no refetch | `experience.spec.ts` | Pass |
| 6 | 90 minutes, custom wind, units, persist after reload | `experience.spec.ts` | Pass |
| 7 | Remember on/off, Saved label, Forget | `experience.spec.ts` | Pass |
| 8 | Outage with fresh, stale and expired data | `location.spec.ts`; `reducer.test.ts` for expiry | Pass |
| 9 | Missing critical field → Limited data | `experience.spec.ts` | Pass |
| 10 | Flagged interval shown and excluded | `experience.spec.ts` | Pass |
| 11 | Remote city time zone and repeated DST hour | `experience.spec.ts` | Pass |
| 12 | Offline and storage-disabled | `accessibility.spec.ts` | Pass |
| 13 | Keyboard-only, focus, 360 px, no page overflow | `experience.spec.ts`, `accessibility.spec.ts` | Pass (automated) |
| 14 | No-JS supporting pages and home explanation | `accessibility.spec.ts` | Pass |
| 15 | CSP permits intended requests, blocks others | `security.spec.ts` (and every journey fails on any CSP report) | Pass |

Cross-browser run (after the 2026-11-12 redesign): `E2E_ALL_BROWSERS=1 npm run test:e2e` → 101 passed; skips are opt-in screenshot/perf captures and the Firefox denial case (15 opt-in screenshot/perf, 1 Firefox denial). Chromium-only suite stable over 3 repeats (102/102 at M4).

## Performance (lab)

Configuration: Chromium, 390×844, CPU 4× slowdown, network about 1.6 Mbps down / 750 kbps up / 150 ms RTT, local production server (`PERF=1 npx playwright test perf --project=chromium`). API latency excluded.

| Metric | Budget | Measured (3 runs) |
|---|---|---|
| Initial first-party JS (gzip -9) | ≤ 100 KB | 95.9 KB |
| CSS (gzip -9) | ≤ 30 KB | 6.0 KB |
| Display font (self-hosted woff2) | not budgeted | 13.8 KB |
| LCP, static first render | ≤ 2.5 s | 560–568 ms (after the 2026-11-12 redesign; 416–436 ms before the display font) |
| CLS | ≤ 0.1 | 0 |
| Activity switch to next paint | < 100 ms | 23–40 ms |

These are local lab numbers, not field data. Real-device and hosted measurements: **Pending (release)**.

## Release checks

| Check | Result |
|---|---|
| Live smoke in 5+ cities through the deployed UI | Pass 2026-11-12 on https://hows-it-outside.pages.dev (commit `ec9ed96`): St. Louis, London, Chennai, Sydney, Tromsø, Kathmandu each loaded live weather with the correct IANA zone, a matching sky, 25 hourly items and no console errors. Found and fixed one bug first: input before hydration was lost and natively submitted |
| Provider eligibility (non-commercial use from a portfolio subdomain) | Owner confirmed non-commercial use of the free API (2026-11-12) |
| Real repository URL, contact and security route | Repository: https://github.com/iamarunr/hows-it-outside; security reports via GitHub private vulnerability reporting |
| Cloudflare Pages project, custom domain, HTTPS | Project `hows-it-outside` (classic Pages, direct upload) live with HTTPS at hows-it-outside.pages.dev; custom domain outside.knnaresh.com **deferred by the owner (2026-11-12)**; production canonical is the pages.dev address until then |
| Production response headers and CSP verified on the host | Pass on the preview and production pages.dev hosts: CSP (no unsafe-inline, exact Open-Meteo origins, frame-ancestors none), nosniff, no-referrer, Permissions-Policy, X-Frame-Options, immutable caching for /_astro/*, real 404 |
| Preview deployments not indexable | Pass: preview.hows-it-outside.pages.dev sends `X-Robots-Tag: noindex, nofollow` and the robots meta; production sends neither |
| Dependency audit | Production dependencies: 0 vulnerabilities. Dev tooling: 12 moderate (one `minimatch` advisory via ESLint packages, not shipped); no forced upgrade |
