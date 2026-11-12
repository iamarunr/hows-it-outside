import { expect, test } from '@playwright/test';
import { expectClean, setUp } from './support/harness';

test('production headers are present and CSP blocks unexpected origins', async ({ page }) => {
  const harness = await setUp(page, { referenceNow: 1794729600, handlers: [] });
  const response = await page.goto('/');
  const headers = response?.headers() ?? {};
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).not.toContain('unsafe-inline');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['permissions-policy']).toContain('geolocation=(self)');

  // The island hydrated, so its inline bootstrap scripts were allowed by hash.
  // Astro removes the ssr attribute once the island hydrates; that requires the hashed inline scripts.
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
  expectClean(harness);

  const blocked = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/');
      return false;
    } catch {
      return true;
    }
  });
  expect(blocked).toBe(true);
});
