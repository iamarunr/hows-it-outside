import { describe, expect, it } from 'vitest';
import { ACTIVITY_IDS, ACTIVITY_PRESETS } from '../../src/domain/activities';
import {
  bestWindowTitle,
  comparisonText,
  drivers,
  emptyReasonText,
  explain,
  summaryHeadline,
} from '../../src/domain/explanations';
import { FLAG_COPY } from '../../src/domain/flags';
import { assessWindow, REJECTION_ORDER } from '../../src/domain/windows';
import type { Interval } from '../../src/domain/types';
import { makeInterval, rng } from './helpers';

const H = 3600;
const T0 = 1794736800;
const walk = ACTIVITY_PRESETS.walk;
const ctx = { prefs: { ...walk.defaults, daylightOnly: false }, weights: walk.weights };
const one = (o: Partial<Interval>, c = ctx) => assessWindow([makeInterval(T0, o)], T0, H, c);

describe('reasons', () => {
  it('explains a perfect hour without claiming no rain', () => {
    const r = explain(one({}), 'metric');
    expect(r).toEqual([
      { id: 'all_within', text: 'Within your preferred temperature range, with low wind and precipitation in the forecast.' },
    ]);
    expect(r[0]?.text).not.toMatch(/no rain|dry/i);
  });

  it('uses measured values in the selected units', () => {
    const w = one({ feelsLikeC: 31 });
    expect(explain(w, 'metric')[0]?.text).toBe('Warmer than your preferred range (feels like up to 31°C).');
    expect(explain(w, 'us')[0]?.text).toBe('Warmer than your preferred range (feels like up to 88°F).');
  });

  it('labels precipitation as peak hourly, not a whole-outing probability', () => {
    const r = explain(one({ precipProbabilityPct: 50, precipMm: 0.4 }), 'metric');
    expect(r[0]?.text).toBe('Higher chance of precipitation (peak hourly: 50% chance, 0.4 mm).');
  });

  it('reports wind maxima', () => {
    const r = explain(one({ windKmh: 30, gustKmh: 40 }), 'metric');
    expect(r[0]?.text).toBe('Windier than you prefer (up to 30 km/h, gusts 40 km/h).');
  });

  it('shows at most two drivers, ordered by contribution', () => {
    // T=.25 (.1), R=.5 (.175), W=.4 (.1)
    const w = one({ feelsLikeC: 28, precipProbabilityPct: 35, windKmh: 26, gustKmh: 20 });
    expect(explain(w, 'metric').map((r) => r.id)).toEqual(['precipitation', 'warmer']);
  });

  it('breaks exact ties temperature, then precipitation, then wind', () => {
    // Bike: T weight .3, R weight .3 → equal contributions when T = R.
    const bike = { prefs: { ...ACTIVITY_PRESETS.bike.defaults, daylightOnly: false }, weights: ACTIVITY_PRESETS.bike.weights };
    const w = one({ feelsLikeC: 31, precipProbabilityPct: 20 }, bike); // T=.5, R=.5
    expect(drivers(w).slice(0, 2)).toEqual(['temperature', 'precipitation']);
  });

  it('a capped interval leads with its saturated dimension', () => {
    // Hang out: wind saturated (W=1, contribution .2) while temperature contributes more (T=.5 → .225).
    const h = ACTIVITY_PRESETS.hangout;
    const w = one({ windKmh: 30, gustKmh: 20, feelsLikeC: 33 }, { prefs: { ...h.defaults, daylightOnly: false }, weights: h.weights });
    expect(w.contributions?.temperature ?? 0).toBeGreaterThan(w.contributions?.wind ?? 0);
    expect(w.capApplied).toBe(true);
    expect(w.score).toBeCloseTo(40, 10);
    expect(drivers(w)).toEqual(['wind', 'temperature']);
  });

  it('gives no reasons when the score is unavailable', () => {
    expect(explain(one({ precipProbabilityPct: null }), 'metric')).toEqual([]);
  });

  it('only names dimensions the score actually penalized (property test)', () => {
    const rand = rng(7);
    for (let i = 0; i < 1000; i++) {
      const w = one({
        feelsLikeC: -10 + rand() * 45,
        precipProbabilityPct: rand() * 100,
        precipMm: rand() * 3,
        windKmh: rand() * 40,
        gustKmh: rand() * 45,
      });
      const c = w.contributions;
      if (c === null) continue;
      for (const d of drivers(w)) expect(c[d]).toBeGreaterThan(0);
    }
  });
});

