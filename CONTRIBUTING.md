# Contributing to Outside?

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

Requirements: Node 26 (see `.nvmrc`) and npm.

```sh
npm ci
npx playwright install chromium   # once, for end-to-end tests
npm run dev                       # http://localhost:4321
```

No API key or secret is needed. The app calls Open-Meteo directly from the browser.

## Checks (run before opening a PR)

```sh
npm run check      # Astro + TypeScript
npm run lint
npm run test       # unit and integration tests (Vitest, no watch)
npm run build      # production build + CSP headers + bundle guard
npm run test:e2e   # Playwright against the built site
```

CI runs the same commands. A failing check must be fixed or explained, never skipped.

## Ground rules

- **No live network in tests.** Unit tests use fixtures; E2E tests intercept Open-Meteo with `page.route` and control time with `page.clock` (see `tests/e2e/support/`). Live calls belong only in `npm run field-check`, which you run by hand.
- **Fixtures** live in `tests/fixtures/`. Every JSON fixture has a `_fixture` block saying whether it is synthetic and which invariant it exercises. Never present synthetic weather as real.
- **Missing is not zero.** Weather values may be `null`; keep them `null` and show "Unavailable".
- **Domain code stays pure.** `src/domain/`, `src/lib/{time,units,geo}.ts` and `src/services/weather/normalize.ts` must not import React, network or storage code, or use browser globals. Lint enforces this.
- **SI inside, display units at the edge.** Internal values are °C, km/h, mm and UTC epoch seconds; format with the target place's IANA time zone.
- **Accessibility is part of done.** Keyboard-only use, visible focus, labels, no color-only meaning, ≥4.5:1 text contrast (token pairs are tested in `tests/unit/contrast.test.ts`). The axe journeys in `tests/e2e/accessibility.spec.ts` must stay at zero violations.
- **Bundle budget:** initial JS ≤ 100 KB gzip, CSS ≤ 30 KB. Measure after UI changes.
- **No inline styles or event-handler attributes** in rendered HTML; the build fails because the CSP cannot allow them.

## Changing scoring

Scores are product heuristics, not safety or health thresholds. To change a threshold, weight or rule:

1. Add or update boundary tests first (`tests/unit/score.test.ts`, `windows.test.ts`, `explanations.test.ts`).
2. Change the constants in `src/domain/activities.ts` (bump `SCORING_VERSION` if results change).
3. Update `docs/04-SCORING.md`, the Methodology page and `CHANGELOG.md`.

## Pull requests

Describe the problem and the result, list the tests you ran, include screenshots for UI changes, and note any privacy or methodology impact. Do not include real coordinates, addresses or screenshots showing where you live.
