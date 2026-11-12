# 06 — Test plan and acceptance evidence

## Strategy
Use Vitest for pure domain and service tests, React integration tests for important state behavior, Playwright for user journeys, and axe integration for automated accessibility checks. Fixtures and an injected clock make tests deterministic. Do not test implementation details such as hook call order or CSS class names. Do test user-visible outcomes and domain invariants.

Clock and network control:
- Unit/integration: domain and controller functions take `now` (epoch seconds) as an explicit argument or injected clock; no direct Date.now() inside domain modules.
- E2E: every fixture declares a `referenceNow` epoch. Tests install Playwright's built-in clock control (`page.clock`, e.g. install/setFixedTime or pauseAt) before navigation, set to that `referenceNow`, and advance it explicitly to exercise due/stale/expired tiers and selected-hour expiry. Provider requests are intercepted with `page.route` on the exact Open-Meteo origins and answered from fixtures; unmatched requests to those origins fail the test.
- No test hook, fixture switch, global flag or query parameter that changes clock or data source may exist in the production bundle. A build test greps `dist/` for fixture identifiers and test-only markers.

## Required domain tests
| Area | Cases / expected outcome |
|---|---|
| Coordinates | zero valid; limits valid; out of bounds/NaN rejected; round before provider URL |
| Temporal mapping | interval at 10:00 uses 10:00 instant samples and 11:00 precip/probability/gust; no one-hour rain shift |
| Input shape | nulls, missing fields, short arrays, duplicate timestamps, unsorted times, gaps, invalid units |
| Scoring | every golden example; 45/75 boundary; exact preset weights; null vs zero; no mutation; worst-factor cap inactive at worst ≤0.5, 70 at 0.75, 40 at 1; any single saturated penalty yields Poor for every preset |
| Monotonicity | increasing rain probability/amount cannot improve score; moving farther outside comfort band cannot improve score; holds across the cap transition (property test over random penalties) |
| Flags | every boundary and weather code including 97; flags survive missing other fields and preference changes |
| Windows | 30/60/90/120 min; unequal overlap; crossing midnight; incomplete coverage; horizon cutoff; non-overlap ranking; exact tie earlier |
| Daylight | full daylight; dawn/dusk conservative exclusion; polar day/night; missing is_day |
| Explanations | same factors as score; measured units; deterministic ties; no safety language; capped interval leads with its saturated dimension |
| Units | conversions round-trip within tolerance; score invariant under display-unit changes; display-unit change produces the same cache key and no request |
| Search | 1-char query never auto-searches; 2-code-point CJK query auto-searches after debounce; Enter submits any non-empty query immediately; 120-char limit |
| Timezone | target differs from device; America/Chicago DST fall and spring; Asia/Kolkata and Asia/Kathmandu offsets; invalid IANA fallback |
| Storage | corrupted JSON, old version, disabled storage, quota exception, reset/forget, remember=false removes prior location |
| Cache | tier boundaries exactly at 15 min (due), 60 min (stale), 2 h (expired); recommendations shown while due and while refreshing, hidden once stale; future fetchedAt invalid; LRU 5; selection change; request dedupe |
| Network | abort, timeout, one retry only, 429 cooldown, 400 no retry, malformed JSON, newest response wins |

## Synthetic fixture families
Create fixtures for mild dry day, hot humid day, gusty cycling day, rain beginning one hour later, thunderstorm, snow/freezing rain, incomplete probability, missing current with valid hourly, rate-limited provider, stale forecast, polar night and DST transition. Clearly mark these synthetic; they are not actual weather history. Each fixture documents the invariant it exercises. Use small fixtures for unit cases and full enough horizons for E2E ranking.

## End-to-end journeys
1. Fresh browser: no permission prompt; search St. Louis; choose matching city; see expected fixture weather and attribution.
2. Device location success: rounded coordinates sent; label Current area; user can change place.
3. Permission denied/timeout/unavailable: search remains fully usable; no repeated automatic prompt.
4. Search ambiguity: two same-name cities selectable; newest response wins after rapid typing.
5. Switch all activities; forecasts do not refetch; scores/reasons update.
6. Set 90 minutes, customize wind, change units; results match fixture and preferences persist after reload.
7. Remember location off/on; returning state labeled Saved; Forget removes persisted location/cache.
8. Provider outage with fresh, due, stale and expired cache (clock advanced via page.clock); due-tier recommendations remain with a Retrieved note; stale recommendations never shown; no flicker during a successful refresh.
9. Missing critical field displays Limited data; no false zero, sunshine or positive match.
10. Flagged interval excluded from recommendations, clearly displayed in timeline.
11. Remote city time zone and DST repeated hour show correct unique labels.
12. Offline and storage-disabled contexts remain recoverable.
13. Keyboard-only task completion, visible focus, no traps; timeline is a single Tab stop with arrow/Home/End navigation; touch at 360px; no whole-page overflow.
14. JavaScript-disabled supporting pages readable and home fallback explains need.
15. Production build CSP permits intended requests and blocks unexpected sources.

## Browser coverage
Automate Chromium, Firefox, and WebKit where CI supports them. Also manually check actual Safari on iOS/macOS when available; Playwright WebKit is not a claim of full Safari device coverage. Test real device permissions separately from emulated success. Report unavailable environments honestly.

## Performance and accessibility evidence
Record tool version, build commit, viewport and throttling. Measure gzip JS/CSS, static first render and forecast-ready separately. Target Lighthouse accessibility with no critical/serious axe findings; still perform keyboard and screen-reader checks. Verify contrast for actual states, 200%/400% zoom, reduced motion and forced colors. Performance budgets are in PRB; disclose misses and cause.

## CI gates
On PR: clean npm ci; check; lint; unit/integration tests; production build; E2E against built preview. No live provider dependency. Upload failure traces/screenshots with synthetic fixtures only. Add dependency audit review without allowing an unreliable external service to mask functional test status. No broad snapshot update to conceal changed results.

## Release acceptance ledger
Create docs/ACCEPTANCE-RESULTS.md mapping each P0 ID to tests/manual evidence, commit and result. Include live API smoke results for five locations (for example St. Louis, London, Chennai, Sydney, Tromsø), timezone checks, provider attribution and custom domain HTTPS/header checks. Do not mark DNS/deployment checks passed before release. Mark pending owner authorization where applicable.
