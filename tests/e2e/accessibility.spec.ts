import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectClean, setUp } from './support/harness';
import { place, syntheticForecast } from './support/forecast';

/**
 * Automated accessibility evidence (spec 06-TEST-PLAN). axe finds a subset of
 * issues only; this is not a conformance claim. Keyboard and screen-reader
 * checks remain manual.
 */
const NOW = 1794729600;
const LONDON = place(2643743, 'London', 'England', 'United Kingdom', 51.50853, -0.12574, 'Europe/London');
const FORECAST = syntheticForecast({
  start: NOW - 8 * 3600,
  timezone: 'Europe/London',
  current: { time: NOW },
  hourly: (i) => ({
    weather_code: i === 12 ? 95 : i >= 9 && i <= 10 ? 61 : 2,
    precipitation_probability: i >= 9 && i <= 10 ? 60 : 5,
    is_day: i >= 7 && i <= 16 ? 1 : 0,
  }),
});

test.use({ locale: 'en-GB' });

async function loaded(page: Page) {
  const h = await setUp(page, {
    referenceNow: NOW,
    handlers: [
      { match: (u) => u.pathname === '/v1/search', body: { results: [LONDON] } },
      { match: (u) => u.pathname === '/v1/forecast', body: FORECAST },
    ],
  });
  await page.goto('/');
  const input = page.getByLabel('Search city or place');
  await input.fill('London');
  await input.press('Enter');
  await page.getByRole('button', { name: /London, England/ }).click();
  await page.locator('.summary').waitFor();
  return h;
}

async function axe(page: Page) {
  // axe relies on timers; the harness pauses the page clock, so let it run.
  await page.clock.resume().catch(() => undefined);
  // Measure contrast at rest: let one-shot arrival animations (cards, numbers, verdict) finish first.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      // Keyframe animations only: Firefox leaves a zero-progress colour transition 'running' under forced colours.
      .every((a) => !('animationName' in a) || a.timeline !== document.timeline || a.effect?.getComputedTiming().iterations === Infinity || a.playState !== 'running'),
  );
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map(
    (v) =>
      `${v.impact ?? 'unknown'} ${v.id}: ${v.nodes.length} node(s) — ${v.help} [${v.nodes
        .slice(0, 4)
        .map((n) => `${n.target.join(' ')} ${n.any[0]?.message ?? ''}`)
        .join(' | ')}]`,
  );
}

test('home before a place is chosen has no axe violations', async ({ page }) => {
  await setUp(page, { referenceNow: NOW, handlers: [] });
  await page.goto('/');
  expect(await axe(page)).toEqual([]);
});

test('loaded results, open preferences and hour details have no axe violations', async ({ page }) => {
  const h = await loaded(page);
  await page.getByText('Preferences and saved data').click();
  expect(await axe(page)).toEqual([]);
  expectClean(h);
});

for (const path of ['/about/', '/methodology/', '/privacy/', '/no-such-page/']) {
  test(`${path} has no axe violations and one H1`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await axe(page)).toEqual([]);
  });
}

test('forced colors: still no axe violations and selected states remain distinguishable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loaded(page);
  expect(await axe(page)).toEqual([]);
  await expect(page.getByRole('radio', { name: 'Outdoors' })).toBeChecked();
});

for (const width of [320, 640]) {
  // 320 CSS px ≈ 400% zoom of 1280 px; 640 CSS px ≈ 200%.
  test(`reflow at ${width} px: no horizontal page scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await loaded(page);
    await page.getByText('Preferences and saved data').click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole('heading', { name: /Weather for London, England, United Kingdom/ })).toBeVisible();
  });
}

test('interactive targets are at least 24×24 px (WCAG 2.2 minimum; 44 px preferred)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await loaded(page);
  await page.getByText('Preferences and saved data').click();
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a, input, select, summary, .segmented-option > span')]
      .filter((el) => el.offsetParent !== null && !(el instanceof HTMLInputElement && el.type === 'radio'))
      .map((el) => ({ el: `${el.tagName.toLowerCase()} ${(el.textContent ?? '').trim().slice(0, 30)}`, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 24 || r.height < 24)
      .map(({ el, r }) => `${el} ${Math.round(r.width)}×${Math.round(r.height)}`),
  );
  expect(small).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('home explains the need for JavaScript and links to readable pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Outside? needs JavaScript to load weather for your location.')).toBeVisible();
    await expect(page.getByLabel('Search city or place')).toBeHidden();
    await page.getByRole('link', { name: 'How it works' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'How Outside? works' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '8 to 25 °C' })).toBeVisible();
    await page.goto('/privacy/');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  });
});

test.describe('offline and storage', () => {
  test('going offline shows a notice and keeps loaded weather', async ({ page, context }) => {
    await loaded(page);
    await context.setOffline(true);
    await expect(page.getByText("You're offline. Previously loaded weather may be out of date.")).toBeVisible();
    await expect(page.locator('.summary')).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText("You're offline.")).toHaveCount(0);
  });

  test('blocked storage keeps the app usable and says settings will not be saved', async ({ page }) => {
    await page.addInitScript(() => {
      const deny = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Object.defineProperty(window, 'localStorage', { get: deny });
      Object.defineProperty(window, 'sessionStorage', { get: deny });
    });
    await loaded(page);
    await page.getByRole('radio', { name: 'Bike' }).check();
    await page.getByText('Preferences and saved data').click();
    await expect(page.getByText(/isn't allowing storage, so settings last only until you close the page/)).toBeVisible();
  });

  test('corrupted saved settings reset with a notice instead of breaking', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('outside:settings', '{broken'));
    await setUp(page, { referenceNow: NOW, handlers: [] });
    await page.goto('/');
    await expect(page.getByText("Your saved settings couldn't be read, so the default settings are in use.")).toBeVisible();
    await expect(page.getByLabel('Search city or place')).toBeVisible();
  });
});
