/** Coordinate validation and privacy rounding. Pure; no browser or network. */

export type Coordinates = { latitude: number; longitude: number };

export function isValidCoordinates(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/** Rounds to two decimals (spec ADR-005). Normalizes -0 to 0. */
export function roundCoordinate(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundCoordinates(lat: number, lon: number): Coordinates | null {
  if (!isValidCoordinates(lat, lon)) return null;
  return { latitude: roundCoordinate(lat), longitude: roundCoordinate(lon) };
}

export function locationKey(c: Coordinates): string {
  return `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
}
