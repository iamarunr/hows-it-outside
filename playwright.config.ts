import { defineConfig, devices } from '@playwright/test';

// Dedicated port; a busy port fails the run instead of silently testing another site.
const PORT = 4791;

// Chromium runs in CI. Set E2E_ALL_BROWSERS=1 to add Firefox and WebKit locally.
const allBrowsers = process.env.E2E_ALL_BROWSERS === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  retries: 0,
  reporter: process.env.CI !== undefined ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(allBrowsers
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  // Tests run against the production build with generated headers applied, never the dev server.
  webServer: {
    command: `node scripts/serve-dist.ts`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
  },
});
