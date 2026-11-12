import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp } from './support/harness';
import { syntheticForecast } from './support/forecast';

/** Below the sky: dials, sunrise and sunset, the day strip, the best-window card and the hour ribbon. */
const NOW = Date.parse('2026-11-15T10:00:00Z') / 1000;
const H = 3600;
test.use({ locale: 'en-US', timezoneId: 'UTC' });

function open(page: Page, extra: Partial<Parameters<typeof syntheticForecast>[0]> = {}) {
  return setUp(page, {
    referenceNow: NOW,
    handlers: [
      {
        match: (u) => u.pathname === '/v1/forecast',
        body: syntheticForecast({
          start: NOW - 8 * H,
          timezone: 'Europe/London',
          current: { time: NOW, weather_code: 2, wind_speed_10m: 25, wind_gusts_10m: null, relative_humidity_2m: 70 },
          daily: { sunrise: [NOW - 3 * H + 600, NOW + 21 * H + 720], sunset: [NOW + 6 * H + 300, NOW + 30 * H + 240] },
          hourly: (i) => {
            const hour = (2 + i) % 24;
            return { weather_code: i >= 14 && i <= 16 ? 61 : 0, is_day: hour >= 8 && hour <= 15 ? 1 : 0, apparent_temperature: 10 + (i % 7) };
          },
          ...extra,
        }),
      },
    ],
  });
}

async function london(page: Page) {
  await page.goto('/');
  await page.getByRole('list', { name: 'Places to try' }).getByRole('button', { name: /London/ }).click();
  await page.locator('.summary').waitFor();
}

test('sunset and sunrise show the provider times with a countdown, soonest first', async ({ page }) => {
  const h = await open(page);
  await london(page);
  const times = page.locator('.sun-times .sun-time');
  await expect(times).toHaveCount(2);
  await expect(times.nth(0)).toHaveText(/Sunset\s*4:05 PM\s*in 6 h 5 min/);
  await expect(times.nth(1)).toHaveText(/Sunrise\s*7:12 AM\s*in 21 h 12 min/);
  // The request asks the forecast provider for them; no other service is involved.
  const [request] = h.providerRequests.filter((u) => u.pathname === '/v1/forecast');
  expect(request?.searchParams.get('daily')).toBe('sunrise,sunset');
  // The countdown follows the clock.
  await page.clock.runFor(61_000);
  await expect(times.nth(0)).toHaveText(/in 6 h 4 min/);
  expectClean(h);
});

test('without daily data there are no sun times, and nothing else changes', async ({ page }) => {
  const h = await open(page, { daily: undefined as never });
  await london(page);
  await expect(page.locator('.sun-times')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 3, name: 'Now' })).toBeVisible();
  expectClean(h);
});

test('the dials keep every value as text; a missing value is "Unavailable" with no arc', async ({ page }) => {
  await open(page);
  await london(page);
  const now = page.locator('.now');
  await expect(now.locator('.gauge')).toHaveCount(3);
  await expect(now.getByText('16 mph')).toBeVisible();
  await expect(now.getByText('70%')).toBeVisible();
  const gusts = now.locator('.gauge', { hasText: 'Gusts' });
  await expect(gusts).toContainText('Unavailable');
  await expect(gusts.locator('.gauge-fill')).toHaveCount(0);
  await expect(now.locator('.gauge', { hasText: 'Wind' }).locator('.gauge-fill')).toHaveAttribute('stroke-dasharray', '50 100');
  for (const svg of await now.locator('svg').all()) await expect(svg).toHaveAttribute('aria-hidden', 'true');
});

test('each hour sits under its own sky, and the ribbon is still one keyboard-operable group', async ({ page }) => {
  await open(page);
  await london(page);
  const hours = page.getByRole('radiogroup', { name: 'Hourly forecast' }).getByRole('radio');
  await expect(hours).toHaveCount(24);
  const skies = await hours.evaluateAll((els) => els.map((el) => el.getAttribute('data-sky')));
  // 10:00–15:00 clear day, a rainy spell from 16:00, then night.
  expect(skies.slice(0, 5).every((s) => s === 'clear')).toBe(true);
  expect(skies).toContain('rain');
  expect(skies).toContain('night-clear');
  // Every tile draws its stretch of the temperature line, hidden from assistive technology.
  await expect(page.locator('.hour-plot polyline')).toHaveCount(24);
  await expect(page.locator('.hour-plot').first()).toHaveAttribute('aria-hidden', 'true');
  // Tiles touch, so the line is continuous.
  const [a, b] = [await hours.nth(0).boundingBox(), await hours.nth(1).boundingBox()];
  expect(Math.abs((a?.x ?? 0) + (a?.width ?? 0) - (b?.x ?? 0))).toBeLessThanOrEqual(1);

  await hours.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(hours.nth(1)).toBeChecked();
  await expect(hours.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(hours.nth(23)).toBeChecked();
});

test('the day strip is decorative and the best window is a card under that hour\'s sky', async ({ page }) => {
  await open(page);
  await london(page);
  await expect(page.locator('.daystrip-wrap')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.daystrip-hour')).toHaveCount(24);
  expect(await page.locator('.daystrip-best').count()).toBeGreaterThan(0);
  const best = page.locator('.windows > .window').first();
  await expect(best).toHaveClass(/window-best/);
  await expect(best).toHaveAttribute('data-sky', /clear|dawn|dusk/);
  await expect(best.getByText('Best match in the next 24 hours')).toBeVisible();
  await expect(page.locator('.windows > .window.sky')).toHaveCount(1);
});

for (const width of [320, 390, 768, 1440]) {
  test(`${width}px: the lower sections fit without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    await london(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const sel of ['.now .gauges', '.sun-times', '.daystrip', '.windows > .window.sky']) {
      const box = await page.locator(sel).boundingBox();
      expect(box?.x ?? -1, sel).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0), sel).toBeLessThanOrEqual(width);
    }
    // Dial numbers stay inside their own dial.
    for (const gauge of await page.locator('.gauge').all()) {
      const [g, n] = [await gauge.boundingBox(), await gauge.locator('dd span').boundingBox()];
      expect(n?.x ?? 0).toBeGreaterThanOrEqual((g?.x ?? 0) - 1);
      expect((n?.x ?? 0) + (n?.width ?? 0)).toBeLessThanOrEqual((g?.x ?? 0) + (g?.width ?? 0) + 1);
    }
  });
}

test('part-way through an hour (25 tiles) nothing runs past the edge of a phone screen', async ({ page }) => {
  // Found on the live site in WebKit: with a partial first hour there are 25 bars, and a label on the last one stuck out.
  await page.setViewportSize({ width: 390, height: 844 });
  await setUp(page, {
    referenceNow: NOW + 20 * 60,
    handlers: [
      {
        match: (u) => u.pathname === '/v1/forecast',
        body: syntheticForecast({ start: NOW - 8 * H, timezone: 'Europe/London', current: { time: NOW + 15 * 60 }, hourly: () => ({}) }),
      },
    ],
  });
  await london(page);
  await expect(page.locator('.daystrip-hour')).toHaveCount(25);
  const past = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll('.best-windows *, .now *')]
      .filter((el) => el.getBoundingClientRect().right > width + 1)
      .map((el) => `${el.className} ${el.textContent?.trim().slice(0, 20) ?? ''}`);
  });
  expect(past).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
