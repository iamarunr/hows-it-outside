import { describe, expect, it } from 'vitest';
import { ACTIVITY_IDS, ACTIVITY_PRESETS, validateComfortBand } from '../../src/domain/activities';
import { intervalFlags, intervalNotes } from '../../src/domain/flags';
import { classifyScore, scoreInterval, worstFactorCap } from '../../src/domain/score';
import type { ActivityPreferences, Interval } from '../../src/domain/types';
import { makeInterval, rng } from './helpers';

const T0 = 1794736800;
const walk = ACTIVITY_PRESETS.walk;

function score(overrides: Partial<Interval>, prefs: ActivityPreferences = walk.defaults, weights = walk.weights) {
  return scoreInterval(makeInterval(T0, overrides), prefs, weights);
}

describe('presets (exact table)', () => {
  it('matches SCORING §2', () => {
    const table = ACTIVITY_IDS.map((id) => {
      const p = ACTIVITY_PRESETS[id];
      return [id, p.defaults.comfortLowC, p.defaults.comfortHighC, p.weights.temperature, p.weights.precipitation, p.weights.wind, p.defaults.rain, p.defaults.wind, p.defaults.daylightOnly];
    });
    expect(table).toEqual([
      ['outdoors', 12, 26, 0.4, 0.35, 0.25, 'light', 'medium', true],
      ['walk', 8, 25, 0.4, 0.35, 0.25, 'light', 'medium', true],
      ['run', 5, 20, 0.5, 0.25, 0.25, 'light', 'medium', true],
      ['bike', 10, 25, 0.3, 0.3, 0.4, 'avoid', 'low', true],
      ['hangout', 18, 27, 0.45, 0.35, 0.2, 'avoid', 'low', true],
    ]);
    for (const id of ACTIVITY_IDS) {
      const w = ACTIVITY_PRESETS[id].weights;
      expect(w.temperature + w.precipitation + w.wind).toBeCloseTo(1, 12);
    }
  });
});

describe('golden examples (SCORING §9)', () => {
  it('mild, dry, calm walk scores 100 Good', () => {
    const a = score({});
    expect(a.score).toBe(100);
    expect(a.flags).toEqual([]);
    expect(a.label).toBe('good');
  });

  it('35% with light tolerance: R=.5, 82.5 Good, cap inactive', () => {
    const a = score({ precipProbabilityPct: 35 });
    expect(a.penalties?.precipitation).toBe(0.5);
    expect(a.score).toBeCloseTo(82.5, 10);
    expect(a.capApplied).toBe(false);
    expect(a.label).toBe('good');
  });

  it('52.5% with light tolerance: R=.75, base 73.75, cap 70 → 70 Mixed', () => {
    const a = score({ precipProbabilityPct: 52.5 });
    expect(a.baseScore).toBeCloseTo(73.75, 10);
    expect(a.score).toBeCloseTo(70, 10);
    expect(a.capApplied).toBe(true);
    expect(a.label).toBe('mixed');
  });

  it('70% with light tolerance: R=1, base 65, cap 40 → 40 Poor', () => {
    const a = score({ precipProbabilityPct: 70 });
    expect(a.baseScore).toBeCloseTo(65, 10);
    expect(a.score).toBeCloseTo(40, 10);
    expect(a.label).toBe('poor');
  });

  it('steady 9 mm/h with avoid tolerance is Poor (no heavy_precip flag below 10)', () => {
    const a = score({ precipMm: 9, precipProbabilityPct: 100 }, { ...walk.defaults, rain: 'avoid' });
    expect(a.flags).toEqual([]);
    expect(a.score).toBeCloseTo(40, 10);
    expect(a.label).toBe('poor');
  });

  it('walk at feels-like -4°C, dry and calm, is Poor', () => {
    const a = score({ feelsLikeC: -4 });
    expect(a.penalties?.temperature).toBe(1);
    expect(a.score).toBeCloseTo(40, 10);
    expect(a.temperatureDirection).toBe('colder');
  });

  it('classification boundaries are inclusive: 75 Good, 45 Mixed', () => {
    expect(classifyScore(75)).toBe('good');
    expect(classifyScore(74.999999)).toBe('mixed');
    expect(classifyScore(45)).toBe('mixed');
    expect(classifyScore(44.999999)).toBe('poor');
  });

  it('null probability gives Limited data; numeric zero does not', () => {
    expect(score({ precipProbabilityPct: null }).label).toBe('limited');
    expect(score({ precipProbabilityPct: null }).score).toBeNull();
    expect(score({ precipProbabilityPct: 0 }).label).toBe('good');
  });
});

