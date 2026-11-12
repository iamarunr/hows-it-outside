/**
 * Forecast session cache (spec 02-ARCHITECTURE §6). One sessionStorage item
 * holding at most five entries in LRU order. Entries are re-validated on read;
 * anything invalid is dropped, never trusted.
 */
import * as z from 'zod/mini';
import { EXPIRE_AFTER_SECONDS, MAX_FUTURE_SKEW_SECONDS } from '../domain/freshness';
import type { Forecast } from '../domain/types';
import type { Coordinates } from '../lib/geo';
import type { KeyValueStore } from './storageAdapter';
import { CURRENT_FIELDS, HOURLY_FIELDS, REQUEST_OPTIONS } from './weather/openMeteo';

export const CACHE_STORAGE_KEY = 'outside:forecast-cache';
export const CACHE_VERSION = 1;
export const CACHE_MAX_ENTRIES = 5;

/**
 * Cache key: provider + schema + rounded coordinates + canonical variables +
 * request units/options. Display units are never part of it (ADR-017).
 */
export function forecastCacheKey(coords: Coordinates): string {
  const options = Object.entries(REQUEST_OPTIONS)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return [
    'open-meteo',
    'schema1',
    `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`,
    `h:${HOURLY_FIELDS.join(',')}`,
    `c:${CURRENT_FIELDS.join(',')}`,
    options,
  ].join('|');
}

const num = z.number().check(z.refine(Number.isFinite));
const nullableNum = z.nullable(num);

const intervalSchema = z.object({
  start: z.int(),
  end: z.int(),
  temperatureC: nullableNum,
  feelsLikeC: nullableNum,
  humidityPct: nullableNum,
  windKmh: nullableNum,
  gustKmh: nullableNum,
  precipMm: nullableNum,
  precipProbabilityPct: nullableNum,
  weatherCodes: z.array(z.int()),
  weatherCodeComplete: z.boolean(),
  daylight: z.nullable(z.boolean()),
});

const currentSchema = z.object({
  time: z.int(),
  temperatureC: nullableNum,
  feelsLikeC: nullableNum,
  windKmh: nullableNum,
  gustKmh: nullableNum,
  humidityPct: nullableNum,
  weatherCode: z.nullable(z.int()),
});

export const forecastSchema = z.object({
  schemaVersion: z.literal(1),
  provider: z.literal('open-meteo'),
  locationKey: z.string(),
  timezone: z.string(),
  timezoneFallback: z.boolean(),
  fetchedAt: z.int(),
  current: z.nullable(currentSchema),
  intervals: z.array(intervalSchema),
  diagnostics: z.array(z.string()),
});

const entrySchema = z.object({ key: z.string(), fetchedAt: z.int(), forecast: z.unknown() });
const fileSchema = z.object({ version: z.literal(CACHE_VERSION), entries: z.array(entrySchema) });

type Entry = { key: string; fetchedAt: number; forecast: Forecast };

export type ForecastCache = {
  /** Returns a valid, non-expired entry for the key and marks it most recently used. */
  get(key: string, locationKey: string, now: number): Forecast | null;
  put(key: string, forecast: Forecast): void;
  clear(): void;
};

export function createForecastCache(store: KeyValueStore): ForecastCache {
  function read(): Entry[] {
    const raw = store.get(CACHE_STORAGE_KEY);
    if (raw === null) return [];
    try {
      const parsed = fileSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return [];
      const entries: Entry[] = [];
      for (const e of parsed.data.entries) {
        const f = forecastSchema.safeParse(e.forecast);
        if (f.success && f.data.fetchedAt === e.fetchedAt) entries.push({ key: e.key, fetchedAt: e.fetchedAt, forecast: f.data });
      }
      return entries;
    } catch {
      return [];
    }
  }

  function write(entries: Entry[]): void {
    if (entries.length === 0) {
      store.remove(CACHE_STORAGE_KEY);
      return;
    }
    store.set(CACHE_STORAGE_KEY, JSON.stringify({ version: CACHE_VERSION, entries }));
  }

  return {
    get(key, locationKey, now) {
      const entries = read();
      const valid = entries.filter(
        (e) => e.fetchedAt - now <= MAX_FUTURE_SKEW_SECONDS && now - e.fetchedAt < EXPIRE_AFTER_SECONDS,
      );
      const hit = valid.find((e) => e.key === key && e.forecast.locationKey === locationKey);
      const next = hit === undefined ? valid : [...valid.filter((e) => e !== hit), hit];
      if (next.length !== entries.length || hit !== undefined) write(next);
      return hit?.forecast ?? null;
    },
    put(key, forecast) {
      const entries = read().filter((e) => e.key !== key);
      entries.push({ key, fetchedAt: forecast.fetchedAt, forecast });
      write(entries.slice(-CACHE_MAX_ENTRIES));
    },
    clear() {
      store.remove(CACHE_STORAGE_KEY);
    },
  };
}
