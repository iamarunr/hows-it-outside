import { describe, expect, it } from 'vitest';
import { ACTIVITY_PRESETS, HORIZON_SECONDS } from '../../src/domain/activities';
import {
  assessWindow,
  candidateStarts,
  compareNextHour,
  findWindows,
  nextHour,
  timelineIntervals,
} from '../../src/domain/windows';
import type { DurationMinutes, Interval } from '../../src/domain/types';
import { makeInterval } from './helpers';

const H = 3600;
const T0 = 1794736800; // 2026-11-15T10:00Z
const walk = ACTIVITY_PRESETS.walk;
const ctx = { prefs: walk.defaults, weights: walk.weights };
const anyTime = { prefs: { ...walk.defaults, daylightOnly: false }, weights: walk.weights };

/** 48 hourly intervals from T0; `at(i)` overrides interval i. */
function series(at: (i: number) => Partial<Interval> = () => ({}), n = 48): Interval[] {
  return Array.from({ length: n }, (_, i) => makeInterval(T0 + i * H, at(i)));
}

/** Walk interval scoring exactly 60: T=.5, R=.5, W=.1 → contributions .2+.175+.025 = .4 */
const SIXTY: Partial<Interval> = { feelsLikeC: 31, precipProbabilityPct: 35, windKmh: 20, gustKmh: 20 };

function find(intervals: Interval[], now: number, durationMinutes: DurationMinutes = 60, c = anyTime, stale = false) {
  return findWindows(intervals, now, { ...c, durationMinutes, stale });
}

describe('window aggregation (golden)', () => {
  it('equal half-hour overlaps of 100 and 60 give .7*80 + .3*60 = 74, Mixed', () => {
    const intervals = series((i) => (i === 1 ? SIXTY : {}));
    expect(assessWindow(intervals, T0, H, anyTime).parts[0]?.assessment.score).toBe(100);
    expect(assessWindow(intervals, T0 + H, H, anyTime).score).toBeCloseTo(60, 10);
    const w = assessWindow(intervals, T0 + 1800, H, anyTime);
    expect(w.meanScore).toBeCloseTo(80, 10);
    expect(w.minScore).toBeCloseTo(60, 10);
    expect(w.score).toBeCloseTo(74, 10);
    expect(w.label).toBe('mixed');
    expect(w.hourlyApproximation).toBe(true);
  });

  it('weights unequal overlaps by seconds', () => {
    const intervals = series((i) => (i === 1 ? SIXTY : {}));
    const w = assessWindow(intervals, T0 + 900, H, anyTime); // 2700 s of 100, 900 s of 60
    expect(w.parts.map((p) => p.overlapSeconds)).toEqual([2700, 900]);
    expect(w.meanScore).toBeCloseTo(90, 10);
    expect(w.score).toBeCloseTo(0.7 * 90 + 0.3 * 60, 10);
  });

  it('gust exactly 50 excludes a window even when the score would pass', () => {
    const intervals = series((i) => (i === 0 ? { gustKmh: 50 } : {}));
    const w = assessWindow(intervals, T0, H, anyTime);
    expect(w.score ?? 0).toBeGreaterThan(75);
    expect(w.rejection).toBe('flag');
    expect(w.label).toBe('check');
  });

  it('reports peak hourly precipitation and wind maxima, feels-like min–max', () => {
    const intervals = series((i) => (i === 0 ? { precipProbabilityPct: 20, precipMm: 0.1, feelsLikeC: 12 } : i === 1 ? { precipProbabilityPct: 10, windKmh: 9, gustKmh: 15, feelsLikeC: 14 } : {}));
    const w = assessWindow(intervals, T0, 2 * H, anyTime);
    expect(w.metrics).toMatchObject({
      precipProbabilityPeakPct: 20,
      precipPeakMm: 0.1,
      windMaxKmh: 9,
      gustMaxKmh: 15,
      feelsLikeMinC: 12,
      feelsLikeMaxC: 14,
    });
  });

  it('never prorates hourly precipitation for a shorter outing', () => {
    const intervals = series((i) => (i === 0 ? { precipMm: 1.6, precipProbabilityPct: 80 } : {}));
    const w30 = assessWindow(intervals, T0, 1800, anyTime);
    const w60 = assessWindow(intervals, T0, H, anyTime);
    expect(w30.metrics.precipPeakMm).toBe(1.6);
    expect(w30.score).toBe(w60.score);
  });
});