describe('worst-factor cap', () => {
  it('is inactive at worst ≤ 0.5, 70 at 0.75, 40 at 1', () => {
    expect(worstFactorCap({ temperature: 0.5, precipitation: 0.2, wind: 0 })).toBe(100);
    expect(worstFactorCap({ temperature: 0, precipitation: 0.75, wind: 0 })).toBe(70);
    expect(worstFactorCap({ temperature: 0, precipitation: 0, wind: 1 })).toBe(40);
  });

  it('makes any single saturated penalty Poor for every preset', () => {
    for (const id of ACTIVITY_IDS) {
      const p = ACTIVITY_PRESETS[id];
      const cases: Partial<Interval>[] = [
        { feelsLikeC: p.defaults.comfortHighC + 12 },
        { feelsLikeC: p.defaults.comfortLowC - 12 },
        { precipProbabilityPct: 100 },
        { windKmh: 60, gustKmh: 49 },
      ];
      for (const c of cases) {
        const a = scoreInterval(makeInterval(T0, c), p.defaults, p.weights);
        expect(a.score, `${id} ${JSON.stringify(c)}`).not.toBeNull();
        expect(a.score ?? 100, `${id} ${JSON.stringify(c)}`).toBeLessThan(45);
      }
    }
  });
});

describe('data quality', () => {
  it.each([
    ['feelsLikeC', { feelsLikeC: null }],
    ['windKmh', { windKmh: null }],
    ['gustKmh', { gustKmh: null }],
    ['precipMm', { precipMm: null }],
    ['precipProbabilityPct', { precipProbabilityPct: null }],
    ['weatherCode', { weatherCodeComplete: false }],
  ] as const)('missing %s → score null, Limited data, no reweighting', (field, o) => {
    const a = score(o);
    expect(a.score).toBeNull();
    expect(a.contributions).toBeNull();
    expect(a.missing).toContain(field);
    expect(a.label).toBe('limited');
  });

  it('missing actual temperature or humidity does not prevent a score', () => {
    expect(score({ temperatureC: null, humidityPct: null }).score).toBe(100);
  });

  it('does not mutate inputs', () => {
    const interval = makeInterval(T0);
    const prefs = { ...walk.defaults };
    const copy = structuredClone({ interval, prefs });
    scoreInterval(interval, prefs, walk.weights);
    expect({ interval, prefs }).toEqual(copy);
  });
});

describe('monotonicity (property tests, seeded)', () => {
  const rand = rng(20261111);
  const base = (): Partial<Interval> => ({
    feelsLikeC: -20 + rand() * 60,
    precipProbabilityPct: rand() * 100,
    precipMm: rand() * 8,
    windKmh: rand() * 50,
    gustKmh: rand() * 49,
  });

  it('more rain probability or amount never improves the score', () => {
    for (let i = 0; i < 2000; i++) {
      const b = base();
      for (const id of ACTIVITY_IDS) {
        const p = ACTIVITY_PRESETS[id];
        const s0 = scoreInterval(makeInterval(T0, b), p.defaults, p.weights).score ?? 0;
        const s1 = scoreInterval(makeInterval(T0, { ...b, precipProbabilityPct: Math.min(100, (b.precipProbabilityPct ?? 0) + rand() * 30) }), p.defaults, p.weights).score ?? 0;
        const s2 = scoreInterval(makeInterval(T0, { ...b, precipMm: (b.precipMm ?? 0) + rand() * 3 }), p.defaults, p.weights).score ?? 0;
        expect(s1).toBeLessThanOrEqual(s0 + 1e-9);
        expect(s2).toBeLessThanOrEqual(s0 + 1e-9);
      }
    }
  });

  it('moving farther outside the comfort band never improves the score', () => {
    for (let i = 0; i < 2000; i++) {
      const b = base();
      const p = ACTIVITY_PRESETS.run;
      const f = b.feelsLikeC ?? 0;
      const step = rand() * 10;
      const farther = f > p.defaults.comfortHighC ? f + step : f < p.defaults.comfortLowC ? f - step : null;
      if (farther === null) continue;
      const s0 = scoreInterval(makeInterval(T0, b), p.defaults, p.weights).score ?? 0;
      const s1 = scoreInterval(makeInterval(T0, { ...b, feelsLikeC: farther }), p.defaults, p.weights).score ?? 0;
      expect(s1).toBeLessThanOrEqual(s0 + 1e-9);
    }
  });

  it('more wind never improves the score', () => {
    for (let i = 0; i < 2000; i++) {
      const b = base();
      const p = ACTIVITY_PRESETS.bike;
      const s0 = scoreInterval(makeInterval(T0, b), p.defaults, p.weights).score ?? 0;
      const s1 = scoreInterval(makeInterval(T0, { ...b, windKmh: (b.windKmh ?? 0) + rand() * 10 }), p.defaults, p.weights).score ?? 0;
      expect(s1).toBeLessThanOrEqual(s0 + 1e-9);
    }
  });
});

