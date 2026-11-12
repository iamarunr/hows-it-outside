# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub: open this repository's **Security** tab and choose **Report a vulnerability** (GitHub private vulnerability reporting). Don't open a public issue with exploit details.

You'll get an acknowledgement when the report is reviewed. This is a personal open-source project, so there is no bug bounty and no guaranteed response time.

## Scope

Outside? is a static site with no server, accounts or database. Relevant issues include:

- Content Security Policy or response-header weaknesses (`scripts/csp.ts`, generated `dist/_headers`)
- Injection through place names or provider responses (all provider text must render as text)
- Leaks of location data into URLs, logs, storage without opt-in, or third parties
- Dependency vulnerabilities in code shipped to the browser

The weather and geocoding services themselves belong to Open-Meteo; report issues with them to Open-Meteo.

## Secrets

The free deployment uses no secrets. Never put an API key in `.env`, any `PUBLIC_*` variable or client code. A paid API key requires the server-side proxy described in `docs/02-ARCHITECTURE.md` §8.
