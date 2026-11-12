import { describe, expect, it, vi } from 'vitest';
import { buildPlaceNameUrl, lookupPlaceName, parsePlaceName, PLACE_NAME_TIMEOUT_MS } from '../../src/services/reverseGeocoding';

const OK = { lookupSource: 'coordinates', city: 'St. Louis', locality: 'Downtown', principalSubdivision: 'Missouri', countryName: 'United States of America' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('buildPlaceNameUrl', () => {
  it('sends only two-decimal coordinates and the language, to the fixed endpoint', () => {
    const url = buildPlaceNameUrl({ latitude: 38.63, longitude: -90.2 });
    expect(url.origin + url.pathname).toBe('https://api.bigdatacloud.net/data/reverse-geocode-client');
    expect(Object.fromEntries(url.searchParams)).toEqual({ latitude: '38.63', longitude: '-90.20', localityLanguage: 'en' });
  });
  it('keeps a zero coordinate (never treated as missing)', () => {
    const url = buildPlaceNameUrl({ latitude: 0, longitude: 0 });
    expect(url.searchParams.get('latitude')).toBe('0.00');
    expect(url.searchParams.get('longitude')).toBe('0.00');
  });
});

describe('parsePlaceName', () => {
  it('joins city, region and country', () => {
    expect(parsePlaceName(OK)).toBe('St. Louis, Missouri, United States of America');
  });
  it('falls back to the locality when there is no city', () => {
    expect(parsePlaceName({ lookupSource: 'coordinates', city: '', locality: 'Polynesian Triangle', principalSubdivision: '', countryName: '' })).toBe('Polynesian Triangle');
  });
  it('does not repeat a part (city-states)', () => {
    expect(parsePlaceName({ lookupSource: 'coordinates', city: 'Singapore', principalSubdivision: 'Singapore', countryName: 'Singapore' })).toBe('Singapore');
  });
  it('rejects a name the provider guessed from the IP address', () => {
    expect(parsePlaceName({ ...OK, lookupSource: 'ipGeolocation' })).toBeNull();
    expect(parsePlaceName({ city: 'St. Louis' })).toBeNull();
  });
  it('returns null when nothing usable is present or the shape is wrong', () => {
    for (const payload of [null, 'x', [], {}, { lookupSource: 'coordinates' }, { lookupSource: 'coordinates', city: '  ', locality: '' }, { lookupSource: 'coordinates', city: 42 }]) {
      expect(parsePlaceName(payload)).toBeNull();
    }
  });
  it('strips commas and control characters, and drops over-long parts', () => {
    expect(parsePlaceName({ lookupSource: 'coordinates', city: 'A,\u0000 B\n C', principalSubdivision: 'x'.repeat(61), countryName: ' Peru ' })).toBe('A B C, Peru');
    expect(parsePlaceName({ lookupSource: 'coordinates', city: 'y'.repeat(61) })).toBeNull();
  });
});

describe('lookupPlaceName', () => {
  const coords = { latitude: 38.63, longitude: -90.2 };
  it('returns the parsed name', async () => {
    const fetchImpl = vi.fn(async () => json(OK));
    expect(await lookupPlaceName(coords, undefined, fetchImpl)).toBe('St. Louis, Missouri, United States of America');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each([500, 429, 402, 404])('resolves to null on HTTP %s without retrying', async (status) => {
    const fetchImpl = vi.fn(async () => json({}, status));
    expect(await lookupPlaceName(coords, undefined, fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('resolves to null on a network error, without retrying', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('network');
    });
    expect(await lookupPlaceName(coords, undefined, fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('resolves to null when aborted', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    const pending = lookupPlaceName(coords, controller.signal, fetchImpl);
    controller.abort();
    expect(await pending).toBeNull();
  });
  it('gives up after the timeout', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
      const pending = lookupPlaceName(coords, undefined, fetchImpl);
      await vi.advanceTimersByTimeAsync(PLACE_NAME_TIMEOUT_MS + 10);
      expect(await pending).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
