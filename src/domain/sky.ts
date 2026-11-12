/**
 * Picks the sky behind the readout from the current weather code and whether
 * it is daytime. Decorative: every fact it reflects is also stated in text.
 * Pure.
 */

export type SkyId = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' | 'night-clear' | 'night-cloudy' | 'unknown';

export const SKY_IDS: readonly SkyId[] = ['clear', 'cloudy', 'rain', 'snow', 'storm', 'fog', 'night-clear', 'night-cloudy', 'unknown'];

const STORM = new Set([95, 96, 97, 99]);
const SNOW = new Set([71, 73, 75, 77, 85, 86]);
const WET = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const FOG = new Set([45, 48]);
const CLEAR = new Set([0, 1]);
const CLOUD = new Set([2, 3]);

export function skyFor(code: number | null, daylight: boolean | null): SkyId {
  if (code !== null) {
    if (STORM.has(code)) return 'storm';
    if (SNOW.has(code)) return 'snow';
    if (WET.has(code)) return 'rain';
    if (FOG.has(code)) return 'fog';
    if (CLEAR.has(code)) return daylight === false ? 'night-clear' : 'clear';
    if (CLOUD.has(code)) return daylight === false ? 'night-cloudy' : 'cloudy';
  }
  return daylight === false ? 'night-cloudy' : 'unknown';
}
