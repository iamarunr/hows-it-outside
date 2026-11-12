# 09 — Open-source documentation and launch checklist

## Licensing decision
Recommended app code license: MIT, copyright 2026 Naresh Kumar. Add the standard full MIT text as LICENSE during implementation. This permits reuse of code; it does not relicense provider datasets, third-party icons, dependencies, or grant rights to a hosted API plan. Include a THIRD_PARTY_NOTICES.md for actual assets/dependencies needing attribution. Do not copy the provider's server implementation into this client project; server-source licenses can differ from API data access terms.

## README requirements
Start with a real screenshot and a one-sentence purpose. Prominent Live demo and Source links using verified URLs. Explain no account needed, location permission optional, and suitability is preference-based. Include prerequisites, npm ci/dev/build/test commands, configuration, architecture summary, supported activities, limitations and deployment instructions. The free setup must work without an owner secret. Explain commercial API migration in plain terms.

## Contributor experience
CONTRIBUTING.md: setup, checks, fixture conventions, accessibility expectations, no live network in tests, scoring change policy and small PR guidance. SECURITY.md: an actual configured reporting route; do not invent security@ addresses. If no private contact is supplied, mark route pending release and ask owner before publishing. CODE_OF_CONDUCT optional but if included use a maintained standard and a real enforcement contact.

Issue templates: bug with browser/version, activity, units, expected vs actual, sanitized reproduction; feature with user problem and scope; scoring feedback with clear disclaimer that preferences vary. Do not request raw geolocation. PR template asks problem/result, tests, screenshots for UI, methodology/privacy impact.

## Extension boundaries
Add an activity by adding a typed preset plus tests and UI label. Add a weather provider by implementing the normalized adapter contract, not rewriting components. Add a language through a centralized copy map and locale formatters. Add new inputs such as AQI only by changing schema, scoring policy, disclosures and tests together. No need for a plugin framework in v1.

## Portfolio integration
Once the app is live, add a project entry to the portfolio in a separate authorized change: Outside?; concise description; live site; source; stack; screenshot. Do not imply validated health advice or guaranteed hyperlocal accuracy. The app footer can link to knnaresh.com without importing the whole portfolio navigation.

## Public launch checklist
Real repository URL and contact; MIT text; accurate screenshot; fresh-clone verification; working demo; provider eligibility and attribution; public methodology/privacy; no fixture data; documented limitations; changelog v1.0; accessible controls; known issues; CI passing; deployment rollback record.
