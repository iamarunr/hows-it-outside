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
FIRST VIEWPORT: (Bolder pass, owner 2026-11-12: "sky fills first screen", "slow ambient motion".) The whole first screen below the slim header is the sky. Empty state: "HOW'S IT OUTSIDE?" in display capitals up to about 14rem set into the sky (day or night from the visitor's clock), a one-line lede, then Use my location, search and units sitting on the sky. Results: toolbar (Change location, units) on the sky; city (display, up to about 8.5rem) and current temperature (display, up to about 14rem) with condition; a hairline, then the next-hour verdict in display capitals with reasons and the comparison, and the activity pills, all on the sky. Every control on the sky takes the sky's ink. Below the sky: Now as scoreboard numbers, the charcoal band, then the hourly strip led by large temperatures.
FORM: Owner-pinned reference world (Dutchblue), position 1 of 1; no seed key (pinned, concept roll skipped). Signature move: the sky gradient shifts to the conditions (clear, cloudy, rain, snow, storm, fog, night) through registered colour properties, with slow ambient motion (cloud drift, rain, snow, star twinkle) that stops under reduced motion.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
