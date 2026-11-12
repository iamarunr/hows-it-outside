import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeForecast } from '../../src/services/weather/normalize';
import { buildForecastUrl, FIELD_SEMANTICS } from '../../src/services/weather/openMeteo';

type Payload = {
  timezone?: unknown;
  hourly: Record<string, unknown[]>;
  hourly_units: Record<string, string>;
  current?: unknown;
  current_units?: unknown;
  expectedIntervals?: unknown;
};

function load(path: string): Payload {
  return JSON.parse(readFileSync(new URL(`../fixtures/${path}`, import.meta.url), 'utf8')) as Payload;
}

const ctx = { locationKey: '0.00,0.00', fetchedAt: 1794736800 };

function normalized(payload: unknown) {
  const result = normalizeForecast(payload, ctx);
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
  return result.forecast;
}

function mapping(): Payload {
  return structuredClone(load('forecast/temporal-mapping.json'));
}

describe('temporal mapping (ADR-007)', () => {
  it('produces exactly the fixture contract', () => {
    const fixture = mapping();
    const forecast = normalized(fixture);
    expect(forecast.intervals).toEqual(fixture.expectedIntervals);
    expect(forecast.diagnostics).toEqual(['missing_current']);
  });

  it('takes instant fields from t0 and preceding-hour fields from t1 (no single index shift)', () => {
    const [first] = normalized(mapping()).intervals;
    expect(first?.temperatureC).toBe(10.1); // t0
    expect(first?.windKmh).toBe(5.5); // t0
    expect(first?.precipMm).toBe(0.4); // t1
    expect(first?.precipProbabilityPct).toBe(40); // t1
    expect(first?.gustKmh).toBe(20.5); // t1
  });

  it('keeps the field semantics registry explicit', () => {
    expect(FIELD_SEMANTICS).toMatchObject({
      temperature_2m: 'instant',
      apparent_temperature: 'instant',
      relative_humidity_2m: 'instant',
      wind_speed_10m: 'instant',
      precipitation: 'preceding_hour',
      precipitation_probability: 'preceding_hour',
      wind_gusts_10m: 'preceding_hour',
      weather_code: 'both_boundaries',
      is_day: 'both_boundaries',
    });
  });

  it('does not mutate the input', () => {
    const input = mapping();
    const copy = structuredClone(input);
    normalized(input);
    expect(input).toEqual(copy);
  });
});

describe('input shape', () => {
  it('keeps nulls as null, never zero', () => {
    const p = mapping();
    p.hourly['precipitation_probability'] = [0, null, 80];
    p.hourly['precipitation'] = [null, null, 0];
    const [a, b] = normalized(p).intervals;
    expect(a?.precipProbabilityPct).toBeNull();
    expect(a?.precipMm).toBeNull();
    expect(b?.precipProbabilityPct).toBe(80);
    expect(b?.precipMm).toBe(0);
  });

  it('treats a missing field as all-null with a diagnostic', () => {
    const p = mapping();
    delete p.hourly['wind_gusts_10m'];
    const f = normalized(p);
    expect(f.intervals.every((i) => i.gustKmh === null)).toBe(true);
    expect(f.diagnostics).toContain('missing_field:wind_gusts_10m');
  });

  it('pads short arrays with null and keeps the time axis authoritative', () => {
    const p = mapping();
    p.hourly['temperature_2m'] = [10.1];
    const f = normalized(p);
    expect(f.intervals).toHaveLength(2);
    expect(f.intervals.map((i) => i.temperatureC)).toEqual([10.1, null]);
    expect(f.diagnostics).toContain('length_mismatch:temperature_2m');
  });

  it('drops duplicate timestamps keeping the first record', () => {
    const p = mapping();
    const t = p.hourly['time'] as number[];
    p.hourly['time'] = [t[0], t[0], t[1], t[2]];
    for (const key of Object.keys(p.hourly)) {
      if (key === 'time') continue;
      const values = p.hourly[key] as unknown[];
      p.hourly[key] = [values[0], 999, values[1], values[2]];
    }
    const f = normalized(p);
    expect(f.diagnostics).toContain('duplicate_timestamp');
    expect(f.intervals.map((i) => i.temperatureC)).toEqual([10.1, 11.1]);
  });

  it('rejects unsorted time arrays rather than reordering them', () => {
    const p = mapping();
    p.hourly['time'] = [...(p.hourly['time'] as number[])].reverse();
    expect(normalizeForecast(p, ctx)).toEqual({ ok: false, reason: 'unsorted_time' });
  });

  it('creates no interval across a gap', () => {
    const p = mapping();
    const t = p.hourly['time'] as number[];
    p.hourly['time'] = [t[0], t[1], (t[2] ?? 0) + 1800];
    const f = normalized(p);
    expect(f.intervals.map((i) => i.start)).toEqual([t[0]]);
    expect(f.diagnostics).toContain('time_gap');
  });

  it('nulls a field whose unit does not match the request', () => {
    const p = mapping();
    p.hourly_units['wind_speed_10m'] = 'mph';
    const f = normalized(p);
    expect(f.intervals.every((i) => i.windKmh === null)).toBe(true);
    expect(f.diagnostics).toContain('unit_mismatch:wind_speed_10m');
  });

  it('rejects a non-unixtime axis and non-object payloads', () => {
    const p = mapping();
    p.hourly_units['time'] = 'iso8601';
    expect(normalizeForecast(p, ctx).ok).toBe(false);
    expect(normalizeForecast(null, ctx).ok).toBe(false);
    expect(normalizeForecast('x', ctx).ok).toBe(false);
    expect(normalizeForecast({ hourly: {} }, ctx).ok).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    const p = mapping();
    p.hourly['time'] = [1.5, 2, 3];
    expect(normalizeForecast(p, ctx)).toEqual({ ok: false, reason: 'invalid_timestamp' });
  });

  it('nulls out-of-range percentages and negative amounts instead of clamping', () => {
    const p = mapping();
    p.hourly['precipitation_probability'] = [0, 101, -1];
    p.hourly['precipitation'] = [0, -0.1, 1];
    p.hourly['wind_speed_10m'] = [-1, 5, 5];
    const [a, b] = normalized(p).intervals;
    expect(a?.precipProbabilityPct).toBeNull();
    expect(b?.precipProbabilityPct).toBeNull();
    expect(a?.precipMm).toBeNull();
    expect(a?.windKmh).toBeNull();
    expect(normalized(p).diagnostics).toEqual(
      expect.arrayContaining(['out_of_range:precipitation_probability', 'out_of_range:precipitation']),
    );
  });

  it('rejects non-numeric samples', () => {
    const p = mapping();
    p.hourly['apparent_temperature'] = ['9', 10.2, 11.2];
    expect(normalized(p).intervals[0]?.feelsLikeC).toBeNull();
  });

  it('marks unknown or missing weather codes incomplete', () => {
    const p = mapping();
    p.hourly['weather_code'] = [1, 42, null];
    const [a, b] = normalized(p).intervals;
    expect(a).toMatchObject({ weatherCodes: [1], weatherCodeComplete: false });
    expect(b).toMatchObject({ weatherCodes: [], weatherCodeComplete: false });
    expect(normalized(p).diagnostics).toContain('unknown_weather_code');
  });

  it('accepts thunderstorm code 97', () => {
    const p = mapping();
    p.hourly['weather_code'] = [97, 97, 97];
    expect(normalized(p).intervals[0]).toMatchObject({ weatherCodes: [97], weatherCodeComplete: true });
  });
});

