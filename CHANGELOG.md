# Changelog

## Unreleased

### Pinned places (12 November 2026)
- "Pin this place" on the results screen pins up to three places. Pinned places replace the London, Chennai and Sydney cards on the first screen and open in one tap, with no search.
- Pins are stored only in this browser, only when you pin, and are removed by unpinning or "Clear all local data". Settings saved before this change load unchanged.
- The menu's solid state now follows a marker at the top of the page instead of scroll events, which Firefox could miss when the page jumped back to the top.
- Fixed: on phones in WebKit the day strip caused sideways scrolling part-way through an hour.

### The ground below the sky (12 November 2026)
- The hills now run into a deep navy ground that carries Now, Best times and the footer (replacing the white Now strip and the charcoal band).
- Now: wind, gusts and humidity are half-dials with the value inside. A missing value shows "Unavailable" with no arc.
- Sunrise and sunset: the next of each, from the forecast provider's daily data, with a countdown ("Sunset 4:06 PM, in 6 h 6 min"). Omitted when the provider has none (polar day or night).
- Best times: a 24-bar strip shows the day at a glance (taller is a better match, the best window is marked), and the best window is a card under the sky expected at that time.
- Next 24 hours: one continuous ribbon. Each hour sits under its own sky (day, dawn, dusk, night, rain and so on), joined by a feels-like temperature line over the chance of precipitation.

### Menu on the sky (12 November 2026)
- The menu no longer sits in a grey bar above the sky. At the top of the home page it is transparent, in the sky's own ink, with the sky running behind it; once you scroll it becomes a solid navy bar that stays at the top.
- Other pages, and the home page without JavaScript, use the solid navy bar.
- The menu animates between its two states only after the page has loaded, so it cannot fade in from navy on arrival.
- Fixed missing spaces before some links on the About, How it works and home pages.

### Named device location (12 November 2026)
- "Use my location" now shows the area's name (for example "St. Louis, Missouri, United States of America") instead of "Current area".
- One request with coordinates rounded to about 1 km goes to BigDataCloud's free reverse geocoding API. Searched and remembered places never use it. If the lookup fails or is slow (2 s), the label stays "Current area".
- Privacy page, security policy (`connect-src`) and third-party notices updated. This supersedes the earlier "no reverse geocoding" decision (ADR-004).

### Living landscape (12 November 2026)
- A strip of layered hills closes the sky, with a sun or moon riding its arc: from the real sun position for a chosen place, and from the visitor's clock before one is chosen.
- Two new skies, dawn and dusk, when the sun is within 50 minutes of the horizon under a clear sky.
- Three shortcut cards (London, Chennai, Sydney) show the local time and day/night sky there and open that place in one tap. They never show weather before it is loaded.
- Search is a single white pill on every sky.
- Choosing a place melts the first-screen sky into that place's sky; the live numbers and verdict rise in and the "good" tick draws itself.
- Rare sky moments: birds by day, a shooting star on clear nights, soft lightning in storms, fog rolling over the hills. Hills shift with scroll where the browser supports scroll timelines.
- All motion is CSS and is off with reduced motion; the sun, moon and hills never sit behind text.
- Tested from 320 px phones to 2560 px screens, including phone landscape, in Chromium, Firefox and WebKit.

### Bolder pass (12 November 2026)
- The first screen is now the sky: a giant "How's it outside?" over a day or night sky before a place is chosen; city, a huge temperature, the verdict and activities on the place's own sky after.
- Slow ambient motion: drifting cloud banks, falling rain and snow, twinkling stars; off with reduced motion.
- Controls, pills and warnings on the sky take the sky's own colours; Now becomes scoreboard numbers; hours lead with large temperatures.
- After choosing a place the page returns to the top of the new sky.

### Redesign (12 November 2026)
- New look after the Dutchblue site reference: place and temperature in self-hosted Bebas Neue capitals over a CSS sky that changes with the weather (clear, cloudy, rain, snow, storm, fog, night).
- Navy pills for choices, thin outlined buttons for actions, a full-bleed charcoal band for best times shown as scoreboard rows, drawn status marks.
- Slimmer header once a place is chosen; compact °C/°F unit pills; no repeated facts between the readout and the Now panel.
- Every text colour on every sky and band is contrast-tested; hover effects limited to devices that hover.

### M5 — Open-source and release preparation (11 November 2026)
- Contributor README, MIT license, third-party notices, contributing and security guides, issue forms and PR template.
- Preview deployments can be marked noindex; hosted builds require a canonical site URL.
- Fixed in cross-browser testing: select height in Safari, forced-colors selection contrast, and a stuck "Finding your location…" in Firefox when the permission prompt is ignored.
- Acceptance results, implemented deployment runbook, lab performance check and portfolio entry draft.

### M4 — Design and resilience (11 November 2026)
- Verified token contrast with automated tests; stronger border for interactive hour buttons.
- Desktop two-column overview; place name shown once on small screens; forced-colors support.
- Offline, storage-blocked and settings-reset notices.
- Methodology, Privacy and expanded About pages; footer navigation and full attribution.
- No-JavaScript explanation on the home page; inert controls hidden.
- Automated axe, reflow, target-size, forced-colors, no-JS, offline and storage journeys.

### M3 — Complete product experience (11 November 2026)
- Activity choice (Outdoors, Walk, Run, Bike, Hang out), units, outing length and daylight-only controls; all recompute locally without refetching.
- Next-hour summary with concerning-weather notices first, up to two reasons and a comparison with the best window.
- Up to three suggested windows with empty-state explanations; 24-hour timeline with keyboard navigation and hour details.
- Preferences disclosure with per-activity comfort range, rain and wind tolerance, per-activity reset, remember location, forget location, reset all and clear all local data.
- Explanations name a factor only when it is notable (no "higher chance of precipitation" for a 5% chance).

### M2 — Data and location slice (11 November 2026)
- Forecast provider (validate, normalize, dedupe in-flight requests) and freshness tiers.
- Session forecast cache (LRU 5, re-validated on read) and versioned local settings with remember-location opt-in; storage failures fall back to memory.
- Explicit one-shot geolocation with 2-decimal rounding; denial keeps search and any previous place.
- Controller with generation IDs so slow earlier responses never replace a newer place; refresh on visibility, reconnect and a minute check; 429 cooldown.
- Location picker, Now conditions and data-status notices with a single polite live region.

### M1 — Domain engine (11 November 2026)
- Forecast normalization with an explicit field-to-time semantics registry: instantaneous fields from the interval start, precipitation, probability and gusts from the interval end; conservative weather-code and daylight handling.
- Units and IANA time-zone helpers (DST-safe labels, UTC fallback flag).
- Scoring version 1: activity presets, temperature/rain/wind penalties, worst-factor cap, concerning-weather flags.
- Duration windows (30–120 min), deterministic ranking of up to three non-overlapping windows, empty-state reasons, next-hour summary and comparison.
- Template-based explanations and headlines derived from the scoring contributions.

### M0 — Foundation (11 November 2026)
- Scaffolded static Astro 7 + single React 19 island, strict TypeScript 6.0, Vitest, Playwright, ESLint 10.
- Fixed provider configuration module; fetch client with timeout, abort, one retry, 429 Retry-After handling.
- Place search slice wired to Open-Meteo geocoding (2-code-point auto-search, Enter submits, rounded coordinates).
- Build-time CSP: inline script/style hashes written to `dist/_headers`; post-build guard against test markers.
- E2E harness with Playwright clock and provider route interception; first fixture journeys.
- Live multi-region field-availability report; temporal-mapping and time-zone fixtures.
- Spec pack v1.1 split into repository files.
