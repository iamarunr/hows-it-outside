import { expect, test } from '@playwright/test';
import { expectClean, loadFixture, setUp } from './support/harness';

const stLouis = loadFixture('geocoding/st-louis.json');

test('search lists same-name places and selects one, with controlled clock and no prompt', async ({ page }) => {
  const harness = await setUp(page, {
    referenceNow: stLouis._fixture.referenceNow,
    handlers: [{ match: (u) => u.pathname === '/v1/search' && u.searchParams.get('name') === 'St. Louis', body: stLouis }],
  });

  // Fail if anything asks for geolocation before a deliberate action.
  let geolocationRequested = false;
  await page.exposeFunction('__geoRequested', () => {
    geolocationRequested = true;
  });

  await page.addInitScript(() => {
    const geo = navigator.geolocation as Geolocation | undefined;
    if (geo === undefined) return;
    const notify = (): void => void (window as unknown as { __geoRequested: () => void }).__geoRequested();
    geo.getCurrentPosition = () => notify();
    geo.watchPosition = () => {
      notify();
      return 0;
    };
  });

  await page.goto('/');
  expect(await page.evaluate(() => Date.now())).toBe(stLouis._fixture.referenceNow * 1000);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText("How's it outside?");
  await page.getByLabel('Search city or place').fill('St. Louis');
  await page.clock.runFor(350); // debounce

  const results = page.getByRole('list', { name: 'Matching places' });
  await expect(results.getByRole('button')).toHaveText([
    'St. Louis, Missouri, United States',
    'St. Louis, Michigan, United States',
  ]);
  await expect(page.getByRole('status')).toHaveText('2 places found.');

  await results.getByRole('button', { name: 'St. Louis, Missouri, United States' }).click();
  const heading = page.getByRole('heading', { level: 2, name: 'St. Louis, Missouri, United States' });
  await expect(heading).toBeFocused();
  await expect(page.getByText('Time zone: America/Chicago')).toBeVisible();

  expect(harness.providerRequests).toHaveLength(1);
  const request = harness.providerRequests[0];
  expect(request?.searchParams.get('count')).toBe('8');
  expect(request?.searchParams.get('language')).toBe('en');
  expect(geolocationRequested).toBe(false);
  await expect(page.getByText('Weather data by')).toBeVisible();
  expectClean(harness);
});

test('a one-character query does not auto-search but Enter submits it', async ({ page }) => {
  const harness = await setUp(page, {
    referenceNow: stLouis._fixture.referenceNow,
    handlers: [{ match: (u) => u.searchParams.get('name') === 'Å', body: { results: [] } }],
  });
  await page.goto('/');
  const input = page.getByLabel('Search city or place');
  await input.fill('Å');
  await page.clock.runFor(1000);
  expect(harness.providerRequests).toHaveLength(0);
  await input.press('Enter');
  await expect(page.getByRole('status')).toHaveText('No places found. Try the full name or add the country.');
  expect(harness.providerRequests).toHaveLength(1);
  expectClean(harness);
});
