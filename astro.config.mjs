// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

/**
 * Canonical site URL. Read from the real environment (set it in the host's
 * build settings). Local builds default to localhost; a Cloudflare Pages
 * build without PUBLIC_SITE_URL fails rather than shipping localhost
 * canonical links.
 */
const configured = process.env.PUBLIC_SITE_URL?.trim();
if (process.env.CF_PAGES === '1' && (configured === undefined || configured === '')) {
  throw new Error('PUBLIC_SITE_URL must be set for hosted builds (e.g. https://outside.knnaresh.com).');
}
if (configured !== undefined && configured !== '' && !/^https?:\/\/[^/]+\/?$/.test(configured)) {
  throw new Error(`PUBLIC_SITE_URL must be an origin like https://example.com, got "${configured}".`);
}
const site = configured !== undefined && configured !== '' ? configured : 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
  integrations: [react()],
  build: {
    // Keep CSS in external files so the CSP needs no style hashes for it.
    inlineStylesheets: 'never',
  },
  devToolbar: { enabled: false },
});
