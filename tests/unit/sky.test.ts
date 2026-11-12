import { describe, expect, it } from 'vitest';
import { skyFor } from '../../src/domain/sky';

describe('skyFor', () => {
  it.each([
    [0, true, 'clear'],
    [1, null, 'clear'],
    [0, false, 'night-clear'],
    [2, true, 'cloudy'],
    [3, false, 'night-cloudy'],
    [61, true, 'rain'],
    [66, false, 'rain'],
    [81, true, 'rain'],
    [73, true, 'snow'],
    [86, false, 'snow'],
    [95, true, 'storm'],
    [97, false, 'storm'],
    [45, true, 'fog'],
    [48, true, 'fog'],
    [null, true, 'unknown'],
    [null, false, 'night-cloudy'],
    [42, null, 'unknown'],
  ] as const)('code %s, daylight %s → %s', (code, daylight, expected) => {
    expect(skyFor(code, daylight)).toBe(expected);
  });
});
