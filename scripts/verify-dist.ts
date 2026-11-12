/**
 * Post-build guard: the production bundle must not contain test fixtures,
 * test hooks or secrets-shaped variables (spec 06-TEST-PLAN, ADR-019).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const FORBIDDEN = ['_fixture', 'referenceNow', '__geoRequested', 'expectedIntervals', 'page.clock', 'API_KEY', 'apikey='];

const entries = await readdir(DIST, { withFileTypes: true, recursive: true });
const files = entries.filter((e) => e.isFile() && /\.(html|js|css|json|txt)$/.test(e.name)).map((e) => join(e.parentPath, e.name));
const hits: string[] = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const marker of FORBIDDEN) if (text.includes(marker)) hits.push(`${file.replace(DIST, 'dist/')}: ${marker}`);
}
if (hits.length > 0) {
  console.error(`Test-only or secret markers found in production build:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log(`[verify-dist] ${files.length} files clean`);
