import { describe, expect, it } from 'vitest';
import { buildHeadersFile, buildPolicy, findInline, hashesInHeaders, sha256Source } from '../../scripts/csp';
import { PROVIDER_ORIGINS } from '../../src/lib/config';
import { readFileSync } from 'node:fs';

describe('CSP generation', () => {
  it('hashes inline scripts and styles but skips external and data scripts', () => {
    const html =
      '<script>a()</script><script type="module" src="/x.js"></script>' +
      '<script type="application/ld+json">{}</script><style>p{}</style>';
    const found = findInline(html);
    expect(found.scripts).toEqual(['a()']);
    expect(found.styles).toEqual(['p{}']);
    expect(found.violations).toEqual([]);
  });

  it('matches the known SHA-256 CSP source format', () => {
    // echo -n "a()" | openssl dgst -sha256 -binary | base64
    expect(sha256Source('a()')).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
    expect(sha256Source('a()')).not.toBe(sha256Source('a() '));
  });

  it('reports style attributes, event handlers and javascript: URLs as violations', () => {
    const found = findInline('<div style="color:red"></div><button onclick="x()"></button><a href="javascript:x()"></a>');
    expect(found.violations).toHaveLength(3);
  });

  it('builds a policy without unsafe-inline and with exact provider origins', () => {
    const policy = buildPolicy({
      scriptHashes: ["'sha256-b'", "'sha256-a'", "'sha256-a'"],
      styleHashes: [],
      connectOrigins: Object.values(PROVIDER_ORIGINS),
    });
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).toContain("script-src 'self' 'sha256-a' 'sha256-b'");
    expect(policy).toContain("connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://api-bdc.io");
    expect(policy).toContain("frame-ancestors 'none'");
    const file = buildHeadersFile(policy);
    expect([...hashesInHeaders(file, 'script-src')]).toEqual(["'sha256-a'", "'sha256-b'"]);
  });

  it('adds X-Robots-Tag only for noindex (preview) builds', () => {
    expect(buildHeadersFile('default-src self')).not.toContain('X-Robots-Tag');
    expect(buildHeadersFile('default-src self', { noindex: true })).toContain('X-Robots-Tag: noindex, nofollow');
  });

  it('keeps the post-build connect origins in sync with the app config', () => {
    const script = readFileSync(new URL('../../scripts/csp-headers.ts', import.meta.url), 'utf8');
    for (const origin of Object.values(PROVIDER_ORIGINS)) expect(script).toContain(`'${origin}'`);
  });
});
