/**
 * Where the sun (or, at night, the moon standing in for it) sits on its arc.
 * Decorative only: it places a disc in the sky scene and tints the sky near
 * sunrise and sunset. Low-accuracy solar formulas (about a degree). Pure.
 *
 * ASSUMPTION: at night the "moon" simply travels the night arc from sunset to
 * sunrise; it is not the real moon's position or phase.
 */

export type SunState = {
  /** Which disc is in the sky. */
  body: 'sun' | 'moon';
  /** 0 at rise, 0.5 at the highest point, 1 at set (for the moon: sunset → sunrise). */
  arc: number;
  /** Sun up and within LOW_SUN_MINUTES of the horizon. */
  low: 'rising' | 'setting' | null;
};

/** HEURISTIC: how long after sunrise / before sunset the sky is drawn as dawn / dusk. */
export const LOW_SUN_MINUTES = 50;

const RAD = Math.PI / 180;
const J2000 = 946_728_000; // 2000-01-01T12:00:00Z
const LOW_DEG = LOW_SUN_MINUTES / 4; // the hour angle moves 1° every 4 minutes

function wrap180(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function fromHourAngle(hourAngle: number, halfDay: number): SunState {
  if (Math.abs(hourAngle) < halfDay) {
    const toHorizon = halfDay - Math.abs(hourAngle);
    const low = halfDay < 180 && toHorizon < LOW_DEG ? (hourAngle < 0 ? 'rising' : 'setting') : null;
    return { body: 'sun', arc: (hourAngle + halfDay) / (2 * halfDay), low };
  }
  const sinceSunset = hourAngle > 0 ? hourAngle - halfDay : hourAngle + 360 - halfDay;
  return { body: 'moon', arc: Math.min(1, Math.max(0, sinceSunset / (360 - 2 * halfDay))), low: null };
}

/** Sun state for a place and an instant (UTC epoch seconds). Handles polar day and night. */
export function sunState(latitude: number, longitude: number, epochSeconds: number): SunState {
  const days = (epochSeconds - J2000) / 86_400;
  const anomaly = (357.528 + 0.9856003 * days) * RAD;
  const eclipticLong = (280.46 + 0.9856474 * days + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * days) * RAD;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLong));
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLong), Math.cos(eclipticLong)) / RAD;
  const siderealDeg = (18.697374558 + 24.06570982441908 * days) * 15;
  const hourAngle = wrap180(siderealDeg + longitude - rightAscension);
  const lat = latitude * RAD;
  // −0.833°: the sun's upper edge on the horizon, with standard refraction.
  const cosHalfDay = (Math.sin(-0.833 * RAD) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination));
  const halfDay = cosHalfDay >= 1 ? 0 : cosHalfDay <= -1 ? 180 : Math.acos(cosHalfDay) / RAD;
  return fromHourAngle(hourAngle, halfDay);
}

/**
 * Sun state from a wall clock alone, used before a place is chosen.
 * ASSUMPTION: daylight runs 06:00–18:00 local time.
 */
export function clockSunState(localHour: number): SunState {
  return fromHourAngle(wrap180((localHour - 12) * 15), 90);
}

/**
 * The forecast's own daylight flag wins over the formula when they disagree
 * (they can differ in the hour around sunrise and sunset): the disc is then
 * parked at the matching end of its arc.
 */
export function reconcileSun(sun: SunState, daylight: boolean | null): SunState {
  if (daylight === null || daylight === (sun.body === 'sun')) return sun;
  const nearStart = sun.arc >= 0.5;
  return { body: daylight ? 'sun' : 'moon', arc: nearStart ? 0.03 : 0.97, low: null };
}
