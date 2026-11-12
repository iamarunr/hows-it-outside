# 05 — Privacy, security and data retention

## Privacy model
No account, server database, ad tracker, analytics SDK, third-party font, or background GPS watcher. Browser geolocation is called only after a deliberate click. Permission granted in the past does not authorize silently tracking subsequent visits. Use getCurrentPosition, never watchPosition in MVP.

Round latitude/longitude to two decimal places before any provider request, cache key or persistence. This reduces precision but is not anonymity; distance varies by latitude and rounding can still identify a small area. Do not retain raw GPS coordinate or accuracy data after constructing the rounded selection. Search result coordinates are rounded too. Provider weather grid resolution may be coarser.

## Data inventory
| Data | Destination | Retention/control |
|---|---|---|
| Rounded coordinates | Weather provider via HTTPS | Provider policies apply; app cannot promise their deletion |
| City search text | Geocoding provider | Sent after debounce; no local persistent history |
| IP and normal request metadata | Hosting provider; weather/geocoding provider for direct calls | Provider-managed logs/policies |
| Preferences/activity/units | Browser localStorage | Until reset/clear; schema versioned |
| Saved rounded location | Browser localStorage only if opted in | Until Forget location or clear |
| Forecast cache and coordinates | Browser sessionStorage | At most 5 entries; TTL/age rules; clear on Forget |
| Current selection | Browser memory | Until page close/reset |

Say “No accounts or tracking analytics,” not “We collect absolutely nothing.” Hosting and weather requests necessarily expose network metadata. This spec is a technical privacy baseline; publication wording must match the actual deployment.

## Controls
Forget location clears location from persistent storage and all forecast session entries; clears selected location and cancels requests. Reset preferences restores presets without clearing location; Clear all local data does both. If remember is disabled, remove any prior saved location immediately. Browser storage rejection shows a non-blocking note and uses memory. Do not put latitude/longitude into URL query/hash for MVP or create automatic location-sharing links.

## Threat model
Untrusted geocoding names and provider error messages may contain hostile text. Render only as text via framework escaping; never dangerouslySetInnerHTML. Validate all JSON, arrays, timestamp ranges, units and URLs. Use fixed provider origins configured at build time. Do not accept arbitrary upstream endpoints from URL parameters. No third-party scripts.

Repository secrets: no .env credentials committed. .env.example only documents public deployment values. Public variables are shipped to the browser. Paid API keys belong in a later server proxy and never PUBLIC_ variables. CI uses minimal permissions; untrusted pull requests cannot access production deployment secrets.

## Headers and CSP
Configure HTTPS and response headers: X-Content-Type-Options nosniff, Referrer-Policy no-referrer, Permissions-Policy geolocation=(self), and a tested Content-Security-Policy. Start CSP from default-src self; connect-src self plus the exact weather, geocoding and (since IMP-056) area-name origins; img-src self data: if needed; object-src none; base-uri self; frame-ancestors none; form-action self. Evaluate generated Astro inline scripts/styles and add build-generated hashes or remove inline code rather than blindly permitting unsafe-inline. CSP must be tested on the built site, not merely declared in docs.

Implementation mechanics (decide in M0, not at release):
- Deliver the CSP as an HTTP response header via the static host's `_headers` file, not only a `<meta>` tag: `frame-ancestors` (and reporting directives) are ignored in meta-delivered policies.
- Astro island hydration emits inline `<script>` content, so hashes must be computed from the built output. If the installed Astro version provides stable built-in CSP hash generation, use it as the hash source but still emit the header; otherwise add a small post-build script (`scripts/csp-headers.mjs`, run by `npm run build`) that parses every built HTML file, computes SHA-256 hashes of inline scripts and styles, and writes `dist/_headers` with the union.
- Avoid inline `style="…"` attributes in rendered markup (including from React): `style-src` hashes do not cover attributes without `'unsafe-hashes'`. Use classes or CSS custom properties set from stylesheets.
- A CI check fails the build if any built HTML contains an inline script or style whose hash is missing from `dist/_headers`, and an E2E test asserts no CSP violation is reported on the built preview.

Apply HSTS only with understanding of host/subdomain behavior; do not add includeSubDomains or preload changes to the portfolio domain as a side effect. Static host _headers can implement app-specific headers; verify response headers after deployment.

## Operational privacy
Do not log complete weather request URLs, coordinates, city queries or provider payloads in production. Error diagnostics should use generic categories and build/scoring version. No analytics by default; a future addition requires updated privacy docs and review. Local debugging may use synthetic locations. Bug report templates must warn against posting private coordinates or screenshots of personal addresses.

## Residual limitations
Device geolocation can be inaccurate; browser permissions may be blocked; rounding may move points across coasts or time zones; weather is modeled, not street-level observation. Show the selected place and allow correction. Data retention outside the application is governed by its providers, not this code.
