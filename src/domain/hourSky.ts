/**
 * The sky to draw for one forecast hour: its weather code, plus day, dawn,
 * dusk or night from the sun's position at the middle of the hour (the
 * forecast's own daylight flag wins when the two disagree). Decorative. Pure.
 */
import { skyFor, type SkyId } from './sky';
import { reconcileSun, sunState } from './sun';
import type { Interval } from './types';

export type HourSky = { sky: SkyId; body: 'sun' | 'moon' };

export function hourSky(interval: Interval, latitude: number, longitude: number): HourSky {
  const sun = reconcileSun(sunState(latitude, longitude, (interval.start + interval.end) / 2), interval.daylight);
  return { sky: skyFor(interval.weatherCodes[0] ?? null, sun.body === 'sun', sun.low), body: sun.body };
}
