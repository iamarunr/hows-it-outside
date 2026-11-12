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
  await expect(page.locator('.readout-temp')).toHaveText('11°C');

  await choose(page, 'Chennai', /Chennai/);
  await expect(page.getByRole('heading', { name: /Weather for Chennai/ })).toBeFocused();
  await expect(page.getByText('Times shown for Asia/Kolkata')).toBeVisible();
  await expect(page.locator('.readout-temp')).toHaveText('29°C');
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
  await expect(page.locator('.readout-temp')).toHaveText('29°C');

  await page.waitForTimeout(2000); // let the delayed London response arrive (real time)
  await expect(page.getByRole('heading', { name: /Weather for Chennai/ })).toBeVisible();
  await expect(page.locator('.readout-temp')).toHaveText('29°C');
  await expect(page.getByText('11°C')).toHaveCount(0);
  expect(h.unmatched).toEqual([]);
});

test('no location prompt before the button; denied permission leaves search usable', async ({ page, context, browserName }) => {
  // Firefox cannot emulate a denied prompt; the guard-timeout path is unit-tested instead.
  test.skip(browserName === 'firefox', 'Firefox has no scriptable permission denial');
  await context.clearPermissions();
  const h = await setUp(page, { referenceNow: NOW, handlers: baseHandlers() });
  await page.goto('/');
  expect(h.providerRequests).toHaveLength(0);

  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('alert')).toContainText('Location access is off for this site');
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeEnabled();

  await choose(page, 'London', /London, England/);
  await expect(page.locator('.readout-temp')).toHaveText('11°C');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expectClean(h);
});

const isPlaceName = (u: URL) => u.hostname === 'api.bigdatacloud.net';
const ST_LOUIS_FORECAST = { match: isForecastAt('38.63', '-90.20'), body: syntheticForecast({ start: START, timezone: 'America/Chicago', current: { time: NOW } }) };
const ST_LOUIS_NAME = {
  lookupSource: 'coordinates',
  city: 'St. Louis',
  locality: 'Downtown',
  principalSubdivision: 'Missouri',
  countryName: 'United States of America',
  postcode: '63103',
};

async function locate(page: Page, context: import('@playwright/test').BrowserContext, handlers: Handler[]) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 38.627274, longitude: -90.197889 });
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location' }).click();
  return h;
}

test('device location is named from rounded coordinates, and only rounded coordinates leave the browser', async ({ page, context }) => {
  const h = await locate(page, context, [ST_LOUIS_FORECAST, { match: isPlaceName, body: ST_LOUIS_NAME }]);
  await expect(page.getByRole('heading', { name: 'Weather for St. Louis, Missouri, United States of America' })).toBeVisible();
  await expect(page.locator('.readout-city')).toHaveText('St. Louis');
  await expect(page.locator('.location-kind')).toHaveText('Approximate location');
  await expect(page.getByText('Based on your approximate location')).toBeVisible();
  // The fallback label never flashes: the name is known before the readout renders.
  await expect(page.getByText('Current area')).toHaveCount(0);

  const [request] = forecastRequests(h.providerRequests);
  expect(request?.searchParams.get('latitude')).toBe('38.63');
  expect(request?.searchParams.get('longitude')).toBe('-90.20');
  const lookups = h.providerRequests.filter(isPlaceName);
  expect(lookups).toHaveLength(1);
  expect(lookups[0]?.pathname).toBe('/data/reverse-geocode-client');
  expect(lookups[0]?.searchParams.get('latitude')).toBe('38.63');
  expect(lookups[0]?.searchParams.get('longitude')).toBe('-90.20');
  for (const url of h.providerRequests) expect(url.toString()).not.toContain('38.627');
  expectClean(h);

  // The name is kept with a remembered place: a reload does not look it up again.
  await page.getByText('Preferences and saved data').click();
  await page.getByLabel('Remember this location on this device').check();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Weather for St\. Louis/ })).toBeVisible();
  expect(h.providerRequests.filter(isPlaceName)).toHaveLength(1);
});

