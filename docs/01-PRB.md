# 01 — Product Requirements Brief / PRD

## 1. Purpose and positioning
Outside? answers two questions: “What is it like outside for what I want to do?” and “When is a better time in the next 24 hours?” It turns weather into an understandable preference match, while keeping the underlying forecast visible. It is not a route planner, warning service, medical advisor, or guaranteed real-time observation feed.

The website is the product. A visitor clicking its public link should see a functional tool, not repository instructions. GitHub is a secondary link for developers. No account, onboarding wizard, installation, payment, or personal profile is required.

## 2. Goals and non-goals
P0 goals: immediate location selection, clear current summary, comparable hourly outlook, activity-specific preferences, best continuous window, worldwide place search, honest limitations, mobile and keyboard usability, easy static self-hosting.

Non-goals for v1: maps, routes, direction-specific cycling wind, minute-by-minute rain predictions, official hazard coverage, AQI, UV, pollen, mountain or marine advice, event calendars, social feeds, push notifications, accounts, multiple saved places, monetization, AI-generated advice, native mobile apps, offline PWA behavior.

Do not describe excluded variables as checked. “Good match” is based on the displayed forecast dimensions, not air quality or official alerts. Swimming, climbing, boating and remote hiking need different data and must not be implied by the general label.

## 3. Personas and use cases
- Casual visitor: wants to walk for half an hour, accepts default preferences.
- Runner/cyclist: wants to compare heat, wind and precipitation across a longer outing.
- Parent or friend: wants a comfortable period to sit outdoors.
- Traveler: searches a remote city; needs that city's local time, not their laptop's time.
- Privacy-conscious visitor: denies location, manually searches, disables persistence.
- Developer: clones the repository, runs it without secrets, deploys independently.

## 4. MVP functional requirements

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| LOC-01 | P0 | Explicit Use my location button | No location prompt before user action; denied/timeout/unavailable flows offer city search |
| LOC-02 | P0 | Global city search | Keyboard-selectable results include city, region and country; selection fetches correct coordinates |
| LOC-03 | P0 | Returning location | With remember enabled, restore a rounded location marked Saved location; never silently reacquire GPS |
| LOC-04 | P0 | Reset privacy controls | Forget location clears persisted location and forecast cache; stays usable in memory |
| WX-01 | P0 | Current conditions | Actual, apparent temperature, wind/gusts, condition text and data timestamps shown where available |
| WX-02 | P0 | Next 24 hours | Scrollable timeline plus readable detail, with local dates and timezone |
| WX-03 | P0 | Data integrity | Missing fields show unavailable; stale data is marked; critical missing data prevents recommendations |
| ACT-01 | P0 | Activity choice | Outdoors default plus Walk, Run, Bike, Hang out; changes rerank locally |
| PREF-01 | P0 | Preferences | Feels-like range, rain tolerance, wind tolerance, daylight-only, duration, units; reset per activity |
| WIN-01 | P0 | Best window | Up to three non-overlapping windows for chosen duration, ranked deterministically |
| WIN-02 | P0 | Honest empty results | No suitable/eligible window explains constraints rather than recommending poor or incomplete periods |
| EXP-01 | P0 | Explanations | Summary reasons derive from the scoring engine; no LLM required |
| ACC-01 | P0 | Accessible interaction | Full keyboard task completion, visible focus, semantic controls, live status, no color-only meanings |
| OSS-01 | P0 | Reusable source | MIT code license, setup, tests, deployment, data attribution and commercial API caveat |
| OPS-01 | P0 | Resilient requests | Debounce, cancellation, bounded retries, rate-limit feedback and cache |
| DOC-01 | P0 | Public supporting pages | About, methodology, privacy, and not-found pages |
| SHARE-01 | P1 | City-level sharing | Later; no GPS sharing by default and not needed for MVP |

## 5. First visit and return visit
First visit: app name, concise question, location button and search; no forecast until a place is selected. A clearly labeled example may appear in development only. Once selected, show skeletons and a single status message, then conditions. Activity defaults to Outdoors; duration 60 minutes. Preferences are optional.

Return visit: restore versioned preferences and, if explicitly enabled previously, saved rounded location; label saved rather than current. Fetch when cache is stale. Keep a visible Change location action and one-click location refresh. A saved location is not evidence the person is still there.

## 6. Preference behavior
Default units are Celsius/km/h/mm unless navigator locale explicitly includes US; en-US defaults to Fahrenheit/mph/in. Language alone does not establish country; fall back to metric. The visitor can override at any time. Switching units changes formatting only and cannot change the recommendation. Duration choices: 30, 60, 90, 120 minutes. Activity-specific settings persist separately; duration and units are global. Daylight-only defaults on for all activities and can be switched off without hiding concerning-weather notices.

Preference edits update results immediately. Forms use numeric controls with visible bounds, not sliders alone. Celsius comfort bounds -30 to 45, low strictly below high. Invalid edits retain last valid applied values and show inline errors. Tolerance enums: rain avoid/light/okay; wind low/medium/high. Rain tolerant never disables severe-weather flags.

## 7. Success measures and launch criteria
No analytics service in v1. Evaluate with scripted usability tasks and optional owner testing: a new visitor reaches conditions within two deliberate choices; activity switches respond under 100 ms on a representative midrange phone; search denial never traps the user; at least five representative international locations render correctly in manual smoke testing.

Performance targets: initial first-party JS <=100 KB gzip, CSS <=30 KB gzip; static initial page target LCP <=2.5 s, CLS <=0.1 in a documented mobile lab configuration. API latency is reported separately. These are budgets to measure, not promises already achieved.

## 8. Risks and mitigations
Provider availability/limits: cache, backoff, visible failure. Worldwide variability: missing-data handling. Misleading recommendation: heuristic labeling, separate flags, no safety language. Privacy: permission on action, rounding, opt-in persistence. Time zones: UTC arithmetic with IANA formatting and DST tests. Scope growth: defer maps/AQI/alerts. Commercial eligibility: release gate and proxy design.

## 9. Remaining owner decisions
Not blockers for coding: exact repository URL, public contact method, final display name, domain account configuration, and live API commercial eligibility. Default to Outside?, MIT, no analytics, light theme, and no monetization. Do not invent contact addresses or GitHub URLs; hide unconfigured links in previews and require them before public launch.
