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
