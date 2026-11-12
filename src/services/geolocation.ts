/**
 * Explicit, one-shot device location (spec 05 Privacy model, DESIGN Geolocation).
 * Called only from a user action. Uses getCurrentPosition (never watchPosition),
 * rounds immediately and discards the raw position and accuracy.
 */
import { roundCoordinates, type Coordinates } from '../lib/geo';

export type GeoError = 'denied' | 'unavailable' | 'timeout' | 'unsupported';
export type GeoResult = { ok: true; coords: Coordinates } | { ok: false; error: GeoError };

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

type GeolocationLike = Pick<Geolocation, 'getCurrentPosition'>;

export function requestDeviceLocation(geo: GeolocationLike | undefined): Promise<GeoResult> {
  if (geo === undefined) return Promise.resolve({ ok: false, error: 'unsupported' });
  return new Promise((resolve) => {
    try {
      geo.getCurrentPosition(
        (position) => {
          const coords = roundCoordinates(position.coords.latitude, position.coords.longitude);
          resolve(coords === null ? { ok: false, error: 'unavailable' } : { ok: true, coords });
        },
        (error) => {
          resolve({
            ok: false,
            error: error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable',
          });
        },
        GEOLOCATION_OPTIONS,
      );
    } catch {
      resolve({ ok: false, error: 'unavailable' });
    }
  });
}

export const GEO_ERROR_COPY: Readonly<Record<GeoError, string>> = {
  denied: 'Location access is off for this site. Search for a city instead, or allow location in your browser settings.',
  unavailable: "Your location isn't available right now. Try again or search for a city.",
  timeout: 'Finding your location took too long. Try again or search for a city.',
  unsupported: "This browser can't share your location. Search for a city instead.",
};