describe('flags (SCORING §5)', () => {
  const flagsOf = (o: Partial<Interval>) => intervalFlags(makeInterval(T0, o));

  it.each([95, 96, 97, 99])('thunderstorm code %i', (code) => {
    expect(flagsOf({ weatherCodes: [code] })).toContain('thunderstorm');
  });
  it.each([56, 57, 66, 67])('freezing precipitation code %i', (code) => {
    expect(flagsOf({ weatherCodes: [code] })).toContain('freezing_precip');
  });
  it.each([71, 73, 75, 77, 85, 86, 48])('snow or ice code %i', (code) => {
    expect(flagsOf({ weatherCodes: [code] })).toContain('snow_or_ice_concern');
  });

  it('threshold boundaries are inclusive', () => {
    expect(flagsOf({ gustKmh: 49.99 })).toEqual([]);
    expect(flagsOf({ gustKmh: 50 })).toEqual(['strong_gusts']);
    expect(flagsOf({ feelsLikeC: 34.99 })).toEqual([]);
    expect(flagsOf({ feelsLikeC: 35 })).toEqual(['high_heat']);
    expect(flagsOf({ feelsLikeC: -14.99 })).toEqual([]);
    expect(flagsOf({ feelsLikeC: -15 })).toEqual(['severe_cold']);
    expect(flagsOf({ precipMm: 9.99 })).toEqual([]);
    expect(flagsOf({ precipMm: 10 })).toEqual(['heavy_precip']);
  });

  it('fog 45 is an informational note, not a flag', () => {
    expect(flagsOf({ weatherCodes: [45] })).toEqual([]);
    expect(intervalNotes(makeInterval(T0, { weatherCodes: [45] }))).toEqual(['fog']);
  });

  it('survive missing other fields and produce Check conditions', () => {
    const a = score({ weatherCodes: [95], weatherCodeComplete: false, precipProbabilityPct: null, windKmh: null });
    expect(a.flags).toEqual(['thunderstorm']);
    expect(a.score).toBeNull();
    expect(a.label).toBe('check');
  });

  it('take precedence over a high score and survive any preference', () => {
    const tolerant: ActivityPreferences = { comfortLowC: -30, comfortHighC: 45, rain: 'okay', wind: 'high', daylightOnly: false };
    const a = score({ gustKmh: 50, windKmh: 5 }, tolerant);
    expect(a.score).toBeGreaterThan(75);
    expect(a.label).toBe('check');
    expect(a.flags).toEqual(['strong_gusts']);
  });
});

describe('preference validation', () => {
  it('requires -30..45 and low strictly below high', () => {
    expect(validateComfortBand(8, 25)).toBeNull();
    expect(validateComfortBand(-30, 45)).toBeNull();
    expect(validateComfortBand(-31, 10)).toBe('out_of_bounds');
    expect(validateComfortBand(10, 46)).toBe('out_of_bounds');
    expect(validateComfortBand(20, 20)).toBe('low_not_below_high');
    expect(validateComfortBand(21, 20)).toBe('low_not_below_high');
    expect(validateComfortBand(Number.NaN, 20)).toBe('not_a_number');
  });
});
