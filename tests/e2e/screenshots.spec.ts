import { test } from '@playwright/test';
import { setUp } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

/**
 * Review screenshots with synthetic weather. Skipped unless SCREENSHOT_DIR is set:
 *   SCREENSHOT_DIR=/tmp/shots npx playwright test screenshots
 */
const dir = process.env.SCREENSHOT_DIR;
test.use({ locale: 'en-GB' });
const NOW = 1794729600;
const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');

for (const [name, viewport] of [
  ['mobile-320', { width: 320, height: 700 }],
  ['mobile-360', { width: 360, height: 800 }],
  ['mobile-390', { width: 390, height: 844 }],
  ['tablet-768', { width: 768, height: 1024 }],
  ['desktop-1440', { width: 1440, height: 900 }],
] as const) {
  test(`screenshot ${name}`, async ({ page }) => {
    test.skip(dir === undefined, 'SCREENSHOT_DIR not set');
    await page.setViewportSize(viewport);
    await setUp(page, {
      referenceNow: NOW,
      handlers: [
        { match: (u) => u.pathname === '/v1/search', body: { results: [LONDON] } },
        {
          match: (u) => u.pathname === '/v1/forecast',
          body: syntheticForecast({
            start: NOW - 8 * 3600,
            timezone: 'Europe/London',
            current: { time: NOW, temperature_2m: 11, apparent_temperature: 9 },
            hourly: (i) => ({
              apparent_temperature: 6 + Math.max(0, 8 - Math.abs(i - 14)),
              precipitation_probability: i >= 9 && i <= 11 ? 60 : 5,
              precipitation: i >= 9 && i <= 11 ? 0.8 : 0,
              weather_code: i >= 9 && i <= 11 ? 61 : 2,
              is_day: i >= 7 && i <= 16 ? 1 : 0,
            }),
          }),
        },
      ],
    });
    await page.goto('/');
    await page.screenshot({ path: `${dir}/${name}-empty.png`, fullPage: true });
    const input = page.getByLabel('Search city or place');
    await input.fill('London');
    await input.press('Enter');
    await page.getByRole('button', { name: /London, England/ }).click();
    await page.locator('.summary').waitFor();
    await page.waitForTimeout(1500); // let the sky transition settle (real time; CSS is not on the page clock)
    await page.screenshot({ path: `${dir}/${name}-loaded.png`, fullPage: true });
    await page.screenshot({ path: `${dir}/${name}-first-screen.png` });
    await page.getByText('Preferences and saved data').click();
    await page.mouse.move(0, 0); // no lingering hover state in the capture
    await page.locator('.settings').screenshot({ path: `${dir}/${name}-preferences.png` });
  });
}

/** One capture per sky so the weather layers can be reviewed (synthetic weather). */
const SKIES = [
  { id: 'cloudy', code: 3, day: 1 },
  { id: 'rain', code: 63, day: 1 },
  { id: 'night-clear', code: 0, day: 0 },
  { id: 'snow', code: 73, day: 1 },
  { id: 'storm', code: 95, day: 1 },
  { id: 'fog', code: 45, day: 1 },
] as const;

for (const sky of SKIES) {
  for (const width of [1440, 390]) {
    test(`sky ${sky.id} at ${width}`, async ({ page }) => {
      test.skip(dir === undefined, 'SCREENSHOT_DIR not set');
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await setUp(page, {
        referenceNow: NOW,
        handlers: [
          { match: (u) => u.pathname === '/v1/search', body: { results: [LONDON] } },
          {
            match: (u) => u.pathname === '/v1/forecast',
            body: syntheticForecast({
              start: NOW - 8 * 3600,
              timezone: 'Europe/London',
              current: { time: NOW, temperature_2m: 11, apparent_temperature: 9, weather_code: sky.code },
              hourly: () => ({ weather_code: sky.code, is_day: sky.day }),
            }),
          },
        ],
      });
      await page.goto('/');
      const input = page.getByLabel('Search city or place');
      await input.fill('London');
      await input.press('Enter');
      await page.getByRole('button', { name: /London, England/ }).click();
      await page.locator(`.sky[data-sky="${sky.id}"]`).waitFor();
      await page.waitForTimeout(1500);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${dir}/sky-${sky.id}-${width}.png` });
    });
  }
}
