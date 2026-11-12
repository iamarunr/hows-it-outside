import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp, type Handler } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

const NOW = 1794729600; // 2026-11-15T08:00Z (synthetic)
const START = NOW - 8 * 3600;

const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');
const CHENNAI = place(1264527, 'Chennai', 'Tamil Nadu', 'India', 13.08784, 80.27847, 'Asia/Kolkata');

const londonForecast = syntheticForecast({ start: START, timezone: 'Europe/London', current: { time: NOW, temperature_2m: 11, apparent_temperature: 9 } });
const chennaiForecast = syntheticForecast({ start: START, timezone: 'Asia/Kolkata', utcOffsetSeconds: 19800, current: { time: NOW, temperature_2m: 29, apparent_temperature: 33 } });

const isSearch = (name: string) => (u: URL) => u.pathname === '/v1/search' && u.searchParams.get('name') === name;
const isForecastAt = (lat: string, lon: string) => (u: URL) =>
  u.pathname === '/v1/forecast' && u.searchParams.get('latitude') === lat && u.searchParams.get('longitude') === lon;

function baseHandlers(): Handler[] {
  return [
    { match: isSearch('London'), body: { results: [LONDON] } },
    { match: isSearch('Chennai'), body: { results: [CHENNAI] } },
    { match: isForecastAt('51.51', '-0.13'), body: londonForecast },
    { match: isForecastAt('13.09', '80.28'), body: chennaiForecast },
  ];
}

async function choose(page: Page, query: string, label: RegExp) {
  const input = page.getByLabel('Search city or place');
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Change location' }).click();
  await input.fill(query);
  await input.press('Enter');
  await page.getByRole('list', { name: 'Matching places' }).getByRole('button', { name: label }).click();
}

const forecastRequests = (urls: URL[]) => urls.filter((u) => u.pathname === '/v1/forecast');

test.use({ locale: 'en-GB' });

test('two cities load in turn with their own values and time zones', async ({ page }) => {
  const h = await setUp(page, { referenceNow: NOW, handlers: baseHandlers() });
  await page.goto('/');

  await choose(page, 'London', /London, England/);
  const heading = page.getByRole('heading', { name: 'Weather for London, England, United Kingdom' });
  await expect(heading).toBeFocused();
  await expect(page.getByText('Times shown for Europe/London')).toBeVisible();
  await expect(page.getByRole('definition').first()).toHaveText('11°C');

  await choose(page, 'Chennai', /Chennai/);
  await expect(page.getByRole('heading', { name: /Weather for Chennai/ })).toBeFocused();
  await expect(page.getByText('Times shown for Asia/Kolkata')).toBeVisible();
  await expect(page.getByRole('definition').first()).toHaveText('29°C');
  await expect(page.getByText(/London/)).toHaveCount(0);

  expect(forecastRequests(h.providerRequests)).toHaveLength(2);
  expectClean(h);
});

test('a slow response for an earlier place cannot overwrite the newer selection', async ({ page }) => {
  const handlers = baseHandlers();
  const london = handlers.find((x) => x.body === londonForecast);
  if (london !== undefined) london.delayMs = 1500;
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');

  await choose(page, 'London', /London, England/);
  await choose(page, 'Chennai', /Chennai/);
  await expect(page.getByRole('definition').first()).toHaveText('29°C');

  await page.waitForTimeout(2000); // let the delayed London response arrive (real time)
  await expect(page.getByRole('heading', { name: /Weather for Chennai/ })).toBeVisible();
  await expect(page.getByRole('definition').first()).toHaveText('29°C');
  await expect(page.getByText('11°C')).toHaveCount(0);
  expect(h.unmatched).toEqual([]);
});

test('no location prompt before the button; denied permission leaves search usable', async ({ page, context }) => {
  await context.clearPermissions();
  const h = await setUp(page, { referenceNow: NOW, handlers: baseHandlers() });
  await page.goto('/');
  expect(h.providerRequests).toHaveLength(0);

  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('alert')).toContainText('Location access is off for this site');
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeEnabled();

  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('definition').first()).toHaveText('11°C');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expectClean(h);
});

