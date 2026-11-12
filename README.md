# Outside? — implementation handoff

Version 1.1 · 11 November 2026 · Owner: Naresh Kumar

**A public, open-source outdoor weather decision tool at https://outside.knnaresh.com.**

This pack is a proposed build specification, not an implemented application. PRB means Product Requirements Brief here; the PRB also serves as the detailed PRD. Product decisions below are recommended defaults unless explicitly identified as confirmed. No repository, domain, deployment, or provider account has been inspected or changed.

## Confirmed intent

- A general outdoors tool, not a running-only product.
- Visitors can open the site and get conditions for their own location.
- Open-source code that others can use, adapt, and deploy.
- A separate subdomain of Naresh's existing Astro portfolio: outside.knnaresh.com.
- A detailed handoff suitable for a coding agent.

## Recommended implementation baseline

Astro static output, TypeScript strict mode, one React interactive island, plain CSS design tokens, direct browser requests to Open-Meteo, no database, no account, no AI runtime, no API secret. Cloudflare Pages static hosting is the initial deployment target. Keep the existing portfolio independent. The code license is MIT; weather and location data retain their own licenses.

An open-source license does not grant commercial use of a third-party hosted API. Because this project sits under a professional portfolio domain, do not assume the free API's noncommercial eligibility. Resolve that before public launch; local development and the rest of the implementation can proceed. A paid deployment requires a server-side proxy; never ship a provider secret to the browser.

## Read in this order

1. [Agent start prompt](START_HERE.md)
2. [Product requirements](docs/01-PRB.md)
3. [Architecture](docs/02-ARCHITECTURE.md)
4. [Data contracts and integrations](docs/03-DATA-AND-API.md)
5. [Scoring and recommendations](docs/04-SCORING.md)
6. [Interaction and visual design](DESIGN.md)
7. [Privacy and security](docs/05-PRIVACY-SECURITY.md)
8. [Testing and acceptance](docs/06-TEST-PLAN.md)
9. [Implementation plan](docs/07-IMPLEMENTATION-PLAN.md)
10. [Deployment and operations](docs/08-DEPLOYMENT.md)
11. [Open-source readiness](docs/09-OPEN-SOURCE.md)
12. [Decisions and source references](docs/10-DECISIONS-SOURCES.md)

[PRODUCT.md](PRODUCT.md), [AGENTS.md](AGENTS.md), and [WORKFLOW.md](WORKFLOW.md) are repository-ready guidance. Copy this pack into the new repository, preserving the paths.

## Authority and change control

User instructions override this pack. PRB owns scope; SCORING owns formulas; DATA-AND-API owns normalized data semantics; DESIGN owns UI behavior; TEST-PLAN owns acceptance evidence. If a contradiction remains, record and resolve it before implementing dependent behavior. Do not silently substitute a complex stack or invent external integrations.

## What is deliberately not shipped in this pack

No application source, production secrets, live API test results, legal opinion, medically validated thresholds, or claim that a real deployment has been verified. All weather examples are illustrative. The implementation agent must generate and test the actual code.
