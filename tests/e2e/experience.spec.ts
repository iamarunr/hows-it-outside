import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp, type Handler } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

const NOW = 1794729600; // 2026-11-15T08:00Z (synthetic)
const START = NOW - 8 * 3600;
const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');

const isSearch = (u: URL) => u.pathname === '/v1/search';
const isForecast = (u: URL) => u.pathname === '/v1/forecast';
const forecasts = (urls: URL[]) => urls.filter(isForecast);

/** Breezy but mild: Good for a walk (medium wind), Mixed for a bike ride (low wind tolerance). */
const BREEZY = () => ({ wind_speed_10m: 25, wind_gusts_10m: 30, apparent_temperature: 18 });

async function open(page: Page, hourly: (i: number) => Partial<Record<string, number | null>>, extra: Partial<Parameters<typeof syntheticForecast>[0]> = {}) {
  const handlers: Handler[] = [
    { match: isSearch, body: { results: [LONDON] } },
    { match: isForecast, body: syntheticForecast({ start: START, timezone: 'Europe/London', hourly, current: { time: NOW }, ...extra }) },
  ];
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page);
  return h;
}

async function choose(page: Page) {
  const input = page.getByLabel('Search city or place');
  await input.fill('London');
  await input.press('Enter');
  await page.getByRole('list', { name: 'Matching places' }).getByRole('button', { name: /London, England/ }).click();
  await expect(page.getByRole('heading', { name: /Weather for London/ })).toBeVisible();
}

test.use({ locale: 'en-GB' });

test('switching activities re-ranks locally without refetching', async ({ page }) => {
  const h = await open(page, BREEZY);
  await expect(page.getByRole('heading', { level: 3, name: /Good match for time outdoors/ })).toBeVisible();

  const activity = page.getByRole('group', { name: 'Activity' });
  await activity.getByLabel('Bike').check();
  await expect(page.getByRole('heading', { level: 3, name: /A little windy for a bike ride/ })).toBeVisible();
  await expect(page.getByText(/Windier than you prefer \(up to 25 km\/h, gusts 30 km\/h\)/).first()).toBeVisible();

  for (const [label, headline] of [
    ['Walk', /Good match for a walk/],
    ['Run', /Good match for a run/],
    ['Hang out', /hanging out/],
    ['Outdoors', /time outdoors/],
  ] as const) {
    await activity.getByLabel(label).check();
    await expect(page.getByRole('heading', { level: 3, name: headline })).toBeVisible();
  }
  expect(forecasts(h.providerRequests)).toHaveLength(1);
  expectClean(h);
});

test('duration, wind preference and units apply instantly, persist after reload, and never refetch', async ({ page }) => {
  const h = await open(page, () => ({}));
  await page.getByRole('group', { name: 'How long will you be out?' }).getByLabel('1.5 hours').check();
  await expect(page.locator('.window-time').first()).toHaveText("8:00 AM – 9:30 AM");

  await page.getByText('Preferences and saved data').click();
  await page.getByLabel('Wind').selectOption('low');
  await page.getByRole('group', { name: 'Units' }).getByLabel('°F, mph, in').check();
  await expect(page.locator('.readout-temp')).toHaveText('64°F');
  expect(forecasts(h.providerRequests)).toHaveLength(1);

  await page.reload();
  await expect(page.getByRole('group', { name: 'Units' }).getByLabel('°F, mph, in')).toBeChecked();
  await choose(page);
  await expect(page.getByRole('group', { name: 'How long will you be out?' }).getByLabel('1.5 hours')).toBeChecked();
  await page.getByText('Preferences and saved data').click();
  await expect(page.getByLabel('Wind')).toHaveValue('low');
  expect(forecasts(h.providerRequests)).toHaveLength(1); // second load served by the session cache
});

test('invalid comfort edits keep the last valid range and explain why', async ({ page }) => {
  await open(page, () => ({ apparent_temperature: 30 }));
  await expect(page.getByText(/Warmer than your preferred range/).first()).toBeVisible();
  await page.getByText('Preferences and saved data').click();
  const high = page.getByLabel('Highest');
  await high.fill('5');
  await expect(page.getByText('The lowest temperature must be below the highest. Your last valid range is still in use.')).toBeVisible();
  await expect(high).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText(/Warmer than your preferred range/).first()).toBeVisible();
  await high.fill('32');
  await expect(page.getByText(/Warmer than your preferred range/)).toHaveCount(0);
});

