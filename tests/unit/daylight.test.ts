import { describe, expect, it } from 'vitest';
import { countdownText, upcomingSunEvents } from '../../src/domain/daylight';
import type { SunEvent } from '../../src/domain/types';
import { normalizeForecast } from '../../src/services/weather/normalize';

const H = 3600;
const T0 = 1794729600; // 2026-11-15T08:00Z
const EVENTS: SunEvent[] = [
  { kind: 'sunrise', time: T0 - H },
  { kind: 'sunset', time: T0 + 8 * H },
  { kind: 'sunrise', time: T0 + 23 * H },
  { kind: 'sunset', time: T0 + 32 * H },
];

describe('upcomingSunEvents', () => {
  it('returns the next sunset and the next sunrise, soonest first', () => {
    expect(upcomingSunEvents(EVENTS, T0)).toEqual([EVENTS[1], EVENTS[2]]);
  });
  it('after dark, the next sunrise comes before the next sunset', () => {
    expect(upcomingSunEvents(EVENTS, T0 + 9 * H)).toEqual([EVENTS[2], EVENTS[3]]);
  });
  it('an event at exactly now has passed', () => {
    expect(upcomingSunEvents(EVENTS, T0 + 8 * H)).toEqual([EVENTS[2], EVENTS[3]]);
  });
  it('returns only what exists (polar day or night, or no daily data)', () => {
    expect(upcomingSunEvents([], T0)).toEqual([]);
    expect(upcomingSunEvents([{ kind: 'sunset', time: T0 + H }], T0)).toEqual([{ kind: 'sunset', time: T0 + H }]);
    expect(upcomingSunEvents(EVENTS, T0 + 40 * H)).toEqual([]);
  });
});

describe('countdownText', () => {
  it.each([
    [30, 'in under a minute'],
    [60, 'in 1 min'],
    [45 * 60 + 59, 'in 45 min'],
    [3600, 'in 1 h'],
    [2 * 3600 + 10 * 60, 'in 2 h 10 min'],
    [14 * 3600 + 5 * 60, 'in 14 h 5 min'],
  ])('%s s → %s', (seconds, text) => expect(countdownText(seconds)).toBe(text));
});

describe('sun events in the forecast payload', () => {
  const base = (extra: Record<string, unknown>) => ({
    timezone: 'Europe/London',
    hourly_units: { time: 'unixtime' },
    hourly: { time: [T0, T0 + H] },
    ...extra,
  });
  const events = (extra: Record<string, unknown>) => {
    const r = normalizeForecast(base(extra), { locationKey: 'k', fetchedAt: T0 });
    if (!r.ok) throw new Error(r.reason);
    return r.forecast;
  };

  it('reads sunrise and sunset in time order', () => {
    const f = events({
      daily_units: { time: 'unixtime', sunrise: 'unixtime', sunset: 'unixtime' },
      daily: { time: [T0], sunrise: [T0 - H, T0 + 23 * H], sunset: [T0 + 8 * H, T0 + 32 * H] },
    });
    expect(f.sunEvents).toEqual(EVENTS);
  });
  it('is empty, not an error, when the daily block is missing', () => {
    expect(events({}).sunEvents).toEqual([]);
  });
  it('drops zero (no sunrise that day), non-integers, strings and out-of-range values', () => {
    const f = events({
      daily_units: { sunrise: 'unixtime', sunset: 'unixtime' },
      daily: { sunrise: [0, T0 + H, 1.5, '1794729600', null, 9e12], sunset: [T0 + 9 * H] },
    });
    expect(f.sunEvents).toEqual([
      { kind: 'sunrise', time: T0 + H },
      { kind: 'sunset', time: T0 + 9 * H },
    ]);
  });
  it('ignores a series in the wrong unit or shape, with a diagnostic', () => {
    const f = events({
      daily_units: { sunrise: 'iso8601', sunset: 'unixtime' },
      daily: { sunrise: ['2026-11-15T07:10'], sunset: 'nope' },
    });
    expect(f.sunEvents).toEqual([]);
    expect(f.diagnostics).toEqual(expect.arrayContaining(['unusable:daily.sunrise', 'unusable:daily.sunset']));
  });
});
