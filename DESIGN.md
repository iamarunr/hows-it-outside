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
  display-hero:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(4.75rem, 1.5rem + 15vw, 14rem)"
    fontWeight: 400
    lineHeight: 0.84
    letterSpacing: "0.005em"
  display-temperature:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(6rem, 2.5rem + 16vw, 14rem)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.01em"
  display-place:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(3.75rem, 1.5rem + 9vw, 8.5rem)"
    fontWeight: 400
    lineHeight: 0.86
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
  display-number:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(2.25rem, 1.7rem + 2vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  display-hour:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 0.9
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
  display-window-best:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "clamp(3rem, 2rem + 4vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.02em"
  wordmark:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  display-subhead:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  display-minor:
    fontFamily: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  lede:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.4vw, 1.3125rem)"
    fontWeight: 500
    lineHeight: 1.45
  body-large:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  metric-value:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
  body-compact:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
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
  pill-on-sky:
    backgroundColor: "transparent"
    textColor: "{colors.sky-clear-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  pill-on-sky-selected:
    backgroundColor: "{colors.sky-clear-ink}"
    textColor: "{colors.sky-clear-bottom}"
  pill-on-sky-selected-white-ink:
    backgroundColor: "{colors.sky-rain-ink}"
    textColor: "{colors.sky-rain-top}"
  button-primary-hero-search:
    backgroundColor: "{colors.sky-clear-ink}"
    textColor: "{colors.sky-clear-bottom}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "56px"
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
  input-field-hero-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "56px"
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
  notice-on-sky:
    backgroundColor: "transparent"
    textColor: "{colors.sky-clear-ink}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
  planning-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-text}"
    padding: "clamp(48px, 7vw, 6rem) 0"
---

# Design System: Outside?

## Overview

**Creative North Star: "The Scoreboard Against the Sky"**

The answer is a scoreboard set against the sky. The whole first screen below the slim header is a full-bleed sky whose colours are today's weather: blue for a clear day, grey for cloud, slate with falling streaks for rain, near-black for a storm, deep navy with stars at night. The place and the current temperature stand on it in huge condensed capitals, and the next-hour verdict follows on the same sky in the same display capitals with two plain reasons. Before a place is chosen, the sky is the visitor's own day or night and carries the question "How's it outside?" at full scale, with the search set into it. This rejects the category default, a small icon-and-number weather card. The weather is the hero, and the tool works as a tool from the first viewport down. The look follows the owner-pinned Dutchblue reference (2026-11-12) and replaces the earlier calm green editorial world. The bolder pass of 2026-11-12 follows three owner answers: "Both screens" should stop feeling blank, "Sky fills first screen", and "Slow ambient motion".

Two typefaces split the work. Bebas Neue capitals carry every display line: the wordmark, the empty-state headline, the place, the temperature, the verdict, section titles, the Now numbers, and the times and temperatures in the window rows and hourly tiles. The system sans carries everything people read: the lede, reasons, measurements, labels and controls. Below the sky the ground is cool and pale with white surfaces and charcoal ink. Navy marks selection and action there, slate is the secondary ink, and warm sand appears only as hairline detail. On the sky, every control takes that sky's ink instead. One full-bleed charcoal-olive band holds the planning section. Choices are pills that fill when selected. Actions are thin outlined ghost buttons. Status is shown by drawn SVG marks next to words.

Below the sky the page is dense but calm. Dividers and two full-bleed bands do the structuring, so there are no nested cards and no elevation shadows. The sky moves in two ways: its colours transition when the conditions change, and a slow ambient layer (cloud drift, rain, snow, star twinkle) runs in CSS for visitors who have not asked for reduced motion. The motion never carries meaning.

**Key Characteristics:**
- A weather-aware CSS sky that fills the first screen: eleven skies, each a two-stop gradient, a veil layer drawn for that weather, and an optional slow ambient layer.
- Bebas Neue for display only, self-hosted and preloaded. All reading text uses the system sans.
- Pills for choices, ghost buttons for actions, and a fill means "chosen": navy on the ground, the sky's ink on the sky, chalk on the band.
- One charcoal-olive planning band with sand hairlines between scoreboard rows.
- Drawn status marks and words together, never colour alone. Every token pair is contrast-tested.

