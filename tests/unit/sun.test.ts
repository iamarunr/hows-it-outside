import { describe, expect, it } from 'vitest';
import { clockSunState, reconcileSun, sunState } from '../../src/domain/sun';

const at = (iso: string) => Date.parse(iso) / 1000;
const LONDON = [51.5072, -0.1276] as const;
const CHENNAI = [13.0827, 80.2707] as const;
const SYDNEY = [-33.8688, 151.2093] as const;
const TROMSO = [69.6492, 18.9553] as const;

describe('sunState', () => {
  it('puts the sun at the top of its arc at solar noon', () => {
    const s = sunState(...LONDON, at('2026-03-20T12:08:00Z'));
    expect(s.body).toBe('sun');
    expect(s.arc).toBeGreaterThan(0.47);
    expect(s.arc).toBeLessThan(0.53);
    expect(s.low).toBeNull();
  });

  it('shows the moon halfway through the night at local midnight', () => {
    const s = sunState(...LONDON, at('2026-03-20T00:08:00Z'));
    expect(s.body).toBe('moon');
    expect(s.arc).toBeGreaterThan(0.45);
    expect(s.arc).toBeLessThan(0.55);
  });

  it('matches known sunrise and sunset times to within a few minutes', () => {
    // London, 20 March 2026: sunrise ≈ 06:03 UTC, sunset ≈ 18:14 UTC.
    expect(sunState(...LONDON, at('2026-03-20T05:50:00Z')).body).toBe('moon');
    expect(sunState(...LONDON, at('2026-03-20T06:15:00Z'))).toMatchObject({ body: 'sun', low: 'rising' });
    expect(sunState(...LONDON, at('2026-03-20T18:00:00Z'))).toMatchObject({ body: 'sun', low: 'setting' });
    expect(sunState(...LONDON, at('2026-03-20T18:30:00Z')).body).toBe('moon');
    // Sydney, 21 December 2026 (southern summer): sunrise ≈ 18:41 UTC the day before, sunset ≈ 09:05 UTC.
    expect(sunState(...SYDNEY, at('2026-12-21T08:50:00Z'))).toMatchObject({ body: 'sun', low: 'setting' });
    expect(sunState(...SYDNEY, at('2026-12-21T09:20:00Z')).body).toBe('moon');
  });

  it('follows longitude: Chennai is in daylight while London is dark', () => {
    const t = at('2026-06-01T02:30:00Z');
    expect(sunState(...CHENNAI, t).body).toBe('sun');
    expect(sunState(...LONDON, t).body).toBe('moon');
  });

  it('handles polar night and midnight sun without a dawn or dusk', () => {
    expect(sunState(...TROMSO, at('2026-12-21T11:00:00Z'))).toMatchObject({ body: 'moon' });
    expect(sunState(...TROMSO, at('2026-06-21T23:00:00Z'))).toMatchObject({ body: 'sun', low: null });
  });

  it('keeps the arc within 0–1 for every hour of a year, at several latitudes', () => {
    for (const lat of [-89, -60, -33, 0, 13, 51, 69, 89]) {
      for (let h = 0; h < 366 * 24; h += 5) {
        const s = sunState(lat, 20, at('2026-01-01T00:00:00Z') + h * 3600);
        expect(s.arc).toBeGreaterThanOrEqual(0);
        expect(s.arc).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('clockSunState', () => {
  it.each([
    [12, 'sun', 0.5, null],
    [6.25, 'sun', 0.0208, 'rising'],
    [17.5, 'sun', 0.9583, 'setting'],
    [9, 'sun', 0.25, null],
    [0, 'moon', 0.5, null],
    [21, 'moon', 0.25, null],
    [5.9, 'moon', 0.9917, null],
  ] as const)('%s:00 → %s at %s', (hour, body, arc, low) => {
    const s = clockSunState(hour);
    expect(s.body).toBe(body);
    expect(s.arc).toBeCloseTo(arc, 3);
    expect(s.low).toBe(low);
  });
});

describe('reconcileSun', () => {
  const settingSun = { body: 'sun', arc: 0.96, low: 'setting' } as const;
  it('keeps the formula when the forecast agrees or has no flag', () => {
    expect(reconcileSun(settingSun, true)).toBe(settingSun);
    expect(reconcileSun(settingSun, null)).toBe(settingSun);
  });
  it('parks the moon at the start of the night when the forecast already says night', () => {
    expect(reconcileSun(settingSun, false)).toEqual({ body: 'moon', arc: 0.03, low: null });
  });
  it('parks the moon at the end of the night when the sun is only just up by the formula', () => {
    expect(reconcileSun({ body: 'sun', arc: 0.02, low: 'rising' }, false)).toEqual({ body: 'moon', arc: 0.97, low: null });
  });
  it('parks the sun low when the forecast says day but the formula says night', () => {
    expect(reconcileSun({ body: 'moon', arc: 0.98, low: null }, true)).toEqual({ body: 'sun', arc: 0.03, low: null });
    expect(reconcileSun({ body: 'moon', arc: 0.02, low: null }, true)).toEqual({ body: 'sun', arc: 0.97, low: null });
  });
});
