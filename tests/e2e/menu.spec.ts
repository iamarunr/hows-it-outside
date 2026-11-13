import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp } from './support/harness';
import { syntheticForecast } from './support/forecast';

/** The menu sits on the sky at the top of the page and turns solid navy once the page scrolls. */
const NOW = Date.parse('2026-11-15T12:00:00Z') / 1000;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const NAVY = 'rgb(35, 54, 81)';
/** Scrolled: frosted brand navy (80% strength with a backdrop blur) where the browser supports it, else solid. */
const FROSTED = /^(rgb\(35, 54, 81\)|rgba\(35, 54, 81, 0\.8\)|color\(srgb 0\.137\d* 0\.211\d* 0\.317\d* \/ 0\.8\))$/;
const WHITE = 'rgb(255, 255, 255)';

test.use({ locale: 'en-GB', timezoneId: 'UTC' });

const header = (page: Page) => page.locator('.site-header');
const headerStyle = (page: Page) =>
  header(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color, position: s.position };
  });
const heroInk = (page: Page) => page.locator('.sky-hero').evaluate((el) => getComputedStyle(el).color);

function open(page: Page, code: number) {
  return setUp(page, {
    referenceNow: NOW,
    handlers: [
      {
        match: (u) => u.pathname === '/v1/forecast',
        body: syntheticForecast({ start: NOW - 8 * 3600, timezone: 'Europe/London', current: { time: NOW, weather_code: code }, hourly: () => ({ weather_code: code, is_day: 1 }) }),
      },
    ],
  });
}

test('at the top the menu is transparent, takes the sky ink, and the sky runs behind it', async ({ page }) => {
  const h = await open(page, 61);
  await page.goto('/');
  await page.getByRole('list', { name: 'Places to try' }).waitFor();

  // Midday, no place chosen: clear sky, dark ink.
  await expect.poll(async () => (await headerStyle(page)).background).toBe(TRANSPARENT);
  expect((await headerStyle(page)).color).toBe(await heroInk(page));
  const [heroBox, headerBox] = [await page.locator('.sky-hero').boundingBox(), await header(page).boundingBox()];
  expect(heroBox?.y).toBe(0);
  expect(headerBox?.y).toBe(0);
  // The first line of hero content starts below the menu.
  const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox();
  expect(titleBox?.y ?? 0).toBeGreaterThanOrEqual((headerBox?.height ?? 0) - 1);

  // Rain: white ink on the sky, so the menu turns white with it.
  await page.getByRole('list', { name: 'Places to try' }).getByRole('button').first().click();
  await expect(page.locator('.sky-hero')).toHaveAttribute('data-sky', 'rain');
  await expect.poll(async () => (await headerStyle(page)).color).toBe(WHITE);
  // Clicking the card may have scrolled the page; the app returns to the top and the bar clears again.
  await expect.poll(async () => (await headerStyle(page)).background).toBe(TRANSPARENT);
  expectClean(h);
});

test('once the page scrolls the menu turns solid navy and stays reachable; back at the top it clears again', async ({ page }) => {
  await open(page, 2);
  await page.goto('/');
  await page.getByRole('list', { name: 'Places to try' }).getByRole('button').first().click();
  await page.locator('.summary').waitFor();

  await page.mouse.wheel(0, 600);
  await expect.poll(async () => (await headerStyle(page)).background).toMatch(FROSTED);
  expect(await headerStyle(page)).toMatchObject({ color: WHITE, position: 'sticky' });
  expect((await header(page).boundingBox())?.y).toBe(0);
  await expect(page.getByRole('link', { name: 'How it works' }).first()).toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await headerStyle(page)).background).toBe(TRANSPARENT);
});

test('pages without a sky keep the solid menu', async ({ page }) => {
  await open(page, 2);
  await page.goto('/about/');
  expect(await headerStyle(page)).toMatchObject({ background: NAVY, color: WHITE });
});

test('without JavaScript the menu is solid, not sticky, and the page is not covered', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  expect(await headerStyle(page)).toMatchObject({ background: NAVY, color: WHITE, position: 'static' });
  await context.close();
});

for (const width of [320, 360, 768, 1440]) {
  test(`${width}px: the menu stays on one row`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, 2);
    await page.goto('/');
    const box = await header(page).boundingBox();
    expect(box?.height ?? 0).toBeLessThanOrEqual(63);
    for (const link of await header(page).getByRole('link').all()) {
      const b = await link.boundingBox();
      expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect((b?.x ?? 0) + (b?.width ?? 0)).toBeLessThanOrEqual(width);
    }
  });
}

test('the menu is transparent from the first frame on the home page: no fade from navy while loading', async ({ page }) => {
  // Sample the bar's background on every frame from the moment it exists until well after load.
  await page.addInitScript(() => {
    const samples: string[] = [];
    (window as unknown as { __menuSamples: string[] }).__menuSamples = samples;
    const started = performance.now();
    const tick = () => {
      const el = document.querySelector('.site-header');
      if (el !== null && document.querySelector('.sky-hero') !== null) samples.push(getComputedStyle(el).backgroundColor);
      if (performance.now() - started < 1500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/');
  await page.getByRole('list', { name: 'Places to try' }).waitFor();
  await page.waitForFunction(() => document.documentElement.classList.contains('ready'));
  await page.waitForTimeout(600);
  const samples = await page.evaluate(() => (window as unknown as { __menuSamples: string[] }).__menuSamples);
  expect(samples.length).toBeGreaterThan(5);
  expect([...new Set(samples)]).toEqual([TRANSPARENT]);
});

test('the menu state follows the page position however it got there (no stuck navy bar at the top)', async ({ page }) => {
  // Found in Firefox: a jump back to the top did not always fire the scroll event the bar used to rely on.
  await page.setViewportSize({ width: 1280, height: 500 });
  await open(page, 2);
  await page.goto('/');
  const card = page.getByRole('list', { name: 'Places to try' }).getByRole('button').last();
  await card.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await headerStyle(page)).background).toMatch(FROSTED);
  await card.click();
  await page.locator('.summary').waitFor();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(async () => (await headerStyle(page)).background).toBe(TRANSPARENT);
  await expect(page.locator('html')).not.toHaveClass(/scrolled/);
});

test('scrolled, the menu is a frosted layer; with reduced transparency it is solid', async ({ page, browserName }) => {
  await open(page, 2);
  await page.goto('/about/');
  await page.setViewportSize({ width: 800, height: 400 });
  await page.mouse.wheel(0, 300);
  await expect(page.locator('html')).toHaveClass(/scrolled/);
  const frost = () =>
    header(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, blur: s.backdropFilter ?? (s as unknown as Record<string, string>)['webkitBackdropFilter'] ?? 'none' };
    });
  const frosted = await frost();
  expect(frosted.background).toMatch(FROSTED);
  expect(frosted.background).not.toBe(NAVY);
  expect(frosted.blur).toContain('blur(18px)');
  // Chromium is the only engine here that can emulate the reduced-transparency preference.
  test.skip(browserName !== 'chromium', 'prefers-reduced-transparency emulation needs Chromium');
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await expect.poll(async () => (await frost()).background).toBe(NAVY);
  expect((await frost()).blur).toBe('none');
});

test('controls respond on press and carry no tap delay', async ({ page }) => {
  await open(page, 2);
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Use my location' });
  expect(await button.evaluate((el) => getComputedStyle(el).touchAction)).toBe('manipulation');
  const box = await button.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);
  await page.mouse.down();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).scale)).toBe('0.96');
  // Released off the button: nothing is triggered and it springs back.
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).scale)).toBe('none');
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeEnabled();
});