## Colors

The palette is a cool pale day: grey-white ground, charcoal ink and navy action, with a warm sand thread and a dark olive band for planning. The sky colours change with the weather, but each sky's ink is fixed.

### Primary
- **Harbour Navy** (`navy`): the one action and selection colour off the sky. It fills selected pills and the primary button, draws ghost-button outlines and their text, sets links, focus rings, `::selection`, `accent-color` and `caret-color`, and marks the selected hourly tile. It is also the browser `theme-color` and the ground of the favicon.

### Secondary
- **Weathered Slate** (`slate`): secondary accent ink for the uppercase context lines off the sky. On the sky, the "Next hour, from …" line and the location kind ("Saved location", "Approximate location") inherit the sky's ink.
- **Dune Sand** (`sand`): hairline detail only. It rules the top of the window list and, mixed at 55% toward transparent, the lines between window rows. It is also the focus outline and the outer ring of a selected pill on the band, and the horizon line in the favicon. It is never used for text on light ground.

### Tertiary
- **Charcoal Olive** (`band`) with **Band Chalk** (`band-text`), **Band Sage** (`band-text-secondary`) and **Band Rule** (`band-border`): the full-bleed planning band, its text, its secondary text (rank labels and hints), and its unselected pill outlines.
- **On-band status** (`good-on-band`, `mixed-on-band`, `concern-on-band`): lightened status inks that stay legible on the band.

### Neutral
- **Cool Paper** (`ground`): page background.
- **White** (`surface`): field, tile and selected-hour detail surfaces. Search fields keep their white fill on the sky.
- **Charcoal Ink** (`ink`): primary text. It is also the hover fill of the primary button and the 2px rule above Preferences and above table headers.
- **Graphite** (`ink-secondary`): hints, metric labels, the "feels like" label in hourly tiles, the footer and placeholders.
- **Mist Rule** (`divider`): decorative 1px dividers (under the header, under the Now strip, in the footer and in tables). It is never the only boundary of a control.
- **Control Steel** (`control-border`): the boundary of every control off the sky (pills, fields, hourly tiles), at ≥3:1 against both surface and ground.
- **Selected Wash** (`selected`): the background of the selected or hovered hourly tile.

### Status (light surfaces)
- **Good** (`good`), **Mixed** (`mixed`), **Concern** (`concern`): the colours of the drawn marks and hour-match labels off the sky. On the sky, the verdict's mark is drawn in the sky's ink; its shape and word carry the meaning.
- **Notice fields**: `concern-text` on `concern-tint`, and `mixed-text` on `mixed-tint`. On the sky, notices drop the tint (see Components).

### Skies
There are eleven skies (clear, cloudy, rain, snow, storm, fog, night-clear, night-cloudy, dawn, dusk, unknown). Each one is a top stop, a bottom stop, an ink, and a veil token pair (`--sky-*-veil` colour and `--sky-*-veil-strength`, the maximum opacity). The veil paints that sky's static weather layer: low glow for clear, cloud banks for cloudy, night-cloudy, storm and unknown, a darkening floor for rain, a bright snow floor, banded mist for fog, and a dark zenith at night. A second, particle layer draws rain and storm streaks in the sky's ink at 22%, white snowflakes, and white stars. The sky is chosen from the weather code, whether it is daytime, and whether the sun is low (`src/domain/sky.ts`): a clear sky within 50 minutes of sunrise is dawn (pale blue to peach, dark ink) and within 50 minutes of sunset is dusk (indigo to burnt coral, white ink). Before a place is chosen, the empty-state sky is clear, dawn, dusk or night-clear from the visitor's own clock (daylight assumed 06:00 to 18:00; clear before hydration). The sky is decorative, because every fact it reflects is also stated in text.

Each sky also defines two derived roles for controls set on it. `--ink` is that sky's ink. `--on-ink`, the label colour on an ink fill, is the sky's bottom stop on dark-ink skies and its top stop on white-ink skies (rain, storm, dusk, night-clear, night-cloudy). `--match-knock`, the knock-out tick inside the good mark, is the sky's top stop on the sky and white elsewhere.

