import { describe, expect, it } from 'vitest';
import { isValidCoordinates, locationKey, roundCoordinates } from '../../src/lib/geo';

describe('coordinates', () => {
  it('treats zero and the exact limits as valid', () => {
    expect(isValidCoordinates(0, 0)).toBe(true);
    expect(isValidCoordinates(90, 180)).toBe(true);
    expect(isValidCoordinates(-90, -180)).toBe(true);
  });

  it('rejects out-of-range and non-finite values', () => {
    for (const [lat, lon] of [
      [90.01, 0],
      [0, -180.01],
      [Number.NaN, 0],
      [0, Number.POSITIVE_INFINITY],
    ] as const) {
      expect(isValidCoordinates(lat, lon)).toBe(false);
      expect(roundCoordinates(lat, lon)).toBeNull();
    }
  });

  it('rounds to two decimals and never produces -0', () => {
    expect(roundCoordinates(38.62727, -90.19789)).toEqual({ latitude: 38.63, longitude: -90.2 });
    expect(Object.is(roundCoordinates(-0.001, 0)?.latitude, 0)).toBe(true);
    expect(locationKey({ latitude: 38.63, longitude: -90.2 })).toBe('38.63,-90.20');
  });
});
