// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

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
