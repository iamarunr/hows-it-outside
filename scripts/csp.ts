/**
 * Pure helpers for build-time Content-Security-Policy generation.
 * The policy is delivered as an HTTP header via dist/_headers (spec ADR-018):
 * frame-ancestors is ignored in <meta>-delivered policies.
 */
import { createHash } from 'node:crypto';

export type InlineFindings = {
  scripts: string[];
  styles: string[];
  /** Problems that a hash cannot fix: style attributes, event handler attributes, javascript: URLs. */
  violations: string[];
};

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const STYLE_RE = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
const TAG_RE = /<[a-zA-Z][^>]*>/g;

export function sha256Source(content: string): string {
  return `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}

function hasSrc(attrs: string): boolean {
  return /\ssrc\s*=/i.test(attrs);
}

function isDataScript(attrs: string): boolean {
  const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
  return type !== undefined && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript';
}

export function findInline(html: string): InlineFindings {
  const scripts: string[] = [];
  const styles: string[] = [];
  const violations: string[] = [];

  for (const m of html.matchAll(SCRIPT_RE)) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    if (hasSrc(attrs) || isDataScript(attrs)) continue;
    if (body.length > 0) scripts.push(body);
  }
  for (const m of html.matchAll(STYLE_RE)) {
    const body = m[2] ?? '';
    if (body.length > 0) styles.push(body);
  }
  for (const m of html.matchAll(TAG_RE)) {
    const tag = m[0];
    if (/\sstyle\s*=/i.test(tag)) violations.push(`inline style attribute: ${tag.slice(0, 80)}`);
    if (/\son[a-z]+\s*=/i.test(tag)) violations.push(`inline event handler: ${tag.slice(0, 80)}`);
    if (/=\s*["']?\s*javascript:/i.test(tag)) violations.push(`javascript: URL: ${tag.slice(0, 80)}`);
  }
  return { scripts, styles, violations };
}

export type PolicyInput = {
  scriptHashes: Iterable<string>;
  styleHashes: Iterable<string>;
  connectOrigins: readonly string[];
};

export function buildPolicy(input: PolicyInput): string {
  const scriptHashes = [...new Set(input.scriptHashes)].sort();
  const styleHashes = [...new Set(input.styleHashes)].sort();
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", ...scriptHashes]],
    ['style-src', ["'self'", ...styleHashes]],
    ['img-src', ["'self'", 'data:']],
    ['font-src', ["'self'"]],
    ['connect-src', ["'self'", ...input.connectOrigins]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
    ['form-action', ["'self'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

export function buildHeadersFile(policy: string): string {
  return [
    '/*',
    `  Content-Security-Policy: ${policy}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: no-referrer',
    '  Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
    '  X-Frame-Options: DENY',
    '',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n');
}

/** Extracts the hash sources for one directive from a _headers file. */
export function hashesInHeaders(headersFile: string, directive: 'script-src' | 'style-src'): Set<string> {
  const line = headersFile.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'));
  if (line === undefined) return new Set();
  const policy = line.slice(line.indexOf(':') + 1);
  const part = policy
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${directive} `));
  if (part === undefined) return new Set();
  return new Set(part.split(/\s+/).filter((t) => t.startsWith("'sha256-")));
}
