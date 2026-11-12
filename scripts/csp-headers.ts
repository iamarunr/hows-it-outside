/**
 * Post-build step: hash every inline script/style in dist/**\/*.html, write
 * dist/_headers, then re-read it and verify every inline block is covered.
 * Exits non-zero on any violation so `npm run build` fails.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildHeadersFile, buildPolicy, findInline, hashesInHeaders, sha256Source } from './csp.ts';

const DIST = new URL('../dist/', import.meta.url).pathname;
// Must match src/lib/config.ts PROVIDER_ORIGINS (asserted by tests/unit/csp.test.ts).
const CONNECT_ORIGINS = ['https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com', 'https://api.bigdatacloud.net', 'https://api-bdc.io'] as const;

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => join(e.parentPath, e.name));
}

async function main(): Promise<void> {
  const files = await htmlFiles(DIST);
  if (files.length === 0) throw new Error('No built HTML found in dist/. Run astro build first.');

  const scriptHashes = new Set<string>();
  const styleHashes = new Set<string>();
  const perFile: { file: string; scripts: string[]; styles: string[] }[] = [];
  const violations: string[] = [];

  for (const file of files) {
    const found = findInline(await readFile(file, 'utf8'));
    const scripts = found.scripts.map(sha256Source);
    const styles = found.styles.map(sha256Source);
    scripts.forEach((h) => scriptHashes.add(h));
    styles.forEach((h) => styleHashes.add(h));
    perFile.push({ file, scripts, styles });
    violations.push(...found.violations.map((v) => `${file.replace(DIST, 'dist/')}: ${v}`));
  }

  if (violations.length > 0) {
    throw new Error(`CSP violations that hashes cannot cover:\n  ${violations.join('\n  ')}`);
  }

  const headersPath = join(DIST, '_headers');
  const noindex = process.env.PUBLIC_NOINDEX === 'true';
  await writeFile(
    headersPath,
    buildHeadersFile(buildPolicy({ scriptHashes, styleHashes, connectOrigins: CONNECT_ORIGINS }), { noindex }),
  );

  // Independent verification pass against the file actually written.
  const written = await readFile(headersPath, 'utf8');
  const allowedScripts = hashesInHeaders(written, 'script-src');
  const allowedStyles = hashesInHeaders(written, 'style-src');
  const missing = perFile.flatMap(({ file, scripts, styles }) => [
    ...scripts.filter((h) => !allowedScripts.has(h)).map((h) => `${file}: script ${h}`),
    ...styles.filter((h) => !allowedStyles.has(h)).map((h) => `${file}: style ${h}`),
  ]);
  if (missing.length > 0) throw new Error(`Inline code not covered by CSP:\n  ${missing.join('\n  ')}`);

  console.log(
    `[csp] ${files.length} HTML files; ${scriptHashes.size} script and ${styleHashes.size} style hashes written to dist/_headers${noindex ? ' (noindex)' : ''}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
