import { expect, test } from '@playwright/test';
import { setUp } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

/**
 * Lab performance evidence (PRB §7). Opt-in: PERF=1 npx playwright test perf --project=chromium
 * Configuration: Chromium, 390×844, CDP CPU 4× slowdown, network ~1.6 Mbps down / 750 kbps up / 150 ms RTT,
 * production build from scripts/serve-dist.ts on localhost. API latency is excluded (fixtures).
 */
const enabled = process.env.PERF === '1';
const NOW = 1794729600;
const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');

test.use({ viewport: { width: 390, height: 844 }, locale: 'en-GB' });

test('static first render LCP/CLS and activity switch latency', async ({ page, browserName }) => {
  test.skip(!enabled || browserName !== 'chromium', 'Set PERF=1; Chromium only (uses CDP)');
  test.setTimeout(120_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number; __cls: number };
    w.__lcp = 0;
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) w.__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await setUp(page, {
    referenceNow: NOW,
    handlers: [
      { match: (u) => u.pathname === '/v1/search', body: { results: [LONDON] } },
      { match: (u) => u.pathname === '/v1/forecast', body: syntheticForecast({ start: NOW - 8 * 3600, timezone: 'Europe/London', current: { time: NOW } }) },
    ],
  });
  await page.clock.resume();
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const firstRender = await page.evaluate(() => {
    const w = window as unknown as { __lcp: number; __cls: number };
    return { lcp: Math.round(w.__lcp), cls: Number(w.__cls.toFixed(3)) };
  });

  console.log(`[perf] first render ${JSON.stringify(firstRender)}`);
  // Measure interaction without network emulation (forecast comes from fixtures).
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const input = page.getByLabel('Search city or place');
  await input.fill('London');
  await input.press('Enter');
  await page.getByRole('button', { name: /London, England/ }).click();
  await page.locator('.summary').waitFor();

  const switches: number[] = [];
  for (const label of ['Bike', 'Walk', 'Run', 'Hang out', 'Outdoors']) {
    const ms = await page.evaluate(async (name) => {
      const radio = [...document.querySelectorAll<HTMLInputElement>('input[type=radio]')].find(
        (r) => r.parentElement?.textContent?.trim() === name,
      );
      const t0 = performance.now();
      radio?.click();
      // Wait for React to commit and the browser to paint the next frame.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t0;
    }, label);
    switches.push(Math.round(ms));
  }

  const result = { ...firstRender, activitySwitchMs: switches, worstSwitchMs: Math.max(...switches) };
  console.log(`[perf] ${JSON.stringify(result)}`);
  test.info().annotations.push({ type: 'perf', description: JSON.stringify(result) });
  expect(result.lcp).toBeLessThanOrEqual(2500);
  expect(result.cls).toBeLessThanOrEqual(0.1);
});
