# Agent instructions

## Invariants
- Preserve unrelated work. Never overwrite the portfolio or an existing deployment.
- Implement the PRB scope, not speculative future features.
- Pure scoring/normalization/time modules must not import React, browser globals, or network code.
- No private location in page URLs, analytics, logs, or issue templates.
- No credentials in client bundles. Free mode has no credentials at all.
- Never coerce missing weather values to zero, falsy coordinates to missing, or UTC seconds to local ISO strings.
- Recommendations must be explainable from the same contributions used by the scoring engine.
- Raw provider data is untrusted input. Validate at the boundary.
- Mark product assumptions and heuristic thresholds explicitly.

## Commands the completed repository must expose
`npm run dev`, `npm run build`, `npm run preview`, `npm run check`, `npm run lint`, `npm run test`, `npm run test:e2e`.

`check` runs Astro and TypeScript checks. `test` is a non-watching unit/integration run. CI must not call a watching test command. Add scripts using the actual installed tools, not placeholder echo commands.

## Engineering style
Strict TypeScript; avoid any and non-null assertions at API boundaries. Use discriminated unions for asynchronous states. Small cohesive functions; explicit input time for deterministic logic. Prefer semantic HTML and platform APIs. Use a single validated configuration module. Avoid a global state library unless demonstrated necessary.

## Changes and evidence
Before changing scoring, add or update boundary tests and a methodology entry. Before changing storage, add migration/reset tests. Before changing request caching, test stale, abort, and retry cases. Update docs when behavior changes. Record version changes and reasons in CHANGELOG.md.

## Scope and completion
No deploy, paid subscription, or DNS mutation without owner authorization. Do not claim live smoke tests, accessibility conformance, or browser support beyond evidence actually collected. Explain blocked checks. Stop adding features when acceptance criteria pass.
