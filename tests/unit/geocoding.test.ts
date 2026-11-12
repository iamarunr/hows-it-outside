import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildGeocodingUrl, createGeocodingCache, normalizeQuery, parseGeocodingResponse, shouldAutoSearch } from '../../src/services/geocoding';
import { FetchJsonError } from '../../src/services/fetchJson';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('../fixtures/geocoding/st-louis.json', import.meta.url), 'utf8'),
);

describe('search query rules', () => {
  it('auto-searches from two code points, including CJK names', () => {
    expect(shouldAutoSearch('Å')).toBe(false);
    expect(shouldAutoSearch('北京')).toBe(true);
    expect(shouldAutoSearch('Ur')).toBe(true);
  });

  it('trims and limits to 120 code points', () => {
    expect(normalizeQuery('  Paris  ')).toBe('Paris');
    expect(Array.from(normalizeQuery('東'.repeat(200)))).toHaveLength(120);
  });

  it('encodes untrusted text with URLSearchParams on the fixed origin', () => {
    const url = buildGeocodingUrl('a&b=c#d');
    expect(url.origin).toBe('https://geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('a&b=c#d');
    expect(url.searchParams.get('count')).toBe('8');
  });
});

describe('geocoding response parsing', () => {
  it('labels results and rounds coordinates', () => {
    const results = parseGeocodingResponse(fixture);
    expect(results.map((r) => r.label)).toEqual([
      'St. Louis, Missouri, United States',
      'St. Louis, Michigan, United States',
    ]);
    expect(results[0]).toMatchObject({ latitude: 38.63, longitude: -90.2, timezone: 'America/Chicago' });
  });

  it('treats a missing results array as empty, not an error', () => {
    expect(parseGeocodingResponse({ generationtime_ms: 1 })).toEqual([]);
  });

  it('omits missing label parts and drops invalid or duplicate entries', () => {
    const results = parseGeocodingResponse({
      results: [
        { id: 1, name: 'Nowhere', latitude: 0, longitude: 0 },
        { id: 1, name: 'Duplicate', latitude: 1, longitude: 1 },
        { id: 2, name: 'Bad', latitude: 91, longitude: 0 },
        { id: 3, name: '', latitude: 1, longitude: 1 },
        'junk',
      ],
    });
    expect(results).toEqual([{ id: 1, name: 'Nowhere', label: 'Nowhere', latitude: 0, longitude: 0 }]);
  });

  it('rejects a non-object payload as invalid_response', () => {
    expect(() => parseGeocodingResponse('nope')).toThrow(FetchJsonError);
  });
});

describe('geocoding memory cache', () => {
  it('matches case-insensitively, expires at 24 h and keeps 50 entries', () => {
    let now = 1_000_000;
    const cache = createGeocodingCache(() => now);
    cache.put('Paris', []);
    expect(cache.get('paris')).toEqual([]);
    now += 24 * 3600 - 1;
    expect(cache.get('PARIS')).toEqual([]);
    now += 1;
    expect(cache.get('Paris')).toBeNull();
    for (let i = 0; i < 51; i++) cache.put(`q${i}`, []);
    expect(cache.get('q0')).toBeNull();
    expect(cache.get('q50')).toEqual([]);
  });
});