test('device location sends rounded coordinates and is labeled Current area', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 38.627274, longitude: -90.197889 });
  const h = await setUp(page, {
    referenceNow: NOW,
    handlers: [{ match: isForecastAt('38.63', '-90.20'), body: syntheticForecast({ start: START, timezone: 'America/Chicago', current: { time: NOW } }) }],
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('heading', { name: 'Weather for Current area' })).toBeVisible();
  await expect(page.getByText('Based on your approximate location')).toBeVisible();
  const [request] = forecastRequests(h.providerRequests);
  expect(request?.searchParams.get('latitude')).toBe('38.63');
  expect(request?.searchParams.get('longitude')).toBe('-90.20');
  expect(request?.toString()).not.toContain('38.627');
  expectClean(h);
});

test('null current values show Unavailable, never zero', async ({ page }) => {
  const handlers = baseHandlers();
  const london = handlers.find((x) => x.body === londonForecast);
  if (london !== undefined) {
    london.body = syntheticForecast({ start: START, timezone: 'Europe/London', current: { time: NOW, temperature_2m: null, wind_speed_10m: null, weather_code: null } });
  }
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  const now = page.getByRole('region', { name: 'Now' });
  await expect(now.getByText('Conditions unavailable')).toBeVisible();
  await expect(now.getByRole('definition').nth(0)).toHaveText('Unavailable');
  await expect(now.getByRole('definition').nth(2)).toHaveText('Unavailable');
  await expect(now.getByText('0°C')).toHaveCount(0);
  expectClean(h);
});

test('provider outage: one automatic retry, then a clear error; Try again recovers', async ({ page }) => {
  const handlers = baseHandlers();
  const outage: Handler = { match: isForecastAt('51.51', '-0.13'), status: 503, body: { error: true, reason: 'down' } };
  handlers.unshift(outage);
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect.poll(() => forecastRequests(h.providerRequests).length).toBe(1);
  await page.waitForTimeout(100); // let the 503 reach the page so the retry backoff timer exists
  await page.clock.runFor(1100); // retry backoff
  await expect(page.getByRole('alert')).toHaveText(/Weather couldn't load\. Try again or choose another location\./);
  expect(forecastRequests(h.providerRequests)).toHaveLength(2);
  await expect(page.getByText('down')).toHaveCount(0); // provider text is never shown

  handlers.shift();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('definition').first()).toHaveText('11°C');
  expect(forecastRequests(h.providerRequests)).toHaveLength(3);
});

test('rate limiting shows a busy message and blocks retry during the cooldown', async ({ page }) => {
  const handlers = baseHandlers();
  handlers.unshift({ match: isForecastAt('51.51', '-0.13'), status: 429, headers: { 'Retry-After': '120' }, body: {} });
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('alert')).toContainText('The weather service is busy');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeDisabled();
  expect(forecastRequests(h.providerRequests)).toHaveLength(1);
});

test('the session cache serves a recently loaded place without a new request', async ({ page }) => {
  const h = await setUp(page, { referenceNow: NOW, handlers: baseHandlers() });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('definition').first()).toHaveText('11°C');
  await page.reload();
  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('definition').first()).toHaveText('11°C');
  expect(forecastRequests(h.providerRequests)).toHaveLength(1);
});

test('a failed refresh keeps the forecast; after an hour it is marked stale', async ({ page }) => {
  const handlers = baseHandlers();
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('definition').first()).toHaveText('11°C');

  handlers.unshift({ match: isForecastAt('51.51', '-0.13'), status: 503, body: {} });
  await page.clock.fastForward('16:00');
  await page.clock.runFor(61_000); // minute check → refresh → retry → fail
  await expect(page.getByText(/Couldn't refresh\. Forecast retrieved at/)).toBeVisible();
  await expect(page.getByRole('definition').first()).toHaveText('11°C');

  await page.clock.fastForward('45:00');
  await page.clock.runFor(61_000);
  await expect(page.getByText(/Showing an earlier forecast retrieved at .*Suggestions are paused until it refreshes\./)).toBeVisible();
  expect(forecastRequests(h.providerRequests).length).toBeGreaterThan(1);
});