for (const [why, handler] of [
  ['the lookup fails', { match: isPlaceName, status: 500, body: {} }],
  ['the lookup is rate limited', { match: isPlaceName, status: 429, body: {} }],
  ['the name was guessed from the IP address', { match: isPlaceName, body: { ...ST_LOUIS_NAME, lookupSource: 'ipGeolocation' } }],
  ['the payload has no usable name', { match: isPlaceName, body: { lookupSource: 'coordinates', city: '', locality: '' } }],
  ['the payload is not the expected shape', { match: isPlaceName, body: ['<script>alert(1)</script>'] }],
] as const) {
  test(`device location falls back to Current area when ${why}`, async ({ page, context }) => {
    const h = await locate(page, context, [ST_LOUIS_FORECAST, handler]);
    await expect(page.getByRole('heading', { name: 'Weather for Current area' })).toBeVisible();
    await expect(page.locator('.readout-temp')).not.toHaveText('—');
    expect(h.providerRequests.filter(isPlaceName)).toHaveLength(1);
    expect(forecastRequests(h.providerRequests)).toHaveLength(1);
    expect(h.cspViolations).toEqual([]);
  });
}

test('a slow name lookup never holds the forecast back for long', async ({ page, context }) => {
  const h = await locate(page, context, [ST_LOUIS_FORECAST, { match: isPlaceName, body: ST_LOUIS_NAME, delayMs: 60_000 }]);
  await expect(page.getByRole('button', { name: 'Finding your location…' })).toBeVisible();
  await page.clock.runFor(2100);
  await expect(page.getByRole('heading', { name: 'Weather for Current area' })).toBeVisible();
  expect(forecastRequests(h.providerRequests)).toHaveLength(1);
});

test('searched places and shortcut cards never call the name lookup', async ({ page }) => {
  const h = await setUp(page, { referenceNow: NOW, handlers: baseHandlers() });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect(page.getByRole('heading', { name: /Weather for London/ })).toBeVisible();
  expect(h.providerRequests.filter(isPlaceName)).toHaveLength(0);
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
  await expect(page.locator('.readout-condition')).toContainText('Conditions unavailable');
  await expect(page.locator('.readout-temp')).toHaveText(/Temperature unavailable/);
  await expect(now.getByRole('definition').nth(0)).toHaveText('Unavailable'); // wind
  await expect(page.locator('.weather').getByText('0°C')).toHaveCount(0);
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
  await expect(page.locator('.readout-temp')).toHaveText('11°C');
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
  await expect(page.locator('.readout-temp')).toHaveText('11°C');
  await page.reload();
  await choose(page, 'London', /London, England/);
  await expect(page.locator('.readout-temp')).toHaveText('11°C');
  expect(forecastRequests(h.providerRequests)).toHaveLength(1);
});

test('a failed refresh keeps the forecast; after an hour it is marked stale', async ({ page }) => {
  const handlers = baseHandlers();
  const h = await setUp(page, { referenceNow: NOW, handlers });
  await page.goto('/');
  await choose(page, 'London', /London, England/);
  await expect(page.locator('.readout-temp')).toHaveText('11°C');

  handlers.unshift({ match: isForecastAt('51.51', '-0.13'), status: 503, body: {} });
  await page.clock.fastForward('16:00');
  await page.clock.runFor(61_000); // minute check → refresh → retry → fail
  await expect(page.getByText(/Couldn't refresh\. Forecast retrieved at/)).toBeVisible();
  await expect(page.locator('.readout-temp')).toHaveText('11°C');

  await page.clock.fastForward('45:00');
  await page.clock.runFor(61_000);
  await expect(page.getByText(/Showing an earlier forecast retrieved at .*Suggestions are paused until it refreshes\./)).toBeVisible();
  expect(forecastRequests(h.providerRequests).length).toBeGreaterThan(1);
});