### Named Rules
**The Tested Pair Rule.** Every text-on-background pair in the tokens is verified by `tests/unit/contrast.test.ts`. That covers each sky's ink against both of its gradient stops, both with no veil and fully veiled, plus the band text and the on-band status colours. A new colour pair needs a test before it ships.

**The Ink Means Chosen Rule.** A filled control means "this is selected" or "this is the primary action". Off the sky the fill is navy with a white label; on the sky it is the sky's ink with the `--on-ink` label; on the band it is chalk with an olive label. Do not use a fill for decoration.

**The Sand Is Thread Rule.** Sand is a hairline and a ring. It is never a fill, and it is text only on the dark band.

## Typography

**Display Font:** Bebas Neue (fallbacks: Arial Narrow, Roboto Condensed, sans-serif). It is licensed under SIL OFL and self-hosted through `@fontsource/bebas-neue`. Only the latin 400 woff2 (13.8 KB) is loaded, and it is preloaded in the shell. No font CDN is used.
**Body Font:** the system sans (system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif). Tabular numerals are on across the whole page.

**Character:** The condensed capitals are the loud voice: tall and narrow, like a scoreboard. The neutral system sans is the quiet voice for reading, so every measurement and reason stays easy to scan.

### Hierarchy
- **Display, hero** (400, `clamp(4.75rem, 1.5rem + 15vw, 14rem)`, line-height 0.84): "How's it / outside?" in two lines on the empty-state sky. It is the page h1 before a place is chosen.
- **Display, temperature** (400, `clamp(6rem, 2.5rem + 16vw, 14rem)`, 0.8): the current temperature in the sky readout. This supersedes the earlier 10rem cap, at the owner's request for a "wow factor".
- **Display, place** (400, `clamp(3.75rem, 1.5rem + 9vw, 8.5rem)`, 0.86): the city in the readout heading. The region follows in the sans at 0.875rem/700, uppercase with 0.12em tracking, so the country disambiguation is never cropped. The condition line beside the temperature is sans 600 at 1.125rem, with feels-like at 400.
- **Headline** (400, `clamp(3.25rem, 1.6rem + 7vw, 6rem)`, 0.92): the no-JS h1 on the home page and the supporting-page h1.
- **Headline, band** (400, `clamp(2.5rem, 1.6rem + 3.5vw, 4.25rem)`, 0.92): the section headings below the sky: "Now", "Best times in the next 24 hours" and "Next 24 hours".
- **Display, number** (400, `clamp(2.25rem, 1.7rem + 2vw, 3.25rem)`, 1, nowrap): the wind, gusts and humidity values in the Now strip.
- **Verdict** (400, `clamp(2.25rem, 1.5rem + 3vw, 3.5rem)`, 0.95): the next-hour verdict, with its drawn mark at 0.6em.
- **Window time** (400, 2.25rem, 0.95; the best row uses `clamp(3rem, 2rem + 4vw, 4.5rem)`): the scoreboard times on the band.
- **Display, hour** (400, 2.5rem, 0.9): the feels-like temperature in each hourly tile, with an uppercase sans "feels like" label (0.75rem/600, 0.04em) below it.
- **Title** (400, 2rem, 1, 0.02em): supporting-page h2s. Smaller display steps are used for the Preferences summary and the hour-detail heading (1.75rem), preference subheads and hour times (1.5rem), and the wordmark (1.875rem).
- **Lede** (sans 500, `clamp(1.0625rem, 1rem + 0.4vw, 1.3125rem)`, 1.45, 34rem max): the one-line promise under the empty-state headline.
- **Body** (sans 400, 1rem, 1.5): reasons, prose (68ch max), and notices at 0.9375rem. Metric values below the hero (hour detail) are sans 600 at 1.25rem.
- **Label** (sans 700, 0.75rem, 0.08–0.1em, uppercase): legends, metric terms, hour dates, window rank and table headers. Buttons use sans 600, 0.8125rem, 0.08em and uppercase. Header navigation uses sans 600, 0.875rem, 0.06em and uppercase.

### Named Rules
**The Two Voices Rule.** Bebas Neue is only for display lines, at weight 400. Sentences, numbers inside reasons, and control text always use the system sans.