describe('daylight (conservative)', () => {
  const cases: [unknown, unknown, boolean | null][] = [
    [1, 1, true],
    [1, 0, false], // dusk hour excluded
    [0, 1, false], // dawn hour excluded
    [0, 0, false],
    [1, null, null],
    [null, 0, false],
    [null, null, null],
  ];
  it.each(cases)('is_day %s → %s gives %s', (a, b, expected) => {
    const p = mapping();
    p.hourly['is_day'] = [a, b, 1];
    expect(normalized(p).intervals[0]?.daylight).toBe(expected);
  });
});

describe('time zone', () => {
  it('falls back to UTC with an explicit flag for invalid zones', () => {
    const p = mapping();
    p.timezone = 'Mars/Olympus_Mons';
    const f = normalized(p);
    expect(f.timezone).toBe('UTC');
    expect(f.timezoneFallback).toBe(true);
    expect(f.diagnostics).toContain('invalid_timezone');
  });
});

describe('current conditions', () => {
  it('validates current independently of hourly data', () => {
    const p = mapping();
    p.current = { time: 1794736800, interval: 900, temperature_2m: 10, apparent_temperature: 8, relative_humidity_2m: 140, weather_code: 3, wind_speed_10m: 4, wind_gusts_10m: 9 };
    p.current_units = { time: 'unixtime', interval: 'seconds', temperature_2m: '°C', apparent_temperature: '°C', relative_humidity_2m: '%', weather_code: 'wmo code', wind_speed_10m: 'km/h', wind_gusts_10m: 'km/h' };
    expect(normalized(p).current).toEqual({
      time: 1794736800,
      temperatureC: 10,
      feelsLikeC: 8,
      humidityPct: null,
      windKmh: 4,
      gustKmh: 9,
      weatherCode: 3,
    });
  });

  it('keeps valid hourly data when current is missing or broken', () => {
    const p = mapping();
    p.current = { time: 'now' };
    const f = normalized(p);
    expect(f.current).toBeNull();
    expect(f.intervals).toHaveLength(2);
  });
});

describe('captured live sample', () => {
  it('normalizes with no diagnostics into 71 hourly intervals', () => {
    const f = normalized(load('forecast/open-meteo-sample-st-louis.json'));
    expect(f.diagnostics).toEqual([]);
    expect(f.intervals).toHaveLength(71);
    expect(f.timezone).toBe('America/Chicago');
    expect(f.current).not.toBeNull();
  });
});

describe('request URL', () => {
  it('uses fixed origin, rounded coordinates and SI units', () => {
    const url = buildForecastUrl({ latitude: 0, longitude: -0.1 });
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('0.00');
    expect(url.searchParams.get('longitude')).toBe('-0.10');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('forecast_days')).toBe('3');
  });
});
