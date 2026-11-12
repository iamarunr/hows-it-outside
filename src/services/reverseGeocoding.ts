/**
 * Names the area around a device location ("Use my location" only).
 *
 * Provider: BigDataCloud's free client-side reverse geocoding endpoint (no key).
 * Its terms allow browser calls with the device's own current position, so this
 * is called only right after a fresh geolocation result, never for saved or
 * searched places. Only the already-rounded coordinates are sent. The payload is
 * untrusted: it is validated here and a failure of any kind yields null, in
 * which case the interface keeps its generic label.
 */
import * as z from 'zod/mini';
import { ENDPOINTS } from '../lib/config';
import type { Coordinates } from '../lib/geo';
import { fetchJson } from './fetchJson';

/** HEURISTIC: the name is a nicety; never hold the forecast back for long. */
export const PLACE_NAME_TIMEOUT_MS = 2000;
const PART_MAX_LENGTH = 60;

const text = z.optional(z.string());
const rawPlace = z.object({
  lookupSource: z.string(),
  city: text,
  locality: text,
  principalSubdivision: text,
  countryName: text,
});

export function buildPlaceNameUrl(coords: Coordinates): URL {
  const url = new URL(ENDPOINTS.placeName);
  url.search = new URLSearchParams({
    latitude: coords.latitude.toFixed(2),
    longitude: coords.longitude.toFixed(2),
    localityLanguage: 'en',
  }).toString();
  return url;
}

function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  // Commas separate label parts; control characters never belong in a place name.
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/[\u0000-\u001f\u007f,]+/g, ' ').replace(/\s+/g, ' ').trim();
  return v === '' || Array.from(v).length > PART_MAX_LENGTH ? undefined : v;
}

/**
 * "City, Region, Country" from the provider payload, or null.
 * A name the provider guessed from the IP address is rejected: only a name for
 * the coordinates we sent is shown.
 */
export function parsePlaceName(payload: unknown): string | null {
  const parsed = rawPlace.safeParse(payload);
  if (!parsed.success || parsed.data.lookupSource !== 'coordinates') return null;
  const place = clean(parsed.data.city) ?? clean(parsed.data.locality);
  if (place === undefined) return null;
  const parts = [place];
  for (const part of [clean(parsed.data.principalSubdivision), clean(parsed.data.countryName)]) {
    if (part !== undefined && !parts.includes(part)) parts.push(part);
  }
  return parts.join(', ');
}

/** Never rejects: any failure (network, timeout, abort, bad payload) resolves to null. */
export async function lookupPlaceName(coords: Coordinates, signal?: AbortSignal, fetchImpl?: typeof fetch): Promise<string | null> {
  try {
    const payload = await fetchJson(buildPlaceNameUrl(coords), {
      timeoutMs: PLACE_NAME_TIMEOUT_MS,
      retries: 0,
      ...(signal !== undefined && { signal }),
      ...(fetchImpl !== undefined && { fetchImpl }),
    });
    return parsePlaceName(payload);
  } catch {
    return null;
  }
}