**The Label Follows Rule.** Uppercase sans labels name a field, a term or a group (legend, `dt`, a rank under a time, "feels like" under a temperature). They never sit above a heading as an invented tagline.

## Layout

The column is centred at a 1180px maximum, with side padding of `clamp(16px, 4vw, 32px)`. The sky hero is full-bleed by sizing: `width: 100vw` with `margin-inline: calc(50% - 50vw)` and `min-height: calc(100svh - 62px)`, so it fills the screen below the slim header and grows when its content needs more. Its contents sit in the same 1180px column. The planning band paints full-bleed beyond the column through `border-image` ink overflow. The body uses `overflow-x: clip`, so neither creates horizontal scroll. Spacing uses a 4/8/12/16/24/32/48/72 px scale.

**Page order and hierarchy (as built)**
1. Slim header: the Outside? wordmark, then "How it works" and "About".
2. Offline and unreadable-settings notices, when present, as tinted notices above the sky.
3. Sky hero, empty state (no place chosen): centred vertically, the display headline (h1), the lede, then Use my location, a 56px search, and the Units pills (°C / °F, visible "Units" legend), stacked on the sky.
4. Sky hero, results state: the toolbar (the chosen place, which reads "Current area" for a device location and carries a "Saved location" or "Approximate location" tag, with Change location; Units opposite), the readout (h2, the focus target after a place is chosen: city and region, temperature, condition and feels-like), data status notices (concerning weather and stale data before any positive summary), a 1px hairline in the sky's ink at 45%, then the next-hour verdict with two reasons and a comparison line, and the activity pills (Outdoors, Walk, Run, Bike, Hang out). The toolbar sits at the top and the verdict at the bottom of the screen. The h1 is visually hidden in this state.
5. Now strip: the "Now" heading beside wind, gusts and humidity as display numbers, with the "Conditions as of" timestamp, above a divider.
6. Planning band (padding `clamp(48px, 7vw, 6rem)`): heading, duration pills and Daylight only, then the best window and up to two alternatives as scoreboard rows.
7. Next 24 hours: the hourly strip across the full width, with the selected-hour detail below.
8. The "Preferences and saved data" disclosure.
9. Footer: How it works, Privacy, About, Source (only when configured), Open-Meteo/GeoNames attribution, and the author.

Without JavaScript, the home page shows its own h1 and a notice inside a no-JS block instead of the island.

**Responsive (as built):** At 720px and up, the readout splits into place and temperature (right-aligned). At 760px and up, the Now strip puts its heading beside the numbers, and window rows use a subgrid: the time column is max-content and reasons take the rest. At 900px and up, the verdict and the activity pills sit side by side on the sky (1.5fr/1fr, bottom-aligned); reading order is unchanged. Below these sizes everything is one column and pills wrap. Targets are 360×800, 390×844, 768×1024 and 1440×900, with reflow checked at 320px. Long place names wrap (`overflow-wrap: anywhere`) and are never truncated.

**Budgets as measured:** initial JS 96.1 KB of a 100 KB gzip budget; CSS about 6.9 KB; lab LCP 596 ms, CLS 0.

## Elevation & Depth

The system is flat. Depth comes from the two full-bleed bands (the sky hero and the charcoal-olive planning band) against the pale ground, plus white surfaces and dividers. Inside the sky, the veil and particle layers sit behind the content as painted weather, not as elevation. No surface has an ambient or elevation shadow. `box-shadow` appears only as a state mark: an inset 4px navy bar under the selected hourly tile, and a band-coloured gap plus a 3px sand ring around the selected pill on the band.

### Named Rules
**The Bands Not Boxes Rule.** Separate regions with a full-bleed band, a hairline, a divider or a white field. On the sky, group with a hairline in the sky's ink, never a panel. Do not lift regions with shadows or nest them as cards.

## Shapes

Three radii are used: 4px for buttons and fields, 6px for hourly tiles, notices, the hour-detail field and skeleton bars, and a full pill (999px) for choice controls only. Control borders are 1.5px (pills, buttons, tiles, notices on the sky) or 1px (fields, notices off the sky). A selected tile gets a 2px border. Drawn marks share one 1.5px stroke on an 18px grid: a filled disc with a knocked-out check (good), a half-filled disc (mixed), a ring with a bar (poor), a dashed ring with a dot (limited), and a triangle with an exclamation mark (check). The Preferences disclosure uses a drawn plus that rotates 45° when open. Cloud banks are built from three overlapping elliptical lobes per cloud at fixed pixel sizes, so clouds keep their shape at every viewport width.