describe('coverage and data', () => {
  it('rejects a window with a gap in coverage', () => {
    const intervals = series().filter((i) => i.start !== T0 + H);
    const w = assessWindow(intervals, T0, 2 * H, anyTime);
    expect(w.coverageComplete).toBe(false);
    expect(w.score).toBeNull();
    expect(w.rejection).toBe('data');
  });

  it('rejects a window with any null-score interval', () => {
    const intervals = series((i) => (i === 1 ? { precipProbabilityPct: null } : {}));
    expect(assessWindow(intervals, T0, 2 * H, anyTime).rejection).toBe('data');
    expect(assessWindow(intervals, T0, 2 * H, anyTime).label).toBe('limited');
  });

  it('reports data as the empty reason when nothing has complete data', () => {
    const intervals = series(() => ({ precipProbabilityPct: null }));
    expect(find(intervals, T0)).toMatchObject({ windows: [], emptyReason: 'data' });
  });
});

describe('candidates', () => {
  it.each([30, 60, 90, 120] as const)('%i minutes: starts at now and future interval starts within the horizon', (minutes) => {
    const now = T0 + 1234;
    const starts = candidateStarts(series(), now, minutes * 60);
    expect(starts[0]).toBe(now);
    expect(starts.slice(1).every((s) => (s - T0) % H === 0 && s > now)).toBe(true);
    expect(Math.max(...starts) + minutes * 60).toBeLessThanOrEqual(now + HORIZON_SECONDS);
    expect(new Set(starts).size).toBe(starts.length);
  });

  it('does not duplicate now when it falls exactly on an interval start', () => {
    const starts = candidateStarts(series(), T0, H);
    expect(starts.filter((s) => s === T0)).toHaveLength(1);
    expect(starts).toHaveLength(24);
  });

  it('excludes candidates past the 24-hour horizon even when data exists', () => {
    const result = find(series(), T0, 120);
    for (const w of result.windows) expect(w.end).toBeLessThanOrEqual(T0 + HORIZON_SECONDS);
  });

  it('handles windows crossing local midnight with epoch arithmetic only', () => {
    // 2026-11-16T05:00Z is midnight in America/Chicago (CST); scoring is zone-independent.
    const midnight = Date.parse('2026-11-16T06:00:00Z') / 1000;
    const w = assessWindow(series(), midnight - H, 2 * H, anyTime);
    expect(w.coverageComplete).toBe(true);
    expect(w.score).toBe(100);
  });
});

describe('ranking', () => {
  it('ranks by score, selects up to three non-overlapping windows; adjacency allowed', () => {
    // Everything scores 60 except hours 3,4 (100) and 10 (100).
    const intervals = series((i) => (i === 3 || i === 4 || i === 10 ? {} : SIXTY));
    const r = find(intervals, T0, 60);
    expect(r.windows.map((w) => (w.start - T0) / H)).toEqual([3, 4, 10]);
    for (let a = 0; a < r.windows.length; a++) {
      for (let b = a + 1; b < r.windows.length; b++) {
        const x = r.windows[a];
        const y = r.windows[b];
        if (x === undefined || y === undefined) continue;
        expect(x.start < y.end && y.start < x.end).toBe(false);
      }
    }
  });

  it('breaks exact ties by the earlier start', () => {
    const r = find(series(), T0, 120);
    expect(r.windows.map((w) => (w.start - T0) / H)).toEqual([0, 2, 4]);
  });

  it('does not fill slots with poor windows', () => {
    const POOR: Partial<Interval> = { precipProbabilityPct: 100 };
    const intervals = series((i) => (i === 5 ? {} : POOR));
    const r = find(intervals, T0, 60);
    expect(r.windows.map((w) => (w.start - T0) / H)).toEqual([5]);
  });

  it('rejects a window whose minimum interval is Poor even if the mean passes', () => {
    const POOR: Partial<Interval> = { precipProbabilityPct: 100 }; // 40
    const intervals = series((i) => (i === 1 ? POOR : {}));
    const w = assessWindow(intervals, T0, 2 * H, anyTime);
    expect(w.score).toBeCloseTo(0.7 * 70 + 0.3 * 40, 10); // 61 ≥ 45 but min < 45
    expect(w.rejection).toBe('preference');
  });

  it('is deterministic and does not mutate inputs', () => {
    const intervals = series((i) => (i % 3 === 0 ? SIXTY : {}));
    const copy = structuredClone(intervals);
    const a = find(intervals, T0 + 600, 90);
    const b = find(intervals, T0 + 600, 90);
    expect(a).toEqual(b);
    expect(intervals).toEqual(copy);
  });
});

