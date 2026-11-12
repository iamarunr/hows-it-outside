# Portfolio entry (draft, for a separate authorized change to knnaresh.com)

**Outside?** — an open-source weather tool that answers "should I head outside now, or is there a better time today?" for walking, running, cycling and time outdoors.

- Picks the best windows in the next 24 hours from your preferences, and explains every match in plain language from the same numbers it scores with.
- Built with Astro (static) and a single React island; strict TypeScript; no backend, accounts, analytics or API keys.
- Careful with data: hourly fields aligned to the hour they describe, missing values never treated as zero, daylight-saving-safe times in the place's own time zone.
- Privacy by default: location only on request, rounded to about 1 km, saved only with opt-in.
- Accessible and fast: zero automated axe violations across Chromium, Firefox and WebKit; about 95 KB of JavaScript; strict build-time Content Security Policy.

Stack: Astro 7 · React 19 · TypeScript · Vitest · Playwright · axe-core · Open-Meteo · Cloudflare Pages.

Links: Live site (pending) · Source (pending). Screenshot: `docs/images/screenshot-desktop.png` (synthetic sample weather).

Note for the portfolio: don't describe it as safety or health advice, or as hyperlocal.