## Components

### Buttons
Thin and exact, like a ticket stub.
- **Shape:** gently squared (4px), 1.5px outline in `currentColor`, minimum height 44px, horizontal padding 16px, uppercase sans label.
- **Ghost (default):** navy outline and text on transparent. On hover it fills navy with white text.
- **Primary:** navy fill with white text, used for the one primary action in a group (for example, search submit). On hover it fills charcoal.
- **On the sky:** ghost buttons are drawn in the sky's ink and fill with ink and the `--on-ink` label on hover. The primary Search is an ink fill with the `--on-ink` label; in the empty state it is 56px tall with 24px side padding.
- **Focus:** a 3px navy outline at a 2px offset. Inside the sky the outline uses the sky's ink, and on the band it uses sand.
- **Disabled:** graphite text at 0.75 opacity with a not-allowed cursor. Search and location controls stay disabled until the island hydrates.

### Chips (pills)
- **Style:** native radios inside a fieldset with a legend, drawn as 44px pills with a 1.5px steel border on white and sans 600 text.
- **State:** checked pills fill navy with white text. On hover (pointer devices only) the border turns navy. Focus draws a 3px navy ring.
- **Units:** compact °C / °F pills (minimum 44px wide) with a visible "Units" legend. Assistive tech hears the full "°C, km/h, mm" and "°F, mph, in".
- **On the sky:** transparent pills with a 1.5px ink outline and ink text. Hover washes them with 12% ink. When chosen they fill ink with the `--on-ink` label.
- **On the band:** transparent pills with band-rule outlines. When chosen they fill chalk with olive text inside a sand ring.

