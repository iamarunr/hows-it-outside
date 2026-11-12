/**
 * Validates an untrusted Open-Meteo forecast payload and maps it to the
 * normalized Forecast (spec 03 §1, §3). Pure: no network, browser or React.
 *
 * Invariants:
 * - The time axis is authoritative; unsorted times invalidate the response.
 * - Duplicate timestamps keep the first record (diagnostic recorded).
 * - Intervals exist only between samples exactly 3600 s apart.
 * - Per-field time semantics come from FIELD_SEMANTICS; no global index shift.
 * - Missing or invalid values become null; never zero; never clamped.
 */
import type { CurrentConditions, Forecast, Interval } from '../../domain/types';
import { isKnownWeatherCode } from '../../domain/weatherCodes';
import { resolveTimeZone } from '../../lib/time';
import {
  CURRENT_FIELDS,
  EXPECTED_CURRENT_UNITS,
  EXPECTED_HOURLY_UNITS,
  FIELD_SEMANTICS,
  HOURLY_FIELDS,
  type HourlyField,
} from './openMeteo';

export type NormalizeResult = { ok: true; forecast: Forecast } | { ok: false; reason: string };

const HOUR = 3600;
// Sanity bounds for epoch seconds: 2000-01-01 .. 2100-01-01.
const MIN_EPOCH = 946_684_800;
const MAX_EPOCH = 4_102_444_800;
// Physically implausible air temperatures are treated as invalid data (heuristic bound).
const TEMP_MIN_C = -100;
const TEMP_MAX_C = 70;

type FieldKind = 'temperature' | 'percent' | 'nonNegative' | 'code' | 'isDay';

const FIELD_KIND: Readonly<Record<HourlyField, FieldKind>> = {
  temperature_2m: 'temperature',
  apparent_temperature: 'temperature',
  relative_humidity_2m: 'percent',
  precipitation_probability: 'percent',
  precipitation: 'nonNegative',
  wind_speed_10m: 'nonNegative',
  wind_gusts_10m: 'nonNegative',
  weather_code: 'code',
  is_day: 'isDay',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class Diagnostics {
  private readonly set = new Set<string>();
  add(code: string): void {
    this.set.add(code);
  }
  list(): string[] {
    return [...this.set].sort();
  }
}

/** Validates one numeric sample by field kind. Returns null (with diagnostic) when invalid. */
function sample(raw: unknown, field: string, kind: FieldKind, diag: Diagnostics): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    diag.add(`non_numeric:${field}`);
    return null;
  }
  switch (kind) {
    case 'temperature':
      if (raw < TEMP_MIN_C || raw > TEMP_MAX_C) {
        diag.add(`out_of_range:${field}`);
        return null;
      }
      return raw;
    case 'percent':
      if (raw < 0 || raw > 100) {
        diag.add(`out_of_range:${field}`);
        return null;
      }
      return raw;
    case 'nonNegative':
      if (raw < 0) {
        diag.add(`out_of_range:${field}`);
        return null;
      }
      return raw;
    case 'code':
      if (!Number.isInteger(raw)) {
        diag.add(`non_numeric:${field}`);
        return null;
      }
      if (!isKnownWeatherCode(raw)) {
        diag.add('unknown_weather_code');
        return null;
      }
      return raw;
    case 'isDay':
      if (raw === 0 || raw === 1) return raw;
      diag.add(`out_of_range:${field}`);
      return null;
  }
}

/** Returns field samples aligned to the kept time indexes, or all-null when the field is unusable. */
function fieldSeries(
  hourly: Record<string, unknown>,
  units: Record<string, unknown>,
  field: HourlyField,
  timeLength: number,
  keep: readonly number[],
  diag: Diagnostics,
): (number | null)[] {
  const expectedUnit = EXPECTED_HOURLY_UNITS[field];
  if (expectedUnit !== undefined && units[field] !== expectedUnit) {
    diag.add(`unit_mismatch:${field}`);
    return keep.map(() => null);
  }
  const raw = hourly[field];
  if (!Array.isArray(raw)) {
    diag.add(`missing_field:${field}`);
    return keep.map(() => null);
  }
  if (raw.length !== timeLength) diag.add(`length_mismatch:${field}`);
  const kind = FIELD_KIND[field];
  return keep.map((i) => (i < raw.length ? sample(raw[i], field, kind, diag) : null));
}

function daylight(a: number | null, b: number | null): boolean | null {
  if (a === 0 || b === 0) return false;
  if (a === 1 && b === 1) return true;
  return null;
}

function pick(series: (number | null)[], i: number, field: HourlyField): number | null {
  const index = FIELD_SEMANTICS[field] === 'preceding_hour' ? i + 1 : i;
  return series[index] ?? null;
}