test('remember location: off by default, restores as Saved location, Forget clears it', async ({ page }) => {
  const h = await open(page, () => ({}));
  await page.getByText('Preferences and saved data').click();
  const remember = page.getByLabel('Remember this location on this device');
  await expect(remember).not.toBeChecked();
  await remember.check();
  expect(await page.evaluate(() => localStorage.getItem('outside:settings'))).toContain('London');

  await page.reload();
  await expect(page.getByText('Saved location')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Weather for London/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Weather for London/ })).not.toBeFocused();

  await page.getByText('Preferences and saved data').click();
  await page.getByRole('button', { name: 'Forget location' }).click();
  await expect(page.getByRole('heading', { name: /Weather for London/ })).toHaveCount(0);
  await expect(page.getByLabel('Search city or place')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('outside:settings'))).not.toContain('London');
  expect(await page.evaluate(() => sessionStorage.getItem('outside:forecast-cache'))).toBeNull();
  expect(h.unmatched).toEqual([]);
});

test('missing critical data shows Limited data, never a positive match', async ({ page }) => {
  const h = await open(page, () => ({ precipitation_probability: null }));
  await expect(page.getByRole('heading', { level: 3, name: /Limited data/ })).toBeVisible();
  await expect(page.getByText('Some forecast details are unavailable. You can still review the available weather.').first()).toBeVisible();
  await expect(page.getByText(/Good match/)).toHaveCount(0);
  await expect(page.locator('.hour-match').first()).toHaveText(/Limited data/);
  expectClean(h);
});

test('flagged hours are shown in the timeline, excluded from suggestions, and lead the summary', async ({ page }) => {
  // Thunderstorm codes from 08:00 to 11:00 UTC (hours 8–11 of the series).
  await open(page, (i) => (i >= 8 && i <= 11 ? { weather_code: 95 } : {}));
  const summarySection = page.locator('.summary');
  await expect(summarySection.locator('.flag-list')).toContainText('Thunderstorms in the forecast. Check local conditions and official alerts.');
  // Notice precedes the verdict heading in reading order.
  const order = await summarySection.evaluate((el) => {
    const flag = el.querySelector('.flag-list');
    const heading = el.querySelector('h3');
    return flag !== null && heading !== null && (flag.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  });
  expect(order).toBe(true);
  await expect(page.getByRole('heading', { level: 3, name: /Check conditions/ })).toBeVisible();
  await expect(page.locator('.hour').first()).toContainText('Check conditions');
  for (const t of await page.locator('.window-time').allTextContents()) {
    expect(t).not.toMatch(/^(8|9|10):\d\d/);
  }
  await expect(page.locator('.window-time').first()).toBeVisible();
});

test('timeline is one Tab stop with arrow, Home and End navigation', async ({ page }) => {
  await open(page, () => ({}));
  const hours = page.getByRole('radiogroup', { name: 'Hourly forecast' }).getByRole('radio');
  await expect(hours).toHaveCount(24);
  await hours.first().focus();
  await expect(hours.first()).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(hours.nth(1)).toBeFocused();
  await expect(hours.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#hour-details-heading')).toHaveText("9:00 AM – 10:00 AM");
  await page.keyboard.press('End');
  await expect(hours.nth(23)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(hours.first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radiogroup', { name: 'Hourly forecast' }).locator(':focus')).toHaveCount(0);
  expect(await hours.evaluateAll((els) => els.filter((e) => e.getAttribute('tabindex') === '0').length)).toBe(1);
});

test('remote city across a DST change shows unique local hour labels', async ({ page }) => {
  const dstNow = Date.parse('2026-11-01T04:30:00Z') / 1000; // 23:30 CDT, Oct 31 in Chicago
  const chicago = place(4887398, 'Chicago', 'Illinois', 'United States', 41.85, -87.65, 'America/Chicago');
  const h = await setUp(page, {
    referenceNow: dstNow,
    handlers: [
      { match: isSearch, body: { results: [chicago] } },
      { match: isForecast, body: syntheticForecast({ start: Date.parse('2026-10-31T05:00:00Z') / 1000, timezone: 'America/Chicago', current: { time: dstNow } }) },
    ],
  });
  await page.goto('/');
  const input = page.getByLabel('Search city or place');
  await input.fill('Chicago');
  await input.press('Enter');
  await page.getByRole('button', { name: /Chicago, Illinois/ }).click();
  await expect(page.locator('.hour')).toHaveCount(25); // current partial hour + 24
  const times = await page.locator('.hour-time').allTextContents();
  expect(new Set(times).size).toBe(times.length);
  const oneAm = times.filter((t) => /(^|\s)1:00\s?am/i.test(t));
  expect(oneAm).toHaveLength(2);
  expect(oneAm.some((t) => /CDT/.test(t)) && oneAm.some((t) => /CST/.test(t))).toBe(true);
  expect(times.some((t) => /Sun/.test(t))).toBe(true); // date shown after local midnight
  expectClean(h);
});
