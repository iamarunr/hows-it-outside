# Outside? — interface and design specification

## Direction
A calm, light, editorial utility. The weather and decision lead; branding remains compact. Warm neutral background, dark ink, muted green accents, precise labels and plenty of space. No oversized hero, glass panels, gradients, floating decorative cards, stock landscape imagery, or unrelated portfolio marketing.

## Page order and hierarchy
1. Compact header: Outside? wordmark, About, Source when configured.
2. Location control: chosen city or Current area/Saved location; Change action; units control.
3. Primary summary: “How's it outside?” before location, then the next-hour match and two reasons.
4. Activity choices: Outdoors, Walk, Run, Bike, Hang out.
5. Now measurements, clearly differentiated from next-hour recommendation.
6. Duration selector and daylight-only option; best upcoming window and up to two alternatives.
7. Next 24 hours timeline and selected-hour details.
8. Preferences disclosure.
9. Small footer: author, methodology, privacy, weather attribution.

Show concerning-weather and stale-data notices before any positive summary. On mobile, avoid pushing the first result below a giant header. Desktop content max-width around 1120px; use two columns for summary/window section only where reading order remains natural. Timeline spans width. Mobile is one column; page itself must never horizontally overflow.

## Design tokens (proposed initial values)
Background #F7F8F4; surface #FFFFFF; primary text #202820; secondary text #526052; brand #2D6848; divider #D9E0D7. Status text: good #245C3D, mixed #785315, concern #9B3030. These are starting tokens, not a verified contrast report. Test actual foreground/background combinations; adjust failing pairs. Status uses text and icons, not color alone.

System font stack: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. No remote font request. Base text 16px with ~1.5 line-height; labels >=14px; headline 28–40px responsive. Tabular numerals for weather. Spacing scale 4/8/12/16/24/32/48 px. Border radius 8–12px for controls and contained regions, not a pill on every element. Prefer dividers to nested cards and shadows.

## Interaction contracts
Location: visible input label “Search city or place.” Debounced accessible combobox/listbox if implemented correctly, otherwise a normal search form plus semantic result buttons is acceptable. Arrow keys, Enter, Escape, visible selected option and polite result count. Do not move focus on every response. On selection return focus to location control or summary heading deliberately; never to document body.

Geolocation: permission only from the button. Copy before click: “Uses your approximate location to load weather.” Round before sending. No reverse geocoding in v1: GPS selection label is “Current area,” not an invented city. Show timezone below when relevant. Failure is inline with Retry and search available.

Activities: native radio inputs styled as segmented buttons, allowing wrap on narrow screens. Do not misuse tabs if there is no tabpanel. Selected state includes visible label and checked semantics. Switching keeps focus and announces updated summary briefly.

Timeline: horizontally scrollable single-select group of hourly items with a visible overflow cue. The group is one Tab stop: use native radio inputs or a roving-tabindex `role="radiogroup"`; Left/Right arrows move between hours, Home/End jump to first/last, and the focused item scrolls into view. Keyboard users must not need 24 Tab presses to pass the timeline. Each item names local time/date, match, temperature, precipitation chance and wind. Selecting shows detail below; no hover-only information. Provide a compact accessible list/table alternative or ensure the visible list itself exposes all values. SVG charts are optional and cannot be the only representation.

Preferences: inline disclosure, not a mandatory modal. Label fields, explain feels-like range, keep reset button per activity. Changes apply after valid entry; no Save needed. Unit conversion preserves values. A storage note explains remembering settings and location separately. “Remember this location” is unchecked by default; preferences may persist without the location.

## Content examples (illustrative, never hardcode as weather)
Good: “Good match for a walk” / “Within your preferred temperature range. Light wind in the forecast.” Mixed: “A little windy for cycling” only when wind is the largest penalty. Poor: “Poor match for your preferences” plus measured reason. Missing: “Some forecast details are unavailable. You can still review the available weather.” Stale: “Showing an earlier forecast retrieved at [time]. Suggestions are paused until it refreshes.” Empty daylight: “No matching daylight window in the next 24 hours. Try another duration or include nighttime.”

If every window is excluded by flags: “No suggested window with the current forecast. Review the conditions below.” Never encourage overriding warning flags. Generic failure: “Weather couldn't load. Try again or choose another location.” Offline: “You're offline. Previously loaded weather may be out of date.”

## Accessibility requirements
Target WCAG 2.2 AA, but do not claim certification from an automated scan. Semantic landmarks and one H1; skip link; focus contrast; target sizes >=44x44px where practical and never below AA minimum without allowed spacing. Color contrast >=4.5:1 normal text and >=3:1 large text/UI boundaries where required. No motion essential to meaning; honor prefers-reduced-motion. Test 200% and 400% zoom, 320px viewport, high contrast/forced colors, keyboard and screen reader.

Loading skeletons aria-hidden; one polite status region. Errors that need immediate action use appropriate alerts without announcing every hourly tile. Do not steal focus during auto-refresh. If selected timeline hour expires, choose nearest available hour and announce once. Preserve visible focus after disclosure controls.

## Responsive and performance checks
Target 360x800, 390x844, 768x1024 and 1440x900; additionally check reflow at 320px. Long place names and translated/native names must wrap without truncating country disambiguation. Avoid icons loaded from a remote CDN. Use a handful of local SVG icons with accessible text. No animated weather background, infinite animation or map dependency.

## Supporting pages
About: purpose, author link, source, scope. Methodology: inputs, preset table, preference heuristic, hourly approximation, limitations, flags, data attribution. Privacy: data flow, permissions, storage/clear controls, hosting/provider visibility. Static supporting pages remain readable without JS. Public Source link uses real configured repository URL only.
