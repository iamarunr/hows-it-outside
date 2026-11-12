# Security policy

## Reporting a vulnerability

**A private reporting route has not been set up yet.** Until the maintainer publishes one here, please do not open a public issue with exploit details. If the repository has GitHub private vulnerability reporting enabled, use **Security → Report a vulnerability**.

<!-- Owner: replace the paragraph above with the real private reporting route before public launch (see docs/09-OPEN-SOURCE.md). Do not invent an address. -->

## Scope

Outside? is a static site with no server, accounts or database. Relevant issues include:

- Content Security Policy or response-header weaknesses (`scripts/csp.ts`, generated `dist/_headers`)
- Injection through place names or provider responses (all provider text must render as text)
- Leaks of location data into URLs, logs, storage without opt-in, or third parties
- Dependency vulnerabilities in code shipped to the browser

The weather and geocoding services themselves belong to Open-Meteo; report issues with them to Open-Meteo.

## Secrets

The free deployment uses no secrets. Never put an API key in `.env`, any `PUBLIC_*` variable or client code. A paid API key requires the server-side proxy described in `docs/02-ARCHITECTURE.md` §8.