### Inputs / Fields
- **Style:** white field, 1px steel border, 4px radius, height 44px or more. Selects draw their own chevron in ink. Number fields are 8rem wide. On the sky the search field keeps its white fill with a 1px ink border; in the empty state it is 56px tall with 1.125rem text. Search results on the sky are white rows with charcoal text.
- **Focus:** the shared 3px outline (navy, or the sky's ink on the sky).
- **Error:** concern-text message below the field.

### Navigation
Header links use uppercase sans 600 at 0.875rem in ink and turn navy with an underline on hover. Footer links are underlined in navy. Every link has a 44px minimum height. The wordmark is Bebas Neue at 1.875rem.

### Favicon
A chalk sun rising over a sand horizon line and an olive ground, on a navy-to-slate rounded tile (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`). The shell sets `theme-color` to Harbour Navy (#233651).

### Sky Hero (signature)
The first screen is the sky. In the empty state it carries the display headline, the lede and the place controls. In the results state it carries the toolbar, the readout heading with the place, the temperature and condition, the hairline, and the verdict with the activity pills. The sky's registered colours (`@property --sky-top` / `--sky-bottom`) transition over 1200ms on the shared ease-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`), and the ink follows over 600ms.

Two painted layers sit behind the content:
- **Weather layer (static veil):** for cloudy, night-cloudy, storm and unknown, cloud banks on a 1400px tile that repeats horizontally. Clear, rain, snow, fog and night-clear stretch their veil to the hero.
- **Ambient layer (slow motion, CSS only):** cloud banks drift by animating `background-position-x` by -1400px per loop (160s; 75s for storm). Rain and storm streaks (104°, 22% ink) fall 140px every 1.4s. Snow is 9 layers on distinct tiles (173–397px), each falling one tile height every 22s. Stars are 9 layers (197–449px tiles), masked to the top 55%, twinkling in opacity between 0.25 and 0.6 over 7s. Fog and clear are static.

**Landscape strip.** The hero ends in a strip of three layered hills (`--scene-h`, 84–210px in results, 120–280px in the empty state), tinted from the sky's bottom stop toward `--scene-land`. A sun (clear, dawn, dusk, cloudy days) or moon (clear and cloudy nights) rides an arc inside the strip. Its position is `--arc` (0 rise, 0.5 highest, 1 set), computed in `src/domain/sun.ts` from the real sun position for the chosen place, or the visitor's clock before one is chosen, and written through the CSSOM. The strip is a layout box below the hero content: the disc, hills, birds and fog never sit behind text. The sun's halo uses the sky's own veil colour. One hero element serves both states, so choosing a place transitions one sky into the next and the disc glides to its new position over 1800ms.

**Sky moments (CSS only).** Three birds glide over the hills by day (52s). A shooting star crosses a clear night sky every 17s. Storms pulse twice softly every 11s, at most 16% white, which keeps text contrast and stays far below flash limits. Fog rolls slowly over the hills. Where scroll timelines are supported, the two far hills sink as the page scrolls.

**Arrival.** The live temperature block and the verdict rise in over 800ms, and the tick inside the good mark draws itself.

**Shortcut cards.** In the empty state three cards (London, Chennai, Sydney) are nested skies: each is a `.sky` with its own tested ink, showing the city, country and local time under the day, dawn, dusk or night sky there right now, and never weather. They are buttons that load the place. Below 1000px they form a horizontal snap row with the next card peeking; from 1000px they form a loose overlapping deck (rotated -6°, 5°, -2°) that straightens and lifts on hover. They do not float: a click target should hold still.

**Search pill.** On every sky the search field and its button share one white pill ringed in the sky's ink; the focus ring is drawn around the whole pill in ink.

The animations run only under `prefers-reduced-motion: no-preference`, and the global reduced-motion rule also turns every transition off. In forced colours the sky drops its gradient, both layers, the landscape strip and the sky moments and uses Canvas/CanvasText, and controls on it fall back to ButtonFace/ButtonText.

### Planning Band and Scoreboard Rows
Best windows are rows, not cards. Each row shows a display time, the rank as a sans label under it, a drawn mark with a match word in the on-band status colour, then the reasons. A sand hairline runs above the list and 55% sand lines separate the rows. The best row's time is larger. In forced colours the band falls back to Canvas/CanvasText.

### Hourly Timeline
A strip of white 8.75rem tiles that scrolls horizontally, with a 2.5rem fade at the trailing edge as the overflow cue (removed in forced colours). Each tile shows the date label, the time in display type, the drawn mark with the match word, the feels-like temperature at 2.5rem display with its "feels like" label below, and then precipitation and wind. The selected tile has a 2px navy border, the Selected Wash and an inset navy underbar. The detail below sits on a white 6px field.

### Notices
A tinted field with a 1px `currentColor` hairline, a 6px radius, and a drawn 18px mark (a triangle for concern, a circle with an exclamation for mixed), with 0.9375rem text. Buttons inside a notice inherit its ink. On the sky, notices are transparent with a 1.5px ink border, ink text and the drawn mark in ink.

## Do's and Don'ts

### Do:
- **Do** use Bebas Neue at weight 400 for display lines only, and the system sans for all reading text.
- **Do** keep the readout at the `display-temperature` and `display-place` sizes and the empty-state headline at `display-hero`.
- **Do** add any new sky as a top stop, bottom stop, veil colour, veil strength and ink in tokens.css, set its `--on-ink` (the lighter stop under a dark ink, the darker stop under a white ink), and extend `tests/unit/contrast.test.ts` so the ink is checked against both stops, with no veil and fully veiled.
- **Do** draw every control on the sky in the sky's ink; at rest, fill only the chosen pill and the primary action, with the `--on-ink` label.
- **Do** use navy fill off the sky only for the selected state and the single primary action.
- **Do** pair every status colour with a drawn SVG mark and a word.
- **Do** keep every control at least 44×44px and give it a ≥3:1 boundary (steel off the sky, ink on it).
- **Do** keep ambient sky motion slow, CSS only, inside `prefers-reduced-motion: no-preference`, hidden in forced colours, and free of meaning.

### Don't:
- **Don't** use gradients outside the sky (the timeline's edge-fade mask and the star mask are overflow and fade cues, not decoration).
- **Don't** add sky motion beyond the slow ambient set (cloud drift, rain, snow, star twinkle), animate it in JavaScript, or let it signal anything.
- **Don't** add elevation shadows or nested cards. Use bands, hairlines, dividers and white fields.
- **Don't** use Unicode glyphs or icon fonts for status, or a thick side stripe for notices.
- **Don't** use sand as text on light ground, or the divider as the only edge of a control.
- **Don't** request fonts or icons from a CDN.
- **Don't** put uppercase labels above headings as kickers or eyebrows.