describe('daylight', () => {
  it('excludes night and dawn/dusk hours when daylight-only', () => {
    // Hours 0-5 day, 6 dusk (false), 7-20 night, 21 dawn (false), 22+ day.
    const intervals = series((i) => ({ daylight: (i >= 0 && i <= 5) || i >= 22 ? true : false }));
    const r = find(intervals, T0, 60, ctx);
    for (const w of r.windows) expect(w.daylight).toBe(true);
    const dusk = assessWindow(intervals, T0 + 6 * H, H, ctx);
    expect(dusk.rejection).toBe('daylight');
  });

  it('polar night: no daylight window, reason daylight; allowed when daylight-only is off', () => {
    const intervals = series(() => ({ daylight: false }));
    expect(find(intervals, T0, 60, ctx)).toMatchObject({ windows: [], emptyReason: 'daylight' });
    expect(find(intervals, T0, 60, anyTime).windows).toHaveLength(3);
  });

  it('polar day: windows available at any hour', () => {
    const r = find(series(() => ({ daylight: true })), T0 + 13 * H, 60, ctx);
    expect(r.windows).toHaveLength(3);
  });

  it('missing is_day excludes from daylight-only but still scores', () => {
    const intervals = series(() => ({ daylight: null }));
    const w = assessWindow(intervals, T0, H, ctx);
    expect(w.score).toBe(100);
    expect(w.rejection).toBe('daylight');
  });
});

describe('empty reasons (priority order)', () => {
  it('flags: every daylight candidate is flagged', () => {
    const intervals = series((i) => (i < 12 ? { weatherCodes: [95] } : { daylight: false }));
    const r = find(intervals, T0, 60, ctx);
    expect(r).toMatchObject({ windows: [], emptyReason: 'flag' });
    expect(r.horizonFlags).toEqual(['thunderstorm']);
  });

  it('preference: complete daylight data without flags but poor matches', () => {
    const r = find(series(() => ({ precipProbabilityPct: 100 })), T0, 60, ctx);
    expect(r).toMatchObject({ windows: [], emptyReason: 'preference' });
  });

  it('stale data suppresses all windows but keeps flags visible', () => {
    const intervals = series((i) => (i === 2 ? { gustKmh: 60 } : {}));
    const r = find(intervals, T0, 60, ctx, true);
    expect(r).toMatchObject({ windows: [], emptyReason: 'stale', horizonFlags: ['strong_gusts'] });
  });
});

describe('next hour and comparison', () => {
  it('labels a flagged next hour without rejecting it', () => {
    const intervals = series((i) => (i === 0 ? { weatherCodes: [95] } : {}));
    const next = nextHour(intervals, T0, ctx);
    expect(next.label).toBe('check');
    expect(next.flags).toEqual(['thunderstorm']);
  });

  it('shows Limited data when next-hour coverage is missing', () => {
    expect(nextHour([], T0, ctx).label).toBe('limited');
  });

  it('now is best when the best window starts now', () => {
    const intervals = series();
    const r = find(intervals, T0, 60, ctx);
    expect(compareNextHour(nextHour(intervals, T0, ctx), r.windows[0], T0)).toEqual({ kind: 'now_is_best' });
  });

  it('better later when the best beats the next hour by ≥10 and starts later', () => {
    const intervals = series((i) => (i === 0 ? SIXTY : {}));
    const r = find(intervals, T0, 60, ctx);
    expect(compareNextHour(nextHour(intervals, T0, ctx), r.windows[0], T0)).toEqual({ kind: 'better_later', start: T0 + H });
  });

  it('similar when the margin is under 10', () => {
    const intervals = series((i) => (i === 0 ? { precipProbabilityPct: 14 } : {})); // R=.2 → 93
    const r = find(intervals, T0, 60, ctx);
    expect(compareNextHour(nextHour(intervals, T0, ctx), r.windows[0], T0)).toEqual({ kind: 'similar' });
  });

  it('never compares a null next-hour score; a flagged now only points later', () => {
    const missing = series((i) => (i === 0 ? { precipProbabilityPct: null } : {}));
    expect(compareNextHour(nextHour(missing, T0, ctx), find(missing, T0, 60, ctx).windows[0], T0)).toEqual({ kind: 'none' });
    const flagged = series((i) => (i === 0 ? { weatherCodes: [95] } : {}));
    expect(compareNextHour(nextHour(flagged, T0, ctx), find(flagged, T0, 60, ctx).windows[0], T0)).toEqual({
      kind: 'better_later',
      start: T0 + H,
    });
    expect(compareNextHour(nextHour(flagged, T0, ctx), undefined, T0)).toEqual({ kind: 'none' });
  });
});

describe('timeline', () => {
  it('includes the current partial hour and stops at the 24-hour horizon', () => {
    const t = timelineIntervals(series(), T0 + 1800);
    expect(t[0]?.start).toBe(T0);
    expect(t).toHaveLength(25);
    expect(t.at(-1)?.start).toBe(T0 + 24 * H);
  });
});