function normalizeCurrent(payload: Record<string, unknown>, diag: Diagnostics): CurrentConditions | null {
  const current = payload['current'];
  if (!isRecord(current)) {
    diag.add('missing_current');
    return null;
  }
  const units = isRecord(payload['current_units']) ? payload['current_units'] : {};
  const time = current['time'];
  if (units['time'] !== 'unixtime' || typeof time !== 'number' || !Number.isInteger(time) || time < MIN_EPOCH || time > MAX_EPOCH) {
    diag.add('invalid_current_time');
    return null;
  }
  const read = (field: (typeof CURRENT_FIELDS)[number]): number | null => {
    const expected = EXPECTED_CURRENT_UNITS[field];
    if (expected !== undefined && units[field] !== expected) {
      diag.add(`unit_mismatch:current.${field}`);
      return null;
    }
    return sample(current[field], `current.${field}`, FIELD_KIND[field], diag);
  };
  return {
    time,
    temperatureC: read('temperature_2m'),
    feelsLikeC: read('apparent_temperature'),
    humidityPct: read('relative_humidity_2m'),
    windKmh: read('wind_speed_10m'),
    gustKmh: read('wind_gusts_10m'),
    weatherCode: read('weather_code'),
  };
}

export function normalizeForecast(
  payload: unknown,
  context: { locationKey: string; fetchedAt: number },
): NormalizeResult {
  if (!isRecord(payload)) return { ok: false, reason: 'not_an_object' };
  const hourly = payload['hourly'];
  const units = payload['hourly_units'];
  if (!isRecord(hourly)) return { ok: false, reason: 'missing_hourly' };
  if (!isRecord(units) || units['time'] !== 'unixtime') return { ok: false, reason: 'invalid_time_units' };
  const time = hourly['time'];
  if (!Array.isArray(time) || time.length === 0) return { ok: false, reason: 'missing_time' };

  const diag = new Diagnostics();
  const keep: number[] = [];
  const times: number[] = [];
  for (let i = 0; i < time.length; i++) {
    const t: unknown = time[i];
    if (typeof t !== 'number' || !Number.isInteger(t) || t < MIN_EPOCH || t > MAX_EPOCH) {
      return { ok: false, reason: 'invalid_timestamp' };
    }
    const prev = times.at(-1);
    if (prev !== undefined && t < prev) return { ok: false, reason: 'unsorted_time' };
    if (prev !== undefined && t === prev) {
      diag.add('duplicate_timestamp');
      continue;
    }
    keep.push(i);
    times.push(t);
  }

  const series = Object.fromEntries(
    HOURLY_FIELDS.map((f) => [f, fieldSeries(hourly, units, f, time.length, keep, diag)]),
  ) as Record<HourlyField, (number | null)[]>;

  const intervals: Interval[] = [];
  for (let i = 0; i + 1 < times.length; i++) {
    const start = times[i];
    const end = times[i + 1];
    if (start === undefined || end === undefined) continue;
    if (end - start !== HOUR) {
      diag.add('time_gap');
      continue;
    }
    const c0 = series.weather_code[i] ?? null;
    const c1 = series.weather_code[i + 1] ?? null;
    const weatherCodes = [...new Set([c0, c1].filter((c): c is number => c !== null))];
    intervals.push({
      start,
      end,
      temperatureC: pick(series.temperature_2m, i, 'temperature_2m'),
      feelsLikeC: pick(series.apparent_temperature, i, 'apparent_temperature'),
      humidityPct: pick(series.relative_humidity_2m, i, 'relative_humidity_2m'),
      windKmh: pick(series.wind_speed_10m, i, 'wind_speed_10m'),
      gustKmh: pick(series.wind_gusts_10m, i, 'wind_gusts_10m'),
      precipMm: pick(series.precipitation, i, 'precipitation'),
      precipProbabilityPct: pick(series.precipitation_probability, i, 'precipitation_probability'),
      weatherCodes,
      weatherCodeComplete: c0 !== null && c1 !== null,
      daylight: daylight(series.is_day[i] ?? null, series.is_day[i + 1] ?? null),
    });
  }

  const tz = resolveTimeZone(typeof payload['timezone'] === 'string' ? payload['timezone'] : undefined);
  if (tz.fallback) diag.add('invalid_timezone');

  const current = normalizeCurrent(payload, diag);

  return {
    ok: true,
    forecast: {
      schemaVersion: 1,
      provider: 'open-meteo',
      locationKey: context.locationKey,
      timezone: tz.timezone,
      timezoneFallback: tz.fallback,
      fetchedAt: context.fetchedAt,
      current,
      intervals,
      diagnostics: diag.list(),
    },
  };
}
