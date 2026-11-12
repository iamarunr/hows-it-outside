import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * E2E harness (spec 06-TEST-PLAN, "Clock and network control"):
 * - installs Playwright's clock at the fixture's referenceNow before navigation;
 * - answers Open-Meteo requests from fixtures; any unmatched provider request fails the test;
 * - records CSP violations reported by the browser.
 * Nothing here exists in the production bundle.
 */

export type Fixture = { _fixture: { referenceNow: number; synthetic: true } } & Record<string, unknown>;

export function loadFixture(relativePath: string): Fixture {
  const url = new URL(`../../fixtures/${relativePath}`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as Fixture;
}

export type Handler = { match: (url: URL) => boolean; body: unknown; status?: number; headers?: Record<string, string> };

export type Harness = {
  providerRequests: URL[];
  unmatched: URL[];
  cspViolations: string[];
};

const PROVIDER_ORIGINS = ['https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com'];

export async function setUp(page: Page, opts: { referenceNow: number; handlers: Handler[] }): Promise<Harness> {
  const harness: Harness = { providerRequests: [], unmatched: [], cspViolations: [] };

  // Install slightly before referenceNow, then pause exactly at it: time only moves when a test
  // advances it (clock.runFor / fastForward), so tier and expiry tests are deterministic.
  await page.clock.install({ time: opts.referenceNow * 1000 - 1000 });
  await page.clock.pauseAt(opts.referenceNow * 1000);

  page.on('console', (msg) => {
    const text = msg.text();
    if (/Content[- ]Security[- ]Policy|violates the following|Refused to/i.test(text)) harness.cspViolations.push(text);
  });

  for (const origin of PROVIDER_ORIGINS) {
    await page.route(`${origin}/**`, async (route) => {
      const url = new URL(route.request().url());
      harness.providerRequests.push(url);
      const handler = opts.handlers.find((h) => h.match(url));
      if (handler === undefined) {
        harness.unmatched.push(url);
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: handler.status ?? 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*', ...handler.headers },
        body: JSON.stringify(handler.body),
      });
    });
  }
  return harness;
}

export function expectClean(harness: Harness): void {
  expect(harness.unmatched.map(String), 'unmatched provider requests').toEqual([]);
  expect(harness.cspViolations, 'CSP violations').toEqual([]);
}
