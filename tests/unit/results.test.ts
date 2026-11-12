import { describe, expect, it } from 'vitest';
import type { Forecast, Interval } from '../../src/domain/types';
import { computeResults } from '../../src/features/outside/controller/results';
import { defaultSettings } from '../../src/services/settings';
import { makeInterval } from './helpers';

const T0 = 1794736800;
const H = 3600;

function forecast(at: (i: number) => Partial<Interval> = () => ({})): Forecast {
  return {
    schemaVersion: 1,
    provider: 'open-meteo',
    locationKey: '0.00,0.00',
    timezone: 'UTC',
    timezoneFallback: false,
    fetchedAt: T0,
    current: null,
    intervals: Array.from({ length: 48 }, (_, i) => makeInterval(T0 + i * H, at(i))),
    sunEvents: [],
    diagnostics: [],
  };
}

describe('computeResults', () => {
  it('uses the selected activity and its own preferences', () => {
    const s = defaultSettings();
    const f = forecast(() => ({ windKmh: 16, gustKmh: 20 }));
    const walk = computeResults(f, T0, { ...s, activity: 'walk' }, true);
    const bike = computeResults(f, T0, { ...s, activity: 'bike' }, true);
    expect(walk.activity.id).toBe('walk');
    expect(walk.next.score).toBe(100); // medium wind tolerance
    expect(bike.next.score ?? 100).toBeLessThan(100); // low wind tolerance
  });

  it('suppresses windows and comparison when recommendations are not allowed', () => {
    const r = computeResults(forecast(), T0, defaultSettings(), false);
    expect(r.search).toMatchObject({ windows: [], emptyReason: 'stale' });
    expect(r.comparison).toEqual({ kind: 'none' });
    expect(r.next.score).toBe(100); // underlying weather still inspectable
  });

  it('respects the global duration and per-activity daylight setting', () => {
    const s = defaultSettings();
    s.durationMinutes = 120;
    s.activities.outdoors = { ...s.activities.outdoors, daylightOnly: true };
    const f = forecast((i) => ({ daylight: i < 6 }));
    const r = computeResults(f, T0, s, true);
    for (const w of r.search.windows) {
      expect(w.end - w.start).toBe(7200);
      expect(w.daylight).toBe(true);
    }
  });

  it('builds a 24-hour timeline from the same scoring', () => {
    const r = computeResults(forecast((i) => (i === 2 ? { weatherCodes: [95] } : {})), T0, defaultSettings(), true);
    expect(r.timeline).toHaveLength(24);
    expect(r.timeline[2]?.label).toBe('check');
  });
});