## Product and interaction contracts

These are the product's interaction, content and accessibility contracts. Tests and other docs depend on them, and they continue from the previous version of this document, updated where the build changed them.

### Interaction contracts
Location: visible input label "Search city or place." Use a debounced accessible combobox/listbox only if it is implemented correctly; otherwise a normal search form plus semantic result buttons is acceptable. It supports arrow keys, Enter and Escape, shows a visible selected option and announces a polite result count. Do not move focus on every response. On selection, return focus deliberately to the location control or to the sky readout heading (`#weather-heading`), never to the document body. After a visitor picks a place, the page scrolls to the top and focus moves to the place heading with `preventScroll`; a restored saved place moves neither scroll nor focus. Search and location controls stay disabled until hydration, so early input is never lost or natively submitted. Before a place is chosen, the h1 is the empty-state headline on the sky; once a place is chosen, the h1 is visually hidden. Without JavaScript, the home page shows its own h1 in the no-JS block. The place and the current temperature are in the sky readout heading area.

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
Target WCAG 2.2 AA, but do not claim certification from an automated scan. Use semantic landmarks and one h1 (the empty-state headline, visually hidden once a place is chosen), a skip link, and visible focus contrast. Targets are at least 44×44px where practical and never below the AA minimum without allowed spacing. Colour contrast is at least 4.5:1 for normal text and 3:1 for large text and UI boundaries where required, and every token pair is verified by `tests/unit/contrast.test.ts`. No motion is essential to meaning, and prefers-reduced-motion is honoured (the sky transition and the ambient sky motion are turned off). Test 200% and 400% zoom, a 320px viewport, high contrast/forced colours (the sky and band fall back to Canvas/CanvasText, the sky's painted layers are hidden, and controls on the sky use ButtonFace/ButtonText), keyboard and screen reader. E2E runs axe in Chromium, Firefox and WebKit. As measured for the bolder pass: 279 unit tests and 101 E2E tests pass across the three engines, with 0 axe violations, and every sky's ink is contrast-tested against both stops, bare and fully veiled.

Loading skeletons are aria-hidden, and there is one polite status region. Errors that need immediate action use appropriate alerts without announcing every hourly tile. Do not steal focus during auto-refresh. If the selected timeline hour expires, choose the nearest available hour and announce it once. Preserve visible focus after disclosure controls.

### Responsive and performance checks
Targets are 360×800, 390×844, 768×1024 and 1440×900; also check reflow at 320px. Long place names and translated or native names must wrap without truncating the country disambiguation. Load no icons or fonts from a remote CDN: Bebas Neue is self-hosted and preloaded, and the marks are local SVG with accessible text. Use no map dependency. Sky motion is limited to slow ambient sky motion (cloud drift, rain, snow, star twinkle): CSS only, off under prefers-reduced-motion, hidden in forced colours, and never carrying meaning (owner approval, 2026-11-12: "Slow ambient motion"). Otherwise the sky only transitions when the conditions change. Budgets: initial JS ≤100 KB gzip (measured 96.1 KB), CSS about 6.9 KB, lab LCP 596 ms, CLS 0. The opt-in screenshot spec `tests/e2e/screenshots.spec.ts` (set `SCREENSHOT_DIR`) captures the standard viewports plus one capture per sky.

### Supporting pages
About: purpose, author link, source and scope. Methodology ("How it works"): inputs, preset table, preference heuristic, hourly approximation, limitations, flags and data attribution. Privacy: data flow, permissions, storage and clear controls, and hosting/provider visibility. Supporting pages share the shell and use the prose measure (44rem column, 68ch lines, Bebas Neue h1/h2, tables with uppercase sans headers above a 2px ink rule). Static supporting pages stay readable without JS. The public Source link uses the real configured repository URL only.
