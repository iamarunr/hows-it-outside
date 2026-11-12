/**
 * Minimal static server for E2E tests against the production build.
 * Unlike `astro preview`, it applies dist/_headers (path rules "/*" and
 * "/prefix/*"), so the generated CSP is enforced in tests as on the host.
 * Local testing tool only; not used in production.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4322);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

type Rule = { pattern: string; headers: [string, string][] };

function parseHeaders(file: string): Rule[] {
  const rules: Rule[] = [];
  for (const line of file.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: [] });
    } else {
      const idx = line.indexOf(':');
      rules.at(-1)?.headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
    }
  }
  return rules;
}

function matches(pattern: string, path: string): boolean {
  return pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern;
}

const rules = parseHeaders(await readFile(join(DIST, '_headers'), 'utf8'));

async function resolveFile(urlPath: string): Promise<string | null> {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = safe.endsWith('/') ? [join(DIST, safe, 'index.html')] : [join(DIST, safe), join(DIST, safe, 'index.html')];
  for (const candidate of candidates) {
    if (!candidate.startsWith(DIST)) return null;
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  void (async () => {
    let file = await resolveFile(path);
    let status = 200;
    if (file === null) {
      file = join(DIST, '404.html');
      status = 404;
    }
    for (const rule of rules) {
      if (matches(rule.pattern, path)) for (const [k, v] of rule.headers) res.setHeader(k, v);
    }
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.writeHead(status);
    res.end(await readFile(file));
  })().catch(() => {
    res.writeHead(500);
    res.end();
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[serve-dist] http://127.0.0.1:${PORT}`);
});
