---
version: 1
slug: "src-features-outside-outsideapp-tsx"
primary_target: "src/features/outside/OutsideApp.tsx"
related_targets: ["src/styles/outside.css","src/styles/global.css","src/styles/tokens.css"]
---

# Surface brief: Outside? home (weather tool)

Scope: the home route's interactive tool (src/features/outside) plus the shared shell and supporting pages it styles. Mode: Operate.

Audience and job: anyone, often on a phone before leaving home, deciding whether to go out now or when. Task: pick a place, optionally an activity, read the verdict, compare windows. Constraints: WCAG 2.2 AA (contrast unit-tested), 44 px targets, keyboard and screen-reader behaviour unchanged, strict CSP, JS budget 100 KB gzip (CSS-only styling), all tests pass.

Owner-pinned direction (2026-11-12): follow the Dutchblue site reference's look, tool-first; self-hosted Bebas Neue for display only; weather-aware CSS sky instead of photos. No concept roll: the direction is pinned.

## Direction contract
THESIS: The answer is a scoreboard set against the sky: place and temperature in huge condensed capitals over a sky that is the current weather. Refuses the category default of a small icon-and-number weather card.
OWN-WORLD: Bebas Neue capitals for every display line; system sans for reading. Cool pale ground, white surfaces, charcoal ink, navy for selection and action, slate for secondary ink, warm sand only as hairline detail. One full-bleed charcoal-olive band for the planning section. Pills with navy fill for choices, thin outlined ghost buttons for actions, drawn SVG status marks.
STORY: The visitor sees where and how warm it is, reads one verdict with reasons, switches activity, then plans with windows and the hourly strip.
FIRST VIEWPORT: Slim header; Change location and units pills; a full-bleed sky band with the city (display, about 4–7 rem) and current temperature (display, about 5–9 rem) plus condition; immediately below, the next-hour verdict in display capitals with two reasons. Activity pills follow. On a phone the verdict starts inside the first viewport.
FORM: Owner-pinned reference world (Dutchblue), position 1 of 1; no seed key (pinned, concept roll skipped). Signature move: the sky gradient shifts to the conditions (clear, cloudy, rain, snow, storm, fog, night) through registered colour properties.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
