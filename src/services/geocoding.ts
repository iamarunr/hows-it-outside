// zod/mini keeps the client bundle within the 100 KB gzip JS budget (PRB §7).
import * as z from 'zod/mini';
import { ENDPOINTS } from '../lib/config';
import { roundCoordinates } from '../lib/geo';
import { fetchJson, FetchJsonError } from './fetchJson';

export const SEARCH_MIN_AUTO_CODE_POINTS = 2;
export const SEARCH_MAX_LENGTH = 120;
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_TIMEOUT_MS = 8000;

export type PlaceResult = {
  id: number;
  name: string;
  label: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  latitude: number;
  longitude: number;
};

/** Trims and limits to 120 characters (code points). */
export function normalizeQuery(raw: string): string {
  return Array.from(raw.trim()).slice(0, SEARCH_MAX_LENGTH).join('');
}

/** Debounced auto-search starts at 2 code points; Enter submits any non-empty query. */
export function shouldAutoSearch(query: string): boolean {
  return Array.from(query).length >= SEARCH_MIN_AUTO_CODE_POINTS;
}

const optionalText = z.pipe(
  z.optional(z.string()),
  z.transform((v: string | undefined) => (v === undefined || v.trim() === '' ? undefined : v.trim())),
);

const rawResult = z.object({
  id: z.int(),
  name: z.string().check(z.minLength(1)),
  latitude: z.number(),
  longitude: z.number(),
  admin1: optionalText,
  country: optionalText,
  country_code: optionalText,
  timezone: optionalText,
});

const rawResponse = z.object({
  results: z.optional(z.array(z.unknown())),
});

export function buildGeocodingUrl(query: string): URL {
  const url = new URL(ENDPOINTS.geocoding);
  url.search = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' }).toString();
  return url;
}

/** Validates the provider payload. Invalid individual results are dropped. */
export function parseGeocodingResponse(payload: unknown): PlaceResult[] {
  const parsed = rawResponse.safeParse(payload);
  if (!parsed.success) throw new FetchJsonError('invalid_response');
  const out: PlaceResult[] = [];
  const seen = new Set<number>();
  for (const item of parsed.data.results ?? []) {
    const r = rawResult.safeParse(item);
    if (!r.success || seen.has(r.data.id)) continue;
    const coords = roundCoordinates(r.data.latitude, r.data.longitude);
    if (coords === null) continue;
    seen.add(r.data.id);
    const label = [r.data.name, r.data.admin1, r.data.country].filter((p): p is string => p !== undefined).join(', ');
    out.push({
      id: r.data.id,
      name: r.data.name,
      label,
      ...(r.data.admin1 !== undefined && { admin1: r.data.admin1 }),
      ...(r.data.country !== undefined && { country: r.data.country }),
      ...(r.data.country_code !== undefined && { countryCode: r.data.country_code }),
      ...(r.data.timezone !== undefined && { timezone: r.data.timezone }),
      ...coords,
    });
  }
  return out;
}

const GEOCODE_CACHE_TTL_SECONDS = 24 * 60 * 60;
const GEOCODE_CACHE_MAX = 50;

/** In-memory search cache (spec 02 §6): normalized query + language, 24 h TTL, 50 entries. Not persisted. */
export function createGeocodingCache(now: () => number) {
  const entries = new Map<string, { at: number; results: PlaceResult[] }>();
  const keyOf = (query: string): string => `en|${query.toLocaleLowerCase('en')}`;
  return {
    get(query: string): PlaceResult[] | null {
      const key = keyOf(query);
      const hit = entries.get(key);
      if (hit === undefined) return null;
      if (now() - hit.at >= GEOCODE_CACHE_TTL_SECONDS) {
        entries.delete(key);
        return null;
      }
      entries.delete(key);
      entries.set(key, hit); // most recently used last
      return hit.results;
    },
    put(query: string, results: PlaceResult[]): void {
      const key = keyOf(query);
      entries.delete(key);
      entries.set(key, { at: now(), results });
      while (entries.size > GEOCODE_CACHE_MAX) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
  };
}

export type GeocodingCache = ReturnType<typeof createGeocodingCache>;

export async function searchPlaces(rawQuery: string, signal?: AbortSignal, cache?: GeocodingCache): Promise<PlaceResult[]> {
  const query = normalizeQuery(rawQuery);
  if (query === '') return [];
  const cached = cache?.get(query);
  if (cached !== undefined && cached !== null) return cached;
  const payload = await fetchJson(buildGeocodingUrl(query), {
    timeoutMs: SEARCH_TIMEOUT_MS,
    ...(signal !== undefined && { signal }),
  });
  const results = parseGeocodingResponse(payload);
  cache?.put(query, results);
  return results;
}
