import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

/** The sky hero, landscape strip and shortcut cards across phone, tablet, laptop and ultrawide sizes. */
const NOW = 1794729600; // 2026-11-15T08:00Z (synthetic)
const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');
const isSearch = (u: URL) => u.pathname === '/v1/search';
const isForecast = (u: URL) => u.pathname === '/v1/forecast';

test.use({ locale: 'en-GB' });

function open(page: Page) {
  return setUp(page, {
    referenceNow: NOW,
    handlers: [
      { match: isSearch, body: { results: [LONDON] } },
      { match: isForecast, body: syntheticForecast({ start: NOW - 8 * 3600, timezone: 'Europe/London', current: { time: NOW }, hourly: () => ({}) }) },
    ],
  });
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The sun or moon and the hills must stay inside the strip, clear of every piece of hero text. */
async function expectSceneClearOfText(page: Page) {
  const boxes = await page.evaluate(() => {
    const rect = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();
    const inner = rect('.sky-hero .hero-inner');
    const scene = rect('.sky-hero .scene');
    const body = document.querySelector<HTMLElement>('.sky-hero .scene-body');
    const shown = body !== null && getComputedStyle(body).display !== 'none';
    return { innerBottom: inner?.bottom ?? 0, sceneTop: scene?.top ?? 0, sceneHeight: scene?.height ?? 0, bodyTop: shown ? (body?.getBoundingClientRect().top ?? null) : null };
  });
  expect(boxes.sceneHeight).toBeGreaterThanOrEqual(80);
  expect(boxes.sceneTop).toBeGreaterThanOrEqual(boxes.innerBottom - 1);
  if (boxes.bodyTop !== null) expect(boxes.bodyTop).toBeGreaterThanOrEqual(boxes.innerBottom - 1);
}

const SIZES = [
  [320, 568],
  [375, 667],
  [414, 896],
  [740, 360], // phone, landscape
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1920, 1080],
  [2560, 1440],
] as const;

for (const [width, height] of SIZES) {
  test(`${width}×${height}: first screen and results fit without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const h = await open(page);
    await page.goto('/');

    // First screen.
    const title = page.getByRole('heading', { level: 1, name: /How.s it outside/ });
    await expect(title).toBeVisible();
    const cards = page.getByRole('list', { name: 'Places to try' }).getByRole('button');
    await expect(cards).toHaveCount(3);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    const titleBox = await title.boundingBox();
    expect(titleBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual(width);
    for (const control of [page.getByRole('button', { name: 'Use my location' }), page.getByRole('button', { name: 'Search', exact: true }), page.getByLabel('Search city or place')]) {
      const box = await control.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
    }
    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await expectSceneClearOfText(page);

    // Results, reached from a card: no search request, one forecast.
    await cards.first().scrollIntoViewIfNeeded();
    await cards.first().click();
    await expect(page.getByRole('heading', { name: /Weather for London/ })).toBeFocused();
    await expect(page.getByRole('heading', { level: 3, name: /time outdoors/ })).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expectSceneClearOfText(page);
    expect(h.providerRequests.filter(isSearch)).toHaveLength(0);
    expect(h.providerRequests.filter(isForecast)).toHaveLength(1);
    expectClean(h);
  });
}

test('each card shows its own local time and a sky for the daylight there', async ({ page }) => {
  const h = await open(page);
  await page.goto('/');
  const list = page.getByRole('list', { name: 'Places to try' });
  // 08:00 UTC on 15 November: morning in London, early afternoon in Chennai, evening in Sydney.
  await expect(list.getByRole('button', { name: /London.*United Kingdom.*Local time 8:00 AM/ })).toHaveAttribute('data-sky', /clear|dawn/);
  await expect(list.getByRole('button', { name: /Chennai.*India.*Local time 1:30 PM/ })).toHaveAttribute('data-sky', 'clear');
  await expect(list.getByRole('button', { name: /Sydney.*Australia.*Local time 7:00 PM/ })).toHaveAttribute('data-sky', /dusk|night-clear/);
  expect(h.providerRequests).toHaveLength(0);
  expectClean(h);
});

test('the scene is decorative: hidden from assistive technology and still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.goto('/');
  await expect(page.locator('.sky-hero .scene')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.sky-hero .sky-extras')).toHaveAttribute('aria-hidden', 'true');
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});
