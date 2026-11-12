import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp, type Handler } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

/** Pinned places: a regular visitor's own shortcuts replace the example cards on the first screen. */
const NOW = 1794729600; // 2026-11-15T08:00Z (synthetic)
const START = NOW - 8 * 3600;
const PLACES = [
  place(4407066, 'St. Louis', 'Missouri', 'United States', 38.62727, -90.19789, 'America/Chicago'),
  place(1264527, 'Chennai', 'Tamil Nadu', 'India', 13.08784, 80.27847, 'Asia/Kolkata'),
  place(3133880, 'Trondheim', 'Trøndelag', 'Norway', 63.43049, 10.39506, 'Europe/Oslo'),
  place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London'),
];
const isSearch = (u: URL) => u.pathname === '/v1/search';
const isForecast = (u: URL) => u.pathname === '/v1/forecast';

test.use({ locale: 'en-US' });

function handlers(): Handler[] {
  return [
    ...PLACES.map((p) => ({ match: (u: URL) => isSearch(u) && u.searchParams.get('name') === p.name, body: { results: [p] } })),
    { match: isForecast, body: syntheticForecast({ start: START, timezone: 'America/Chicago', current: { time: NOW } }) },
  ];
}

async function choose(page: Page, name: string) {
  const input = page.getByLabel('Search city or place');
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Change location' }).click();
  await input.fill(name);
  await input.press('Enter');
  await page.getByRole('list', { name: 'Matching places' }).getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`Weather for ${name.replace('.', '\\.')}`) })).toBeVisible();
}

const pinButton = (page: Page) => page.locator('.pin-toggle');

test('a pinned place replaces the example cards, survives a reload, and opens without searching', async ({ page }) => {
  const h = await setUp(page, { referenceNow: NOW, handlers: handlers() });
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Places to try' }).getByRole('button')).toHaveCount(3);

  await choose(page, 'St. Louis');
  await expect(pinButton(page)).toHaveText('Pin this place');
  await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'false');
  await pinButton(page).click();
  await expect(pinButton(page)).toHaveText('Pinned');
  await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Pinned to your first screen.');

  // Not remembered as the current place, so a reload lands on the first screen with the pin.
  await page.reload();
  const pins = page.getByRole('list', { name: 'Your pinned places' });
  await expect(pins.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Places to try' })).toHaveCount(0);
  await expect(pins.getByRole('button')).toHaveText(/St\. Louis\s*United States\s*Local time 2:00 AM/);

  const before = h.providerRequests.length;
  await pins.getByRole('button').click();
  await expect(page.getByRole('heading', { name: /Weather for St\. Louis/ })).toBeFocused();
  await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'true');
  const after = h.providerRequests.slice(before);
  expect(after.filter(isSearch)).toHaveLength(0);
  expect(after.some((u) => u.hostname === 'api.bigdatacloud.net')).toBe(false);
  expectClean(h);
});

test('unpinning the last pin brings the example cards back', async ({ page }) => {
  await setUp(page, { referenceNow: NOW, handlers: handlers() });
  await page.goto('/');
  await choose(page, 'Chennai');
  await pinButton(page).click();
  await pinButton(page).click();
  await expect(pinButton(page)).toHaveText('Pin this place');
  await expect(page.getByRole('status')).toHaveText('Unpinned from your first screen.');
  await page.reload();
  await expect(page.getByRole('list', { name: 'Places to try' }).getByRole('button')).toHaveCount(3);
});

test('three pins at most: a fourth place explains why it cannot be pinned, and unpinning frees a slot', async ({ page }) => {
  await setUp(page, { referenceNow: NOW, handlers: handlers() });
  await page.goto('/');
  for (const name of ['St. Louis', 'Chennai', 'Trondheim']) {
    await choose(page, name);
    await pinButton(page).click();
    await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'true');
  }
  await choose(page, 'London');
  await expect(pinButton(page)).toBeDisabled();
  await expect(pinButton(page)).toHaveAccessibleDescription('You have 3 pinned places. Unpin one to pin this.');

  await choose(page, 'Chennai');
  await pinButton(page).click();
  await choose(page, 'London');
  await expect(pinButton(page)).toBeEnabled();
  await pinButton(page).click();

  await page.reload();
  const names = await page.getByRole('list', { name: 'Your pinned places' }).locator('.postcard-city').allTextContents();
  expect(names).toEqual(['St. Louis', 'Trondheim', 'London']);
});

test('clearing all local data removes the pins', async ({ page }) => {
  await setUp(page, { referenceNow: NOW, handlers: handlers() });
  await page.goto('/');
  await choose(page, 'Trondheim');
  await pinButton(page).click();
  await page.getByText('Preferences and saved data').click();
  await page.getByRole('button', { name: 'Clear all local data' }).click();
  await expect(page.getByRole('list', { name: 'Places to try' }).getByRole('button')).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole('list', { name: 'Your pinned places' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('outside:settings'))).not.toContain('Trondheim');
});

for (const width of [320, 390, 1440]) {
  test(`${width}px: the pin button and three pinned cards fit`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await setUp(page, { referenceNow: NOW, handlers: handlers() });
    await page.goto('/');
    for (const name of ['St. Louis', 'Chennai', 'Trondheim']) {
      await choose(page, name);
      await pinButton(page).click();
    }
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    const box = await pinButton(page).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
    await page.reload();
    await expect(page.getByRole('list', { name: 'Your pinned places' }).getByRole('button')).toHaveCount(3);
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
}
