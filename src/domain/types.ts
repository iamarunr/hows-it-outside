/**
 * Canonical domain types (spec 03-DATA-AND-API §1). Internal units are SI:
 * °C, km/h, mm, percent 0–100, seconds; timestamps are UTC epoch seconds.
 * Pure types only: no runtime imports.
 */

export type ActivityId = 'outdoors' | 'walk' | 'run' | 'bike' | 'hangout';

export type RainTolerance = 'avoid' | 'light' | 'okay';
export type WindTolerance = 'low' | 'medium' | 'high';
export type DurationMinutes = 30 | 60 | 90 | 120;

export type Location = {
  key: string;
  latitude: number;
  longitude: number;
  label: string;
  source: 'search' | 'device';
  countryCode?: string;
  timezone?: string;
};

/** Hourly interval [start, end), normally 3600 seconds. */
export type Interval = {
  start: number;
  end: number;
  temperatureC: number | null;
  feelsLikeC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  precipMm: number | null;
  precipProbabilityPct: number | null;
  /** Known codes from both boundary samples (deduplicated, in sample order). */
  weatherCodes: number[];
  /** True only when both boundary codes are present and recognized. */
  weatherCodeComplete: boolean;
  /** True only if both endpoints are daytime; false if either is night; null otherwise. */
  daylight: boolean | null;
};

export type CurrentConditions = {
  time: number;
  temperatureC: number | null;
  feelsLikeC: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  humidityPct: number | null;
  weatherCode: number | null;
};

export type Forecast = {
  schemaVersion: 1;
  provider: 'open-meteo';
  locationKey: string;
  /** IANA zone used for display. 'UTC' when the provider zone was invalid (see timezoneFallback). */
  timezone: string;
  /** True when the provider zone was missing/invalid and UTC is used; the UI must show a warning. */
  timezoneFallback: boolean;
  fetchedAt: number;
  current: CurrentConditions | null;
  intervals: Interval[];
  /** Generic diagnostic codes; never contain coordinates, queries or payload text. */
  diagnostics: string[];
};

export type ActivityPreferences = {
  comfortLowC: number;
  comfortHighC: number;
  rain: RainTolerance;
  wind: WindTolerance;
  daylightOnly: boolean;
};

export type Weights = { temperature: number; precipitation: number; wind: number };

export type Dimension = 'temperature' | 'precipitation' | 'wind';
export type DimensionValues = Record<Dimension, number>;

export type FlagId =
  | 'thunderstorm'
  | 'freezing_precip'
  | 'strong_gusts'
  | 'high_heat'
  | 'severe_cold'
  | 'heavy_precip'
  | 'snow_or_ice_concern';

export type NoteId = 'fog';

export type MatchLabel = 'good' | 'mixed' | 'poor' | 'limited' | 'check';

/** Fields whose absence prevents a score (spec SCORING §4). */
export type CriticalField =
  | 'feelsLikeC'
  | 'windKmh'
  | 'gustKmh'
  | 'precipMm'
  | 'precipProbabilityPct'
  | 'weatherCode';
