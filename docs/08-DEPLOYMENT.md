# 08 — Deployment and operations runbook

## Target topology
Separate repository and hosting project for outside.knnaresh.com; existing knnaresh.com stays intact. Initial target is Cloudflare Pages serving Astro static dist. No adapter or server runtime required in free direct-provider mode. A different static host is acceptable for forks if it supports HTTPS and required headers.

## Local setup the implementation must support
```sh
npm ci
npm run check
npm run test
npm run build
npm run preview
```
Document the actual preview port after implementation. Keep .nvmrc/engines/CI aligned to the chosen supported Node version. Build command npm run build; output directory dist. Commit lockfile. Never require an owner-specific file path or local secret to build.

## Public configuration
Document PUBLIC_SITE_URL, PUBLIC_SOURCE_URL, PUBLIC_AUTHOR_URL and optional public contact URL. Site defaults can be localhost for development; production canonical must be https://outside.knnaresh.com. API public endpoints may be constants with documented overrides for forks; never allow runtime arbitrary URL query overrides. No API key variable in static mode.

## Deployment steps
1. Run acceptance checks and note deployable commit.
2. Resolve API noncommercial/commercial eligibility and attribution; this portfolio subdomain is not automatically eligible merely because code is MIT.
3. Create separate Cloudflare Pages project connected to the real repository. Use main, npm run build, dist and appropriate Node version.
4. Verify preview deployment before custom domain: weather/search, permission fallback, no private config, header behavior.
5. In the Pages project, add outside.knnaresh.com as a custom domain. Follow the dashboard's generated DNS instructions; do not invent target names.
6. If zone is managed elsewhere, configure the required subdomain CNAME after association. Preserve existing apex, www, email/MX and all unrelated records. Do not change nameservers as an incidental step.
7. Wait for certificate/domain validation; verify HTTPS and browser geolocation.
8. Test canonical URL, favicon, robots, methodology/privacy routes, 404, and caching. Record exact production commit.

## Indexing and metadata
Home title: Outside? — Weather for getting outdoors. Description describes activity-based conditions without promising safety. Canonical points to deployment config. Do not index location-specific URLs because v1 has none. Include static supporting pages in sitemap if used. Preview deployments need noindex via response header or environment-specific robots metadata; do not accidentally ship preview noindex to production. No fabricated weather in structured data or OG metadata.

## Cache and refresh
Hashed assets may have long immutable browser cache. HTML should revalidate; no service worker in MVP. Weather session cache is separate from CDN asset caching. Test that deployment updates HTML and fingerprinted assets consistently. Do not configure long immutable caching for every path.

## Operational limits and capacity
Free hosted API access has published quotas and no uptime guarantee; recheck current limits at launch and follow all applicable caps. Direct browser architecture does not create an app-wide quota control and should not be used to evade provider policies. Debounce/search caching, dedupe and 15-minute forecast cache reduce load. Do not assume one HTTP request always equals one billable call; verify provider variable/horizon accounting if scaling. If traffic or commercial eligibility requires paid service, use proxy migration and budget alerts before launch on that mode.

## Smoke checklist
- Fresh mobile visitor can search, allow or deny location.
- Returned place label and local timezone are correct.
- Real data values render; no fixture/test intercept leaks to production.
- Source/author/privacy/methodology and attribution links work.
- No API secrets or precise coordinates in initial HTML, bundle or console.
- CSP/Permissions-Policy permit app behavior.
- Production indexable; preview not indexable.
- Provider failure recovers and never invents favorable data.

## Incident procedures
Provider outage: static site remains available; error/stale state communicates failure; avoid increasing automatic retries. Rate limiting: respect cooldown, inspect request patterns, reduce accidental duplicate requests, evaluate plan. Wrong recommendations: reproduce with sanitized fixture, revert affected scoring commit, document scoring version. Bad deployment: restore last known good deployment via hosting dashboard/authorized workflow; do not reset the repo destructively. Exposed credential in future proxy mode: revoke/rotate, inspect logs, remove exposure and incident-document; deleting a commit alone is insufficient.

## Maintenance
Check dependencies and provider contract regularly before releases. Keep a scheduled automated dependency PR mechanism optional; no automation is created by this document. Re-run golden tests when provider fields change. Review free-tier terms before adding sponsorship, ads, commercial positioning or paid features. Track unresolved reports without collecting private locations.

## Implemented runbook (M5, 11 November 2026)

This section records the actual implementation. Nothing here has been deployed; every hosted step needs owner authorization.

### Build settings (Cloudflare Pages)

| Setting | Value |
|---|---|
| Framework preset | None (or Astro) — static output, no adapter |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `26` (`NODE_VERSION=26` environment variable, matching `.nvmrc`) |
| Production branch | `main` |

