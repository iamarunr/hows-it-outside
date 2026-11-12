/**
 * Synthetic Open-Meteo forecast payloads for E2E tests (clearly not real weather).
 * Shape matches the captured live sample (tests/fixtures/forecast/open-meteo-sample-st-louis.json).
 * Invariant exercised: the app renders exactly the provided values, labels them in the
 * target zone, and treats null as unavailable.
 */

export type SyntheticOptions = {
  /** First hourly timestamp (epoch seconds, on the hour). */
  start: number;
  hours?: number;
  timezone: string;
  utcOffsetSeconds?: number;
  /** Per-hour overrides by index. */
  hourly?: (i: number) => Partial<Record<string, number | null>>;
  current?: Partial<Record<string, number | null>> & { time: number };
  latitude?: number;
  longitude?: number;
};

const BASE: Record<string, number> = {
  temperature_2m: 18,
  apparent_temperature: 17,
  relative_humidity_2m: 55,
  precipitation_probability: 5,
  precipitation: 0,
  weather_code: 1,
  wind_speed_10m: 8,
  wind_gusts_10m: 15,
  is_day: 1,
};

export function syntheticForecast(o: SyntheticOptions): Record<string, unknown> {
  const hours = o.hours ?? 72;
  const time = Array.from({ length: hours }, (_, i) => o.start + i * 3600);
  const hourly: Record<string, (number | null)[]> = { time };
  for (const field of Object.keys(BASE)) {
    hourly[field] = time.map((_, i) => {
      const v = o.hourly?.(i)[field];
      return v === undefined ? (BASE[field] ?? null) : v;
    });
  }
  const current = o.current ?? { time: o.start };
  return {
    latitude: o.latitude ?? 0,
    longitude: o.longitude ?? 0,
    generationtime_ms: 0.1,
    utc_offset_seconds: o.utcOffsetSeconds ?? 0,
    timezone: o.timezone,
    timezone_abbreviation: 'GMT',
    elevation: 10,
    current_units: {
      time: 'unixtime',
      interval: 'seconds',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      weather_code: 'wmo code',
      wind_speed_10m: 'km/h',
      wind_gusts_10m: 'km/h',
    },
    current: {
      interval: 900,
      temperature_2m: 18,
      apparent_temperature: 17,
      relative_humidity_2m: 55,
      weather_code: 1,
      wind_speed_10m: 8,
      wind_gusts_10m: 15,
      ...current,
    },
    hourly_units: {
      time: 'unixtime',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      precipitation_probability: '%',
      precipitation: 'mm',
      weather_code: 'wmo code',
      wind_speed_10m: 'km/h',
      wind_gusts_10m: 'km/h',
      is_day: '',
    },
    hourly,
  };
}

export function place(id: number, name: string, admin1: string, country: string, lat: number, lon: number, timezone: string) {
  return { id, name, latitude: lat, longitude: lon, admin1, country, country_code: 'XX', timezone };
}
