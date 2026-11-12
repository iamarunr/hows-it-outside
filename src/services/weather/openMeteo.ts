/**
 * Open-Meteo forecast request contract (spec 03 §2) and the field-to-time
 * semantics registry (spec 03 §3). The registry is the single source of truth
 * for which sample (interval start or end) feeds each normalized field.
 */
import { ENDPOINTS } from '../../lib/config';
import type { Coordinates } from '../../lib/geo';

export const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'is_day',
] as const;

export const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
] as const;

export type HourlyField = (typeof HOURLY_FIELDS)[number];

/**
 * 'instant': value at the timestamp → use interval start t[i].
 * 'preceding_hour': summary of the hour ending at the timestamp → use interval end t[i+1].
 * 'both_boundaries': evaluated at both endpoints (weather code, is_day).
 */
export type TimeSemantics = 'instant' | 'preceding_hour' | 'both_boundaries';

export const FIELD_SEMANTICS: Readonly<Record<HourlyField, TimeSemantics>> = {
  temperature_2m: 'instant',
  apparent_temperature: 'instant',
  relative_humidity_2m: 'instant',
  wind_speed_10m: 'instant',
  precipitation: 'preceding_hour',
  precipitation_probability: 'preceding_hour',
  wind_gusts_10m: 'preceding_hour',
  weather_code: 'both_boundaries',
  is_day: 'both_boundaries',
};

/** Units the adapter requests and requires; time axis must be unixtime. */
export const EXPECTED_HOURLY_UNITS: Readonly<Partial<Record<HourlyField | 'time', string>>> = {
  time: 'unixtime',
  temperature_2m: '°C',
  apparent_temperature: '°C',
  relative_humidity_2m: '%',
  precipitation_probability: '%',
  precipitation: 'mm',
  wind_speed_10m: 'km/h',
  wind_gusts_10m: 'km/h',
};

export const EXPECTED_CURRENT_UNITS: Readonly<Record<string, string>> = {
  time: 'unixtime',
  temperature_2m: '°C',
  apparent_temperature: '°C',
  relative_humidity_2m: '%',
  wind_speed_10m: 'km/h',
  wind_gusts_10m: 'km/h',
};

/** Canonical, ordered request options; also used to build the cache key. */
export const REQUEST_OPTIONS = {
  temperature_unit: 'celsius',
  wind_speed_unit: 'kmh',
  precipitation_unit: 'mm',
  timezone: 'auto',
  timeformat: 'unixtime',
  forecast_days: '3',
  daily: 'sunrise,sunset',
} as const;

export function buildForecastUrl(coords: Coordinates): URL {
  const url = new URL(ENDPOINTS.forecast);
  url.search = new URLSearchParams({
    latitude: coords.latitude.toFixed(2),
    longitude: coords.longitude.toFixed(2),
    hourly: HOURLY_FIELDS.join(','),
    current: CURRENT_FIELDS.join(','),
    ...REQUEST_OPTIONS,
  }).toString();
  return url;
}