`npm run build` runs `astro build`, then `scripts/csp-headers.ts` (hashes every inline script and style into `dist/_headers` and fails on anything a hash can't cover), then `scripts/verify-dist.ts` (fails if fixtures or test hooks reach the bundle).

### Environment variables

| Variable | Production | Preview |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://outside.knnaresh.com` | `https://outside.knnaresh.com` (canonical stays production) |
| `PUBLIC_NOINDEX` | unset | `true` |
| `PUBLIC_SOURCE_URL` | `https://github.com/iamarunr/hows-it-outside` | same |
| `PUBLIC_AUTHOR_URL` | `https://knnaresh.com` | same |

A Pages build (`CF_PAGES=1`) without `PUBLIC_SITE_URL` fails on purpose. With `PUBLIC_NOINDEX=true` every page gets `<meta name="robots" content="noindex, nofollow">` and `_headers` adds `X-Robots-Tag: noindex, nofollow`. Never set it on production.

### Local verification before deploying

```sh
npm ci && npm run check && npm run lint && npm run test && npm run build
npm run test:e2e                       # Chromium, built site with headers, port 4791
E2E_ALL_BROWSERS=1 npm run test:e2e    # adds Firefox and WebKit
PERF=1 npx playwright test perf --project=chromium
npm run preview                        # http://localhost:4321 (no _headers; use for visual checks only)
```

### Header verification after a deployment

```sh
curl -sI https://<deployment-host>/ | grep -iE 'content-security-policy|x-content-type-options|referrer-policy|permissions-policy|x-frame-options|x-robots-tag'
curl -sI https://<deployment-host>/_astro/<any-asset>.js | grep -i cache-control
```

Expect the CSP to start with `default-src 'self'`, contain `connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://api-bdc.io` and `frame-ancestors 'none'`, and contain no `unsafe-inline`. Expect `X-Robots-Tag` only on preview hosts. Then open the site, run a search and "Use my location", and check the browser console for CSP reports.

### Rollback

Cloudflare Pages keeps every deployment. To roll back, choose the last known-good deployment in the Pages dashboard and use **Rollback to this deployment**, then record the commit. Do not rewrite git history to roll back.

### Release record (12 November 2026)

- Pages project `hows-it-outside` on the owner's account, created with `wrangler pages project create hows-it-outside --production-branch main --force`. Current Wrangler delegates new Pages projects to Workers; `--force` keeps the classic Pages product the runbook specifies. It is not needed again.
- Deployed by direct upload from a local build (not Git-connected): `wrangler pages deploy dist --project-name hows-it-outside --branch <main|preview> --commit-hash <sha>`. Preview builds set `PUBLIC_NOINDEX=true`; both set `PUBLIC_SITE_URL`, `PUBLIC_SOURCE_URL` and `PUBLIC_AUTHOR_URL` as listed above.
- Released commit: `ec9ed96` (production at https://hows-it-outside.pages.dev, preview at https://preview.hows-it-outside.pages.dev). Rollback target: the previous production deployment in the Pages dashboard (`00c4bf1`).
- Custom domain: **deferred by the owner on 2026-11-12.** Until it is attached, production is built with `PUBLIC_SITE_URL=https://hows-it-outside.pages.dev` so canonical links point at a live address.
- To attach later: in the Cloudflare dashboard open **Workers & Pages → hows-it-outside** (the Pages project) → **Custom domains** → **Set up a custom domain** → `outside.knnaresh.com`. knnaresh.com is on the same account, so Cloudflare creates the CNAME; leave existing records alone. Then rebuild production with `PUBLIC_SITE_URL=https://outside.knnaresh.com`, redeploy, and verify HTTPS, headers and a smoke run on the custom domain.
- 2026-11-12, bolder pass: commit `70c4b0d` deployed to production (https://hows-it-outside.pages.dev, canonical pages.dev) and preview (noindex). Headers re-verified; 6-city live smoke passed with no console errors. Rollback target: the previous production deployment (`a1b5244`).
- 2026-11-12, living landscape: commit `698fe58` deployed to production (https://hows-it-outside.pages.dev, canonical pages.dev) and preview (noindex). Headers re-verified. Live smoke in Chromium, Firefox and WebKit at 390 px and 1440 px: first screen, a shortcut card (Sydney) and its live forecast loaded with no console or CSP errors and no sideways scroll. Rollback target: the previous production deployment (`70c4b0d`).
- 2026-11-12, named device location and menu on the sky: commit `769cb49` deployed to production (https://hows-it-outside.pages.dev) and preview (noindex). `connect-src` now also lists `https://api.bigdatacloud.net` and `https://api-bdc.io`. Live check in Chromium, Firefox and WebKit with a mocked device position in downtown St. Louis: the readout named "St. Louis" from the real lookup, the menu was transparent at the top and navy after scrolling, with no console or CSP errors. Rollback target: the previous production deployment (`698fe58`).
