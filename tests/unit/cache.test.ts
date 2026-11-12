import { describe, expect, it } from 'vitest';
import { currentIsUsable, freshnessTier, recommendationsAllowed } from '../../src/domain/freshness';
import type { Forecast } from '../../src/domain/types';
import { CACHE_STORAGE_KEY, createForecastCache, forecastCacheKey } from '../../src/services/cache';
import { createStore } from '../../src/services/storageAdapter';
import { fakeStorage, makeInterval } from './helpers';

const NOW = 1794736800;

function forecast(locationKey: string, fetchedAt: number): Forecast {
  return {
    schemaVersion: 1,
    provider: 'open-meteo',
    locationKey,
    timezone: 'UTC',
    timezoneFallback: false,
    fetchedAt,
    current: null,
    intervals: [makeInterval(NOW)],
    diagnostics: [],
  };
}

describe('freshness tiers', () => {
  it('uses exact boundaries, each belonging to the later tier', () => {
    expect(freshnessTier(NOW, NOW)).toBe('fresh');
    expect(freshnessTier(NOW, NOW + 899)).toBe('fresh');
    expect(freshnessTier(NOW, NOW + 900)).toBe('due');
    expect(freshnessTier(NOW, NOW + 3599)).toBe('due');
    expect(freshnessTier(NOW, NOW + 3600)).toBe('stale');
    expect(freshnessTier(NOW, NOW + 7199)).toBe('stale');
    expect(freshnessTier(NOW, NOW + 7200)).toBe('expired');
  });

  it('allows recommendations while fresh or due, not stale or expired', () => {
    expect(['fresh', 'due', 'stale', 'expired'].map((t) => recommendationsAllowed(t as never))).toEqual([true, true, false, false]);
  });

  it('hides current conditions over 90 min old or over 10 min in the future', () => {
    expect(currentIsUsable(NOW, NOW + 90 * 60)).toBe('ok');
    expect(currentIsUsable(NOW, NOW + 90 * 60 + 1)).toBe('too_old');
    expect(currentIsUsable(NOW + 600, NOW)).toBe('ok');
    expect(currentIsUsable(NOW + 601, NOW)).toBe('in_future');
  });
});

describe('cache key', () => {
  it('depends on rounded coordinates and request options only', () => {
    const a = forecastCacheKey({ latitude: 38.63, longitude: -90.2 });
    expect(a).toBe(forecastCacheKey({ latitude: 38.63, longitude: -90.2 }));
    expect(a).not.toBe(forecastCacheKey({ latitude: 38.64, longitude: -90.2 }));
    expect(a).toContain('38.63,-90.20');
    expect(a).toContain('wind_speed_unit=kmh');
    expect(a).not.toMatch(/mph|fahrenheit|display/);
  });
});

describe('forecast cache', () => {
  const key = (n: number) => forecastCacheKey({ latitude: n, longitude: n });
  const loc = (n: number) => `${n.toFixed(2)},${n.toFixed(2)}`;

  it('returns a stored entry until the 2-hour expiry boundary', () => {
    const cache = createForecastCache(createStore(() => fakeStorage()));
    cache.put(key(1), forecast(loc(1), NOW));
    expect(cache.get(key(1), loc(1), NOW + 7199)?.fetchedAt).toBe(NOW);
    expect(cache.get(key(1), loc(1), NOW + 7200)).toBeNull();
  });

  it('rejects entries more than 60 s in the future', () => {
    const cache = createForecastCache(createStore(() => fakeStorage()));
    cache.put(key(1), forecast(loc(1), NOW + 61));
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
    cache.put(key(2), forecast(loc(2), NOW + 60));
    expect(cache.get(key(2), loc(2), NOW)).not.toBeNull();
  });

  it('rejects a location-key mismatch', () => {
    const cache = createForecastCache(createStore(() => fakeStorage()));
    cache.put(key(1), forecast(loc(9), NOW));
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
  });

  it('keeps at most five entries, evicting the least recently used', () => {
    const cache = createForecastCache(createStore(() => fakeStorage()));
    for (let i = 1; i <= 5; i++) cache.put(key(i), forecast(loc(i), NOW));
    expect(cache.get(key(1), loc(1), NOW)).not.toBeNull(); // 1 becomes most recent
    cache.put(key(6), forecast(loc(6), NOW)); // evicts 2
    expect(cache.get(key(2), loc(2), NOW)).toBeNull();
    for (const i of [1, 3, 4, 5, 6]) expect(cache.get(key(i), loc(i), NOW), String(i)).not.toBeNull();
  });

  it('ignores corrupted JSON, wrong versions and invalid payloads', () => {
    const storage = fakeStorage();
    const cache = createForecastCache(createStore(() => storage));
    storage.setItem(CACHE_STORAGE_KEY, '{not json');
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
    storage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ version: 2, entries: [] }));
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
    const bad = { ...forecast(loc(1), NOW), intervals: [{ start: 'x' }] };
    storage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ version: 1, entries: [{ key: key(1), fetchedAt: NOW, forecast: bad }] }));
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
    const schema2 = { ...forecast(loc(1), NOW), schemaVersion: 2 };
    storage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ version: 1, entries: [{ key: key(1), fetchedAt: NOW, forecast: schema2 }] }));
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
  });

  it('falls back to memory when storage is disabled or full', () => {
    for (const throwOn of ['all', 'set'] as const) {
      const store = createStore(() => fakeStorage({ throwOn }));
      const cache = createForecastCache(store);
      cache.put(key(1), forecast(loc(1), NOW));
      expect(cache.get(key(1), loc(1), NOW)?.fetchedAt).toBe(NOW);
      expect(store.persistent).toBe(false);
    }
    const unavailable = createStore(() => {
      throw new Error('SecurityError');
    });
    createForecastCache(unavailable).put(key(1), forecast(loc(1), NOW));
    expect(unavailable.persistent).toBe(false);
  });

  it('clear removes everything', () => {
    const storage = fakeStorage();
    const cache = createForecastCache(createStore(() => storage));
    cache.put(key(1), forecast(loc(1), NOW));
    cache.clear();
    expect(storage.getItem(CACHE_STORAGE_KEY)).toBeNull();
    expect(cache.get(key(1), loc(1), NOW)).toBeNull();
  });
});

