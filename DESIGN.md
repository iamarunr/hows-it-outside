---
name: Outside?
description: A weather tool that answers "should I go out, and when?" as a scoreboard set against the current sky.
colors:
  ground: "#f3f5f7"
  surface: "#ffffff"
  ink: "#1d2321"
  ink-secondary: "#4a5662"
  navy: "#233651"
  slate: "#4d6a88"
  sand: "#cdb89c"
  divider: "#dde2e7"
  control-border: "#7a8794"
  selected: "#e7edf4"
  band: "#262b25"
  band-text: "#eef1ec"
  band-text-secondary: "#b8c2b4"
  band-border: "#8e9a8a"
  good-on-band: "#8fd1a6"
  mixed-on-band: "#e5c07b"
  concern-on-band: "#f2a6a1"
  good: "#1f6a44"
  mixed: "#7a5310"
  concern: "#9e2f2d"
  concern-text: "#8e2a28"
  concern-tint: "#fbedec"
  mixed-text: "#6e4a0e"
  mixed-tint: "#fbf3e4"
  sky-clear-top: "#5e95cc"
  sky-clear-bottom: "#d3e6f5"
  sky-clear-ink: "#0e1e36"
  sky-cloudy-top: "#8c9dad"
  sky-cloudy-bottom: "#dde4ea"
  sky-cloudy-ink: "#121b26"
  sky-rain-top: "#44546a"
  sky-rain-bottom: "#56677a"
  sky-rain-ink: "#ffffff"
  sky-snow-top: "#bfcddb"
  sky-snow-bottom: "#f0f4f8"
  sky-snow-ink: "#14202e"
  sky-storm-top: "#252b37"
  sky-storm-bottom: "#4c5666"
  sky-storm-ink: "#ffffff"
  sky-fog-top: "#aeb5b9"
  sky-fog-bottom: "#e4e7e8"
  sky-fog-ink: "#151b20"
  sky-night-clear-top: "#0c1830"
  sky-night-clear-bottom: "#294266"
  sky-night-clear-ink: "#ffffff"
  sky-night-cloudy-top: "#1c2530"
  sky-night-cloudy-bottom: "#3a4754"
  sky-night-cloudy-ink: "#ffffff"
  sky-unknown-top: "#7f8c99"
  sky-unknown-bottom: "#d6dde3"
  sky-unknown-ink: "#111a24"