describe('headlines and copy', () => {
  it('names the activity and uses wind wording only when wind leads', () => {
    expect(summaryHeadline(one({}), walk)).toBe('Good match for a walk');
    const bike = { prefs: { ...ACTIVITY_PRESETS.bike.defaults, daylightOnly: false }, weights: ACTIVITY_PRESETS.bike.weights };
    const windy = one({ windKmh: 18, gustKmh: 20 }, bike); // W=.4 → 84, Good
    const windier = one({ windKmh: 22, gustKmh: 25 }, bike); // W=.6 → base 76, cap 88 → good
    const mixedWind = one({ windKmh: 24, gustKmh: 28, precipProbabilityPct: 10 }, bike);
    expect([windy.label, windier.label]).toEqual(['good', 'good']);
    expect(mixedWind.label).toBe('mixed');
    expect(summaryHeadline(mixedWind, ACTIVITY_PRESETS.bike)).toBe('A little windy for a bike ride');
    expect(summaryHeadline(one({ feelsLikeC: 33 }), walk)).toBe('Mixed conditions for a walk');
    expect(summaryHeadline(one({ precipProbabilityPct: 100 }), walk)).toBe('Poor match for your preferences');
    expect(summaryHeadline(one({ precipMm: null }), walk)).toBe('Limited data');
    expect(summaryHeadline(one({ weatherCodes: [95] }), walk)).toBe('Check conditions');
  });

  it('titles the top window and comparisons', () => {
    expect(bestWindowTitle(one({}))).toBe('Best match in the next 24 hours');
    expect(bestWindowTitle(one({ feelsLikeC: 33 }))).toBe('Best available: mixed conditions');
    const fmt = () => '3:00 PM';
    expect(comparisonText({ kind: 'better_later', start: T0 }, fmt)).toBe('A better match around 3:00 PM.');
    expect(comparisonText({ kind: 'now_is_best' }, fmt)).toBe('Now is one of your best windows.');
    expect(comparisonText({ kind: 'similar' }, fmt)).toBe('Conditions are similar across these windows.');
    expect(comparisonText({ kind: 'none' }, fmt)).toBeNull();
  });

  it('never uses prohibited safety or certainty language anywhere', () => {
    const texts: string[] = [
      ...Object.values(FLAG_COPY),
      ...[...REJECTION_ORDER, 'stale' as const].map((r) => emptyReasonText(r, '3:00 PM')),
      bestWindowTitle(one({})),
      bestWindowTitle(one({ feelsLikeC: 33 })),
    ];
    const rand = rng(99);
    for (const id of ACTIVITY_IDS) {
      for (let i = 0; i < 200; i++) {
        const p = ACTIVITY_PRESETS[id];
        const w = one(
          {
            feelsLikeC: -20 + rand() * 60,
            precipProbabilityPct: rand() * 100,
            precipMm: rand() * 12,
            windKmh: rand() * 60,
            gustKmh: rand() * 70,
            weatherCodes: [[0, 3, 45, 61, 95, 71][Math.floor(rand() * 6)] ?? 0],
          },
          { prefs: { ...p.defaults, daylightOnly: false }, weights: p.weights },
        );
        texts.push(summaryHeadline(w, p), ...explain(w, 'metric').map((r) => r.text), ...explain(w, 'us').map((r) => r.text));
      }
    }
    for (const t of texts) expect(t).not.toMatch(/\b(safe|unsafe|perfect|guarantee[ds]?|no rain)\b/i);
  });

  it('empty-reason copy matches the design', () => {
    expect(emptyReasonText('daylight')).toBe('No matching daylight window in the next 24 hours. Try another duration or include nighttime.');
    expect(emptyReasonText('flag')).toBe('No suggested window with the current forecast. Review the conditions below.');
    expect(emptyReasonText('stale', '9:15 AM')).toBe('Showing an earlier forecast retrieved at 9:15 AM. Suggestions are paused until it refreshes.');
  });
});
