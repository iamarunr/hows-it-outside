# 10 — Architecture decisions, assumptions and references

## Decision register
| ID | Decision | Reason / consequence |
|---|---|---|
| ADR-001 | Separate Astro app/repo | Portable open-source project and independent portfolio deployment |
| ADR-002 | Static output plus single React island | Simple hosting and one coherent interactive state tree |
| ADR-003 | Direct public provider calls for eligible deployments | Zero secrets/backend; provider sees client network metadata |
| ADR-004 | No reverse geocoding | Fewer services/privacy exposure; GPS selection is labeled Current area |
| ADR-005 | Two-decimal coordinate rounding | Reduce unnecessary precision; not an anonymity guarantee |
| ADR-006 | UTC arithmetic, IANA display | DST correctness and remote-city support |
| ADR-007 | Normalize preceding-hour fields separately | Prevent rain/gust from being shifted into the wrong outing hour |
| ADR-008 | Pure deterministic heuristics | Testable, inspectable, no AI cost or fabricated advice |
| ADR-009 | Missing critical inputs block recommendation | Avoid false favorable verdicts |
| ADR-010 | Independent concerning-weather flags | User tolerance cannot erase forecast concerns |
| ADR-011 | Local preferences; opt-in saved location | Useful returning experience without accounts |
| ADR-012 | No maps, AQI or official alerts in MVP | Keep scope honest and manageable; disclose exclusions |
| ADR-013 | Static Pages; Workers if server proxy needed | Avoid stale SSR adapter assumptions |
| ADR-014 | MIT app code; data licenses separate | Make forks usable without misrepresenting provider rights |
| ADR-015 | Worst-factor cap on interval score | A single fully unacceptable dimension (e.g. steady rain when avoiding rain) yields Poor instead of being averaged to Mixed |
| ADR-016 | Freshness tiers: refetch at 15 min, pause suggestions at 60 min, expire at 2 h | Avoid pausing useful suggestions for briefly offline visitors; refresh never blanks results |
| ADR-017 | Cache key uses request units only | Display-unit switches never refetch |
| ADR-018 | CSP via generated `_headers` with build-time hashes | Header-only directives work; no unsafe-inline; verified in CI |
| ADR-019 | Playwright clock + route interception for E2E | Deterministic time-dependent tests with no test hooks in production |
| ADR-020 | Search at 2 code points; Enter submits any non-empty query | Supports short and CJK place names worldwide |
| ADR-021 | Timeline as single Tab stop with arrow navigation | Keyboard users are not forced through 24 stops |

## Assumptions to record during implementation
Outside? is a working brand, not a trademark clearance. No existing app repo has been reviewed. Cloudflare is a recommended deployment target; actual DNS account/zone is unverified. Current provider API eligibility for a professional-portfolio subdomain remains unresolved. Scoring thresholds are product proposals, not researched medical thresholds. Date/time examples and fixtures are synthetic unless explicitly noted.

## Verified primary documentation, checked 11 November 2026
Use these as integration references and recheck at implementation/release. External contracts can change. This pack intentionally summarizes only the needed integration facts and specifies its own product behavior.

1. Open-Meteo forecast reference: https://open-meteo.com/en/docs — requested field names, units, temporal interpretation and weather codes. Integration requirement: distinguish instantaneous values from preceding-hour precipitation/probability/gust aggregates.
2. Open-Meteo geocoding reference: https://open-meteo.com/en/docs/geocoding-api — search endpoint, query parameters, result structure and location attribution.
3. Open-Meteo pricing: https://open-meteo.com/en/pricing — hosted free access is noncommercial; published limits include 10,000 calls/day, alongside other caps. Paid access uses customer endpoints. Recheck before launch.
4. Open-Meteo terms: https://open-meteo.com/en/terms — deployment eligibility and conditions; open-source application status alone does not decide hosted service rights.
5. Open-Meteo repository: https://github.com/open-meteo/open-meteo — provider attribution and source information.
6. Astro Cloudflare deployment: https://docs.astro.build/en/guides/deploy/cloudflare/ — current deployment guidance; distinguish static hosting from current adapter-backed server targets.
7. Cloudflare Astro Pages guide: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/ — static build command/output and hosting project setup.
8. Cloudflare build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/ — project build settings.
9. MDN getCurrentPosition: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition — secure context and user permission requirements.
10. MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API — browser permission and policy model.

## Conflict handling
Some older Astro documentation supports server-rendered Pages configurations that current adapter guidance no longer supports. The proposed MVP avoids this conflict by using plain static output. If implementation adds server routes, check documentation for the exact installed adapter version and prefer the currently supported Workers path. Do not treat historical docs as current instructions.