typography:
  display-temperature:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(5rem, 2.5rem + 11vw, 10rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.01em"
  display-place:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(3.25rem, 1.8rem + 7vw, 6.5rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0.005em"
  headline:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(3.25rem, 1.6rem + 7vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  headline-band:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(2.5rem, 1.6rem + 3.5vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  verdict:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(2.25rem, 1.5rem + 3vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  button:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  control: "4px"
  radius: "6px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  space-8: "72px"
  content-max: "1180px"
  target-min: "44px"
components:
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  pill-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
  pill-on-band:
    backgroundColor: "transparent"
    textColor: "{colors.band-text}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  pill-on-band-selected:
    backgroundColor: "{colors.band-text}"
    textColor: "{colors.band}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  hour-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "12px"
    width: "8.75rem"
  hour-tile-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
  notice-concern:
    backgroundColor: "{colors.concern-tint}"
    textColor: "{colors.concern-text}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  notice-mixed:
    backgroundColor: "{colors.mixed-tint}"
    textColor: "{colors.mixed-text}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  planning-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-text}"
    padding: "clamp(32px, 5vw, 48px) 0"
---

# Design System: Outside?

## Overview

**Creative North Star: "The Scoreboard Against the Sky"**

The answer is a scoreboard set against the sky. The place and the current temperature stand in huge condensed capitals over a full-bleed band whose colours are today's weather: blue for a clear day, grey for cloud, slate with fine diagonal streaks for rain, near-black for a storm, deep navy at night. Under the sky, the next-hour verdict uses the same display capitals and gives two plain reasons. This rejects the category default, a small icon-and-number weather card. The weather is the hero, and the tool works as a tool from the first viewport down. The look follows the owner-pinned Dutchblue reference (2026-11-12) and replaces the earlier calm green editorial world.

Two typefaces split the work. Bebas Neue capitals carry every display line: the wordmark, the place, the temperature, the verdict, section titles, and the times in the window rows and hourly tiles. The system sans carries everything people read: reasons, measurements, labels and controls. The ground is cool and pale with white surfaces and charcoal ink. Navy marks selection and action, slate is the secondary ink, and warm sand appears only as hairline detail. One full-bleed charcoal-olive band holds the planning section. Choices are pills that fill with navy when selected. Actions are thin outlined ghost buttons. Status is shown by drawn SVG marks next to words.

The page is dense but calm. Dividers and two full-bleed bands do the structuring, so there are no nested cards and no elevation shadows. Motion is limited to one event: when the conditions change, the sky moves to its new colours.

**Key Characteristics:**
- A weather-aware CSS sky behind the place and temperature: nine skies, each a two-stop gradient plus a veil layer drawn for that weather.
- Bebas Neue for display only, self-hosted and preloaded. All reading text uses the system sans.
- Pills for choices, ghost buttons for actions, and the navy fill means "chosen".
- One charcoal-olive planning band with sand hairlines between scoreboard rows.
- Drawn status marks and words together, never colour alone. Every token pair is contrast-tested.

## Colors

The palette is a cool pale day: grey-white ground, charcoal ink and navy action, with a warm sand thread and a dark olive band for planning. The sky colours change with the weather, but each sky's ink is fixed.

### Primary
- **Harbour Navy** (`navy`): the one action and selection colour. It fills selected pills and the primary button, draws ghost-button outlines and their text, sets links, focus rings, `::selection`, `accent-color` and `caret-color`, and marks the selected hourly tile.

### Secondary
- **Weathered Slate** (`slate`): secondary accent ink for the uppercase context lines: the "Next hour, from …" line under the verdict and the location kind ("Saved location", "Approximate location").
- **Dune Sand** (`sand`): hairline detail only. It rules the top of the window list and, mixed at 55% toward transparent, the lines between window rows. It is also the focus outline and the outer ring of a selected pill on the band. It is never used for text on light ground.

### Tertiary
- **Charcoal Olive** (`band`) with **Band Chalk** (`band-text`), **Band Sage** (`band-text-secondary`) and **Band Rule** (`band-border`): the full-bleed planning band, its text, its secondary text (rank labels and hints), and its unselected pill outlines.
- **On-band status** (`good-on-band`, `mixed-on-band`, `concern-on-band`): lightened status inks that stay legible on the band.

### Neutral
- **Cool Paper** (`ground`): page background.
- **White** (`surface`): field, tile and selected-hour detail surfaces.
- **Charcoal Ink** (`ink`): primary text. It is also the hover fill of the primary button and the 2px rule above Preferences and above table headers.
- **Graphite** (`ink-secondary`): hints, metric labels, the footer and placeholders.
- **Mist Rule** (`divider`): decorative 1px dividers (under the header, around the overview, in the footer and in tables). It is never the only boundary of a control.
- **Control Steel** (`control-border`): the boundary of every control (pills, fields, hourly tiles), at ≥3:1 against both surface and ground.
- **Selected Wash** (`selected`): the background of the selected or hovered hourly tile.

### Status (light surfaces)
- **Good** (`good`), **Mixed** (`mixed`), **Concern** (`concern`): the colours of the drawn marks and hour-match labels.
- **Notice fields**: `concern-text` on `concern-tint`, and `mixed-text` on `mixed-tint`.

### Skies
There are nine skies (clear, cloudy, rain, snow, storm, fog, night-clear, night-cloudy, unknown). Each one is a top stop, a bottom stop, an ink, and a veil token pair (`--sky-*-veil` colour and `--sky-*-veil-strength`, the maximum opacity). The veil paints that sky's weather layer: low glow for clear, puffs for cloudy, a darkening floor and 105° streaks for rain, a bright snow floor, heavy dark cells for storm, banded mist for fog, and a dark zenith at night. The sky is chosen from the weather code and whether it is daytime (`src/domain/sky.ts`). It is decorative, because every fact it reflects is also stated in text.

### Named Rules
**The Tested Pair Rule.** Every text-on-background pair in the tokens is verified by `tests/unit/contrast.test.ts`. That covers each sky's ink against both of its gradient stops, both with no veil and fully veiled, plus the band text and the on-band status colours. A new colour pair needs a test before it ships.

**The Navy Means Chosen Rule.** Navy fill is reserved for "this is selected" and "this is the primary action". Do not use it for decoration.

**The Sand Is Thread Rule.** Sand is a hairline and a ring. It is never a fill, and it is text only on the dark band.

## Typography

**Display Font:** Bebas Neue (fallbacks: Arial Narrow, Roboto Condensed, sans-serif). It is licensed under SIL OFL and self-hosted through `@fontsource/bebas-neue`. Only the latin 400 woff2 (13.8 KB) is loaded, and it is preloaded in the shell. No font CDN is used.
**Body Font:** the system sans (system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif). Tabular numerals are on across the whole page.

**Character:** The condensed capitals are the loud voice: tall and narrow, like a scoreboard. The neutral system sans is the quiet voice for reading, so every measurement and reason stays easy to scan.

### Hierarchy
- **Display, temperature** (400, `clamp(5rem, 2.5rem + 11vw, 10rem)`, line-height 0.82): the current temperature in the sky readout. This shipped value replaces the contract's "about 5–9 rem".
- **Display, place** (400, `clamp(3.25rem, 1.8rem + 7vw, 6.5rem)`, 0.88): the city in the readout heading. The region follows in the sans at 0.875rem/700, uppercase with 0.12em tracking, so the country disambiguation is never cropped.
- **Headline** (400, `clamp(3.25rem, 1.6rem + 7vw, 6rem)`, 0.92): the page h1 before a place is chosen, and the supporting-page h1.
- **Headline, band** (400, `clamp(2.5rem, 1.6rem + 3.5vw, 4.25rem)`, 0.92): "Best times in the next 24 hours".
- **Verdict** (400, `clamp(2.25rem, 1.5rem + 3vw, 3.5rem)`, 0.95): the next-hour verdict, with its drawn mark at 0.6em.
- **Window time** (400, 2.25rem, 0.95; the best row uses `clamp(3rem, 2rem + 4vw, 4.5rem)`): the scoreboard times on the band.
- **Title** (400, 2rem, 1, 0.02em): "Now", "Next 24 hours" and supporting-page h2s. Smaller display steps are used for the Preferences summary and the hour-detail heading (1.75rem), preference subheads and hour times (1.5rem), and the wordmark (1.875rem).
- **Body** (sans 400, 1rem, 1.5): reasons, prose (68ch max), and notices at 0.9375rem. Metric values are sans 600 at 1.25rem.
- **Label** (sans 700, 0.75rem, 0.08–0.1em, uppercase): legends, metric terms, hour dates, window rank and table headers. Buttons use sans 600, 0.8125rem, 0.08em and uppercase. Header navigation uses sans 600, 0.875rem, 0.06em and uppercase.

### Named Rules
**The Two Voices Rule.** Bebas Neue is only for display lines, at weight 400. Sentences, numbers inside reasons, and control text always use the system sans.

**The Label Follows Rule.** Uppercase sans labels name a field, a term or a group (legend, `dt`, a rank under a time). They never sit above a heading as an invented tagline.

## Layout

The column is centred at a 1180px maximum, with side padding of `clamp(16px, 4vw, 32px)`. The sky readout and the planning band paint full-bleed beyond the column through `border-image` ink overflow, and the body uses `overflow-x: clip`. This means they never create horizontal scroll. Spacing uses a 4/8/12/16/24/32/48/72 px scale.

**Page order and hierarchy (as built)**
1. Slim header: the Outside? wordmark, then "How it works" and "About".
2. Location row: the chosen place (a device location reads "Current area"; a slate tag reads "Saved location" or "Approximate location") with a Change location action, or the search and geolocation panel. Opposite it are the Units pills (°C / °F) with a visible "Units" legend.
3. The h1 "How's it outside?" is visible before a place is chosen. Once a place is chosen, the h1 is visually hidden but stays available to assistive tech.
4. Sky readout (h2, the focus target after a place is chosen): city and region on the left; temperature, condition and feels-like on the right (stacked below 720px).
5. Data status: concerning-weather and stale-data notices appear before any positive summary.
6. Overview: the next-hour verdict with two reasons and a comparison line, then the activity pills (Outdoors, Walk, Run, Bike, Hang out). The Now panel holds only wind, gusts, humidity and the "Conditions as of" timestamp.
7. Planning band: heading, duration pills and Daylight only, then the best window and up to two alternatives as scoreboard rows.
8. Next 24 hours: the hourly strip across the full width, with the selected-hour detail below.
9. The "Preferences and saved data" disclosure.
10. Footer: How it works, Privacy, About, Source (only when configured), Open-Meteo/GeoNames attribution, and the author.

**Responsive (as built):** At 720px and up, the readout splits into place and temperature (right-aligned). At 760px and up, window rows use a subgrid: the time column is max-content and reasons take the rest. At 900px and up, the overview becomes a 3fr/2fr grid with the verdict and activity on the left and Now on the right behind a 1px divider; reading order is unchanged. Below these sizes everything is one column, pills wrap, and the first viewport on a phone reaches the verdict. Targets are 360×800, 390×844, 768×1024 and 1440×900, with reflow checked at 320px. Long place names wrap (`overflow-wrap: anywhere`) and are never truncated.

**Budgets as measured:** initial JS 95.8 KB of a 100 KB gzip budget; CSS about 5 KB; LCP 536–552 ms in the lab configuration.

## Elevation & Depth

The system is flat. Depth comes from the two full-bleed bands (the sky and the charcoal-olive planning band) against the pale ground, plus white surfaces and dividers. No surface has an ambient or elevation shadow. `box-shadow` appears only as a state mark: an inset 4px navy bar under the selected hourly tile, and a band-coloured gap plus a 3px sand ring around the selected pill on the band.

### Named Rules
**The Bands Not Boxes Rule.** Separate regions with a full-bleed band, a divider or a white field. Do not lift them with shadows or nest them as cards.

## Shapes

Three radii are used: 4px for buttons and fields, 6px for hourly tiles, notices, the hour-detail field and skeleton bars, and a full pill (999px) for choice controls only. Control borders are 1.5px (pills, buttons, tiles) or 1px (fields). A selected tile gets a 2px border. Drawn marks share one 1.5px stroke on an 18px grid: a filled disc with a check (good), a half-filled disc (mixed), a ring with a bar (poor), a dashed ring with a dot (limited), and a triangle with an exclamation mark (check). The Preferences disclosure uses a drawn plus that rotates 45° when open.

## Components

### Buttons
Thin and exact, like a ticket stub.
- **Shape:** gently squared (4px), 1.5px outline in `currentColor`, minimum height 44px, horizontal padding 16px, uppercase sans label.
- **Ghost (default):** navy outline and text on transparent. On hover it fills navy with white text.
- **Primary:** navy fill with white text, used for the one primary action in a group (for example, search submit). On hover it fills charcoal.
- **Focus:** a 3px navy outline at a 2px offset. Inside the sky the outline uses the sky's ink, and on the band it uses sand.
- **Disabled:** graphite text at 0.75 opacity with a not-allowed cursor.

### Chips (pills)
- **Style:** native radios inside a fieldset with a legend, drawn as 44px pills with a 1.5px steel border on white and sans 600 text.
- **State:** checked pills fill navy with white text. On hover (pointer devices only) the border turns navy. Focus draws a 3px navy ring.
- **Units:** compact °C / °F pills (minimum 44px wide) with a visible "Units" legend. Assistive tech hears the full "°C, km/h, mm" and "°F, mph, in".
- **On the band:** transparent pills with band-rule outlines. When chosen they fill chalk with olive text inside a sand ring.

### Inputs / Fields
- **Style:** white field, 1px steel border, 4px radius, height 44px or more. Selects draw their own chevron in ink. Number fields are 8rem wide.
- **Focus:** the shared 3px navy outline.
- **Error:** concern-text message below the field.

### Navigation
Header links use uppercase sans 600 at 0.875rem in ink and turn navy with an underline on hover. Footer links are underlined in navy. Every link has a 44px minimum height. The wordmark is Bebas Neue at 1.875rem.

### Sky Readout (signature)
The readout heading holds the place, and the temperature and condition sit beside it, over the current sky. The sky's registered colours (`@property --sky-top` / `--sky-bottom`) transition over 1200ms on the shared ease-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`), and the ink follows over 600ms. The weather layer is painted full-bleed from the per-sky veil colour, capped at its strength. Reduced motion turns every transition off. In forced colours, the sky drops its gradient and layers and uses Canvas/CanvasText.

### Planning Band and Scoreboard Rows
Best windows are rows, not cards. Each row shows a display time, the rank as a sans label under it, a drawn mark with a match word in the on-band status colour, then the reasons. A sand hairline runs above the list and 55% sand lines separate the rows. The best row's time is larger. In forced colours the band falls back to Canvas/CanvasText.

### Hourly Timeline
A strip of white 8.75rem tiles that scrolls horizontally, with a 2.5rem fade at the trailing edge as the overflow cue (removed in forced colours). Each tile shows the date label, the time in display type, the drawn mark with the match word, and then feels-like, precipitation and wind. The selected tile has a 2px navy border, the Selected Wash and an inset navy underbar. The detail below sits on a white 6px field.

### Notices
A tinted field with a 1px `currentColor` hairline, a 6px radius, and a drawn 18px mark (a triangle for concern, a circle with an exclamation for mixed), with 0.9375rem text. Buttons inside a notice inherit its ink.

## Do's and Don'ts

### Do:
- **Do** use Bebas Neue at weight 400 for display lines only, and the system sans for all reading text.
- **Do** keep the temperature at `clamp(5rem, 2.5rem + 11vw, 10rem)` and the place at `clamp(3.25rem, 1.8rem + 7vw, 6.5rem)` in the readout.
- **Do** add any new sky as a top stop, bottom stop, veil colour, veil strength and ink in tokens.css, and extend `tests/unit/contrast.test.ts` so the ink is checked against both stops, with no veil and fully veiled.
- **Do** use navy fill only for the selected state and the single primary action.
- **Do** pair every status colour with a drawn SVG mark and a word.
- **Do** keep every control at least 44×44px and give it a steel (≥3:1) boundary.
- **Do** turn off transitions under `prefers-reduced-motion` and fall back to Canvas/CanvasText in forced colours.

### Don't:
- **Don't** use gradients outside the sky (the timeline's edge-fade mask is an overflow cue, not decoration).
- **Don't** animate the sky continuously. It moves only when the conditions change.
- **Don't** add elevation shadows or nested cards. Use bands, dividers and white fields.
- **Don't** use Unicode glyphs or icon fonts for status, or a thick side stripe for notices.
- **Don't** use sand as text on light ground, or the divider as the only edge of a control.
- **Don't** request fonts or icons from a CDN.
- **Don't** put uppercase labels above headings as kickers or eyebrows.

## Product and interaction contracts

These are the product's interaction, content and accessibility contracts. Tests and other docs depend on them, and they continue from the previous version of this document, updated where the build changed them.

### Interaction contracts
Location: visible input label "Search city or place." Use a debounced accessible combobox/listbox only if it is implemented correctly; otherwise a normal search form plus semantic result buttons is acceptable. It supports arrow keys, Enter and Escape, shows a visible selected option and announces a polite result count. Do not move focus on every response. On selection, return focus deliberately to the location control or to the sky readout heading (`#weather-heading`), never to the document body. Once a place is chosen, the h1 is visually hidden. The place and the current temperature are in the sky readout heading area.

Units: compact °C/°F radio pills with a visible "Units" legend. Assistive tech gets the full names "°C, km/h, mm" and "°F, mph, in".

Geolocation: permission is requested only from the button. Copy before the click: "Uses your approximate location to load weather." Round coordinates before sending. There is no reverse geocoding in v1, so a GPS selection is labelled "Current area", never an invented city. Show the timezone below when relevant. Failures appear inline with Retry, and search stays available.

Activities: native radio inputs styled as pills, which wrap on narrow screens. Do not misuse tabs when there is no tabpanel. The selected state has a visible label and checked semantics. Switching keeps focus and briefly announces the updated summary.

Now: shows only wind, gusts, humidity and the "Conditions as of" timestamp. The temperature, condition and feels-like are in the sky readout. Keep Now clearly separate from the next-hour recommendation.

Best windows: scoreboard rows on the charcoal band (best window plus up to two alternatives), not cards. Each row gives the time range, the rank, a drawn mark with the match word, and the reasons.

Timeline: a horizontally scrollable single-select group of hourly items with a visible overflow cue. The group is one Tab stop: use native radio inputs or a roving-tabindex `role="radiogroup"`. Left/Right arrows move between hours, Home/End jump to the first and last hour, and the focused item scrolls into view. Keyboard users must not need 24 Tab presses to pass the timeline. Each item names the local time/date, match, temperature, precipitation chance and wind. Selecting an item shows its detail below; no information is hover-only. Provide a compact accessible list/table alternative, or make sure the visible list itself exposes all values. SVG charts are optional and cannot be the only representation.

Status: drawn SVG marks with words, not Unicode glyphs. Notices use a tinted field, a hairline border and a drawn mark, not a thick side stripe.

Preferences: an inline disclosure, not a mandatory modal. Label every field, explain the feels-like range, and keep a reset button for each activity. Changes apply once the entry is valid, with no Save needed. Unit conversion preserves values. A storage note explains that settings and location are remembered separately. "Remember this location" is unchecked by default, and preferences may persist without the location.

### Content examples (illustrative, never hardcode as weather)
Good: "Good match for a walk" / "Within your preferred temperature range. Light wind in the forecast." Mixed: "A little windy for cycling" only when wind is the largest penalty. Poor: "Poor match for your preferences" plus the measured reason. Missing: "Some forecast details are unavailable. You can still review the available weather." Stale: "Showing an earlier forecast retrieved at [time]. Suggestions are paused until it refreshes." Empty daylight: "No matching daylight window in the next 24 hours. Try another duration or include nighttime."

If every window is excluded by flags: "No suggested window with the current forecast. Review the conditions below." Never encourage overriding warning flags. Generic failure: "Weather couldn't load. Try again or choose another location." Offline: "You're offline. Previously loaded weather may be out of date."

### Accessibility requirements
Target WCAG 2.2 AA, but do not claim certification from an automated scan. Use semantic landmarks and one h1 (visually hidden once a place is chosen), a skip link, and visible focus contrast. Targets are at least 44×44px where practical and never below the AA minimum without allowed spacing. Colour contrast is at least 4.5:1 for normal text and 3:1 for large text and UI boundaries where required, and every token pair is verified by `tests/unit/contrast.test.ts`. No motion is essential to meaning, and prefers-reduced-motion is honoured (the sky transition is turned off). Test 200% and 400% zoom, a 320px viewport, high contrast/forced colours (the sky and band fall back to Canvas/CanvasText), keyboard and screen reader. E2E runs axe in Chromium, Firefox and WebKit.

Loading skeletons are aria-hidden, and there is one polite status region. Errors that need immediate action use appropriate alerts without announcing every hourly tile. Do not steal focus during auto-refresh. If the selected timeline hour expires, choose the nearest available hour and announce it once. Preserve visible focus after disclosure controls.

### Responsive and performance checks
Targets are 360×800, 390×844, 768×1024 and 1440×900; also check reflow at 320px. Long place names and translated or native names must wrap without truncating the country disambiguation. Load no icons or fonts from a remote CDN: Bebas Neue is self-hosted and preloaded, and the marks are local SVG with accessible text. Use no animated weather background loop, no infinite animation and no map dependency. The sky only transitions when the conditions change. Budgets: initial JS ≤100 KB gzip (measured 95.8 KB), CSS about 5 KB, LCP 536–552 ms in the lab configuration. The opt-in screenshot spec `tests/e2e/screenshots.spec.ts` (set `SCREENSHOT_DIR`) captures the standard viewports plus one capture per sky.

### Supporting pages
About: purpose, author link, source and scope. Methodology ("How it works"): inputs, preset table, preference heuristic, hourly approximation, limitations, flags and data attribution. Privacy: data flow, permissions, storage and clear controls, and hosting/provider visibility. Supporting pages share the shell and use the prose measure (44rem column, 68ch lines, Bebas Neue h1/h2, tables with uppercase sans headers above a 2px ink rule). Static supporting pages stay readable without JS. The public Source link uses the real configured repository URL only.