## Release questions, not coding blockers
- What is the exact public GitHub repository URL?
- What public contact/reporting method should appear?
- Does the intended hosting/provider usage qualify as noncommercial? If unclear, seek provider clarification or use an appropriate paid deployment.
- Who controls the Cloudflare/DNS zone and authorizes release?

Capture answers in the decision register. Do not invent them or stop ordinary implementation while they remain open.

## Open product calls (owner may revisit; current defaults stand)
- Daylight-only defaults on for every activity, which excludes most winter daytime at high latitudes and all early-morning runs. Consider defaulting it off for Run.
- Unit defaults follow `en-US` locale, which many non-US browsers report; the override covers it.
- No telemetry means provider contract changes surface only through user reports. An optional scheduled live smoke check (outside unit CI) would detect them; not created by this pack.

## Implementation decision log

| Date | ID | Decision | Reason / deviation |
|---|---|---|---|
| 2026-11-11 | IMP-001 | Node 26 LTS, Astro 7.4, React 19.3, TypeScript pinned `~6.0.3` | TypeScript 7 is current but typescript-eslint requires <6.1 and @astrojs/check requires ^5 or ^6 |
| 2026-11-11 | IMP-002 | `eslint-plugin-jsx-a11y-x` instead of `eslint-plugin-jsx-a11y` | The original does not support ESLint 10; eslint-plugin-astro accepts the fork |
| 2026-11-11 | IMP-003 | Own post-build CSP hasher (`scripts/csp-headers.ts`) rather than Astro's `security.csp` | Astro's stable CSP emits a `<meta>` policy for static output; header delivery is required (ADR-018). One hash source avoids two diverging policies |
| 2026-11-11 | IMP-004 | `build.inlineStylesheets: 'never'` | Keeps page CSS external so only Astro's tiny island style needs a hash |
| 2026-11-11 | IMP-005 | E2E runs against `scripts/serve-dist.ts`, not `astro preview` | `astro preview` ignores `_headers`; tests must enforce the real CSP. `npm run preview` remains `astro preview` |
| 2026-11-11 | IMP-006 | CI runs Chromium only; Firefox/WebKit opt-in via `E2E_ALL_BROWSERS=1` | Review recommendation; full matrix before release |
| 2026-11-11 | IMP-007 | `zod/mini` for runtime validation | Full `zod` added ~17 KB gzip; React DOM already uses ~66 KB of the 100 KB budget |
| 2026-11-11 | IMP-008 | Time-zone fixture asserts wall-clock date/time/offset, not display strings | Zone abbreviations vary across ICU builds (IST vs GMT+5:30) |
| 2026-11-11 | IMP-009 | Empty-window reason = the priority stage (data → daylight → flag → preference) at which no candidate remains | Spec says "highest-priority applicable reason in that order"; applying constraints as sequential filters makes "applicable" deterministic and avoids blaming missing data when other candidates had data |
| 2026-11-11 | IMP-010 | Missing coverage and missing fields share one rejection, `data` | Spec groups them as "missing coverage/data"; `coverageComplete` is still exposed |
| 2026-11-11 | IMP-011 | Unit mismatch or missing unit for a field nulls that field (diagnostic) rather than rejecting the response; non-`unixtime` axis rejects the response | Conservative per-field degradation; time axis is authoritative |
| 2026-11-11 | IMP-012 | Air/feels-like temperatures outside -100…70 °C become null (heuristic sanity bound) | Spec asks to validate ranges but gives no temperature bound |
| 2026-11-11 | IMP-013 | Flagged intervals with missing data are labeled Check conditions, not Limited data | Flags take precedence and must stay visible (SCORING §5) |
| 2026-11-11 | IMP-014 | Added copy for the `preference` empty state: "No window in the next 24 hours matches your preferences. Try another duration or adjust your preferences." | DESIGN.md gives copy for the other empty states but not this one |
| 2026-11-11 | IMP-015 | A flagged next hour compares only as "better later" (never "similar" or "now is best") | Spec: do not imply a flagged current period is recommended |
| 2026-11-11 | IMP-016 | Unit tests run with `TZ=Pacific/Chatham` | Any accidental device-zone use shows up as a failure |
| 2026-11-11 | IMP-017 | Location denial/unavailability is a `geoNotice` beside LocationState (`none \| locating \| selected`) | A failed "Use my location" must keep any previously selected place and its forecast; a separate notice expresses spec's denied/unavailable states without discarding it |
| 2026-11-11 | IMP-018 | The single polite live region is written directly from callbacks/effects, not through React state | Avoids extra renders and the react-hooks set-state-in-effect rule; still one status region for search counts and weather loading |
| 2026-11-11 | IMP-019 | Focus moves to the weather heading only after a visitor's own selection, not on saved-location restore | Spec: focus deliberately on selection; never steal focus on load or auto-refresh |
| 2026-11-11 | IMP-020 | Settings, saved location and locale units load in an effect after hydration | Static HTML is rendered at build time without storage; avoids hydration mismatches |
| 2026-11-11 | IMP-021 | Automatic refresh also retries after `offline`/`network` errors when the browser comes back online or on the minute check | Recovers from brief connectivity loss without user action; other errors need Try again; 429 cooldown always respected |
| 2026-11-11 | IMP-022 | Device-location label shows "Approximate · Current area" and "Based on your approximate location" | DESIGN: GPS selection is "Current area", never an invented city |
| 2026-11-11 | IMP-023 | Reasons name a factor only when its peak unweighted penalty in the window is ≥ 0.25; otherwise "Within…" or "Close to your preferred temperature range…" | Screenshot review showed Good windows explained as "Higher chance of precipitation (5% chance)"; ranking and scores are unchanged. SCORING §8 updated |
| 2026-11-11 | IMP-024 | Times format in `en-US` style in every locale for v1 | Localization is P1; formats are still computed in the target IANA zone |
| 2026-11-11 | IMP-025 | Heading outline: H1 page question; H2 "Weather for …"; H3 next hour, Now, best times, next 24 hours; H4 selected hour | One H1, logical nesting for screen-reader navigation |
| 2026-11-11 | IMP-026 | Daylight-only toggle sits with the duration control; rain, wind and comfort range sit in the Preferences disclosure | DESIGN page order item 6; daylight-only remains per activity |
| 2026-11-11 | IMP-027 | New `--color-control-border` (#7c8a7c, ≥3:1) for interactive outlines; `--color-divider` stays decorative | Divider was 1.26:1, too faint as the only boundary of timeline buttons (WCAG 1.4.11) |
| 2026-11-11 | IMP-028 | No-JS fallback uses an `html.js` class set by a one-line inline script (hashed into the CSP) instead of `<noscript>`; the inert tool is hidden without JS | Shows a working explanation instead of controls that do nothing; testable in Playwright |
| 2026-11-11 | IMP-029 | E2E server on dedicated port 4791 with `reuseExistingServer: false` | Another local site on 4322 was silently reused; a busy port must fail the run |
| 2026-11-11 | IMP-030 | The location row shows only "Saved location"/"Approximate location" plus Change; the place name appears once, in the weather heading | Mobile review: the name appeared twice and pushed the verdict down |
| 2026-11-11 | IMP-031 | Desktop (≥900 px) overview: summary and activity left, Now right, via grid areas with unchanged DOM order | DESIGN: two columns only where reading order stays natural |
| 2026-11-11 | IMP-032 | Preview noindex via `PUBLIC_NOINDEX=true` (meta robots + `X-Robots-Tag` in generated `_headers`); hosted builds fail without `PUBLIC_SITE_URL` | Explicit per-environment control; production can't silently ship noindex or localhost canonicals |
| 2026-11-11 | IMP-033 | Geolocation has a 20 s guard timeout in addition to the API's 10 s timeout | Firefox never calls back while a permission prompt is ignored; without the guard the button stayed on "Finding your location…" |
| 2026-11-11 | IMP-034 | Forced-colors selection is a thick `Highlight` outline plus bold text, not a Highlight background | Firefox's emulated palette paired white on #3399ff (2.94:1); outlines keep the user's own text colors |
| 2026-11-11 | IMP-035 | Native `<select>` uses `appearance: none` with an inline SVG arrow | Safari ignores `min-height` on native selects (23 px tall) |
| 2026-11-11 | IMP-036 | `npm audit` runs as a separate, advisory CI job (`--omit=dev`) | Spec: an external advisory service must not mask functional test status; dev-only findings (ESLint's `minimatch`) are documented, not force-upgraded |
| 2026-11-11 | IMP-037 | Spec-pack README moved to `docs/00-HANDOFF.md`; root README is now the contributor README | OSS-01 needs a first-time-contributor README at the root |
| 2026-11-11 | IMP-038 | Lab performance check is an opt-in Playwright spec (`PERF=1`) using CDP throttling | No Lighthouse dependency; numbers recorded in `docs/ACCEPTANCE-RESULTS.md` with configuration |
