/**
 * M0 live field-availability check (spec 03-DATA-AND-API §2).
 * Requests the exact production forecast parameters for public city-centre
 * coordinates and reports, per field, the share of null values. Writes a
 * sanitized report to docs/FIELD-AVAILABILITY.md. Manual smoke tool: never
 * run in unit CI. Uses city-level coordinates only.
 */
import { writeFile } from 'node:fs/promises';

const HOURLY = [
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
const CURRENT = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
] as const;
const CRITICAL = new Set(['apparent_temperature', 'precipitation_probability', 'precipitation', 'weather_code', 'wind_speed_10m', 'wind_gusts_10m']);
const EXPECTED_UNITS: Record<string, string> = {
  temperature_2m: '°C',
  apparent_temperature: '°C',
  relative_humidity_2m: '%',
  precipitation_probability: '%',
  precipitation: 'mm',
  wind_speed_10m: 'km/h',
  wind_gusts_10m: 'km/h',
  time: 'unixtime',
};

const CITIES = [
  { name: 'St. Louis, US', lat: 38.63, lon: -90.2 },
  { name: 'London, GB', lat: 51.51, lon: -0.13 },
  { name: 'Chennai, IN', lat: 13.08, lon: 80.27 },
  { name: 'Sydney, AU', lat: -33.87, lon: 151.21 },
  { name: 'Tromsø, NO', lat: 69.65, lon: 18.96 },
  { name: 'Nairobi, KE', lat: -1.29, lon: 36.82 },
  { name: 'São Paulo, BR', lat: -23.55, lon: -46.63 },
  { name: 'Kathmandu, NP', lat: 27.72, lon: 85.32 },
] as const;

type Row = {
  city: string;
  timezone: string;
  hours: number;
  hourlyNull72: Record<string, number>;
  hourlyNull24: Record<string, number>;
  currentNull: string[];
  unitProblems: string[];
  timeProblems: string[];
};

function url(lat: number, lon: number): URL {
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: HOURLY.join(','),
    current: CURRENT.join(','),
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '3',
  }).toString();
  return u;
}

function nullShare(values: unknown, start: number, end: number): number {
  if (!Array.isArray(values)) return 1;
  let nulls = 0;
  for (let i = start; i < end; i++) if (values[i] === null || values[i] === undefined) nulls++;
  return end > start ? nulls / (end - start) : 1;
}

type Payload = {
  timezone?: string;
  hourly?: Record<string, unknown[]>;
  hourly_units?: Record<string, string>;
  current?: Record<string, unknown>;
  current_units?: Record<string, string>;
};

async function check(city: (typeof CITIES)[number]): Promise<Row> {
  const res = await fetch(url(city.lat, city.lon), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${city.name}: HTTP ${res.status}`);
  const data = (await res.json()) as Payload;
  const hourly = data.hourly ?? {};
  const time = (hourly['time'] ?? []) as number[];
  const nowSec = Math.floor(Date.now() / 1000);
  const first = Math.max(0, time.findIndex((t) => t > nowSec) - 1);
  // Next 24 intervals need 25 boundary samples.
  const end24 = Math.min(time.length, first + 25);

  const timeProblems: string[] = [];
  for (let i = 1; i < time.length; i++) {
    const a = time[i - 1];
    const b = time[i];
    if (a === undefined || b === undefined || b - a !== 3600) timeProblems.push(`step ${i}: ${String(b)}-${String(a)}`);
  }
  const unitProblems: string[] = [];
  for (const [field, unit] of Object.entries(EXPECTED_UNITS)) {
    const got = data.hourly_units?.[field];
    if (got !== undefined && got !== unit) unitProblems.push(`${field}=${got}`);
  }
  return {
    city: city.name,
    timezone: data.timezone ?? '(missing)',
    hours: time.length,
    hourlyNull72: Object.fromEntries(HOURLY.map((f) => [f, nullShare(hourly[f], 0, time.length)])),
    hourlyNull24: Object.fromEntries(HOURLY.map((f) => [f, nullShare(hourly[f], first, end24)])),
    currentNull: CURRENT.filter((f) => data.current?.[f] === null || data.current?.[f] === undefined),
    unitProblems,
    timeProblems,
  };
}

function pct(x: number | undefined): string {
  return x === undefined ? '—' : `${Math.round(x * 100)}%`;
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const city of CITIES) {
    rows.push(await check(city));
    await new Promise((r) => setTimeout(r, 300));
  }
  const header = `| City | Time zone | Hours | ${HOURLY.join(' | ')} |\n|---|---|---:|${HOURLY.map(() => '---:').join('|')}|`;
  const table = (key: 'hourlyNull72' | 'hourlyNull24') =>
    [header, ...rows.map((r) => `| ${r.city} | ${r.timezone} | ${r.hours} | ${HOURLY.map((f) => pct(r[key][f])).join(' | ')} |`)].join('\n');

  const criticalGaps = rows.flatMap((r) =>
    HOURLY.filter((f) => CRITICAL.has(f) && (r.hourlyNull24[f] ?? 1) > 0).map((f) => `${r.city}: ${f} ${pct(r.hourlyNull24[f])} null in next 24 h`),
  );

  const report = `# Field-availability check (M0)

Run: ${new Date().toISOString()} · Script: \`npm run field-check\` · Provider: Open-Meteo hosted forecast API.
Exact production parameters (DATA-AND-API §2). City-centre coordinates only; no personal location.
This is a point-in-time sample, not a guarantee. Re-run before release and after provider changes.

## Null share, next 24 hours (25 boundary samples)

${table('hourlyNull24')}

## Null share, full 72-hour response

${table('hourlyNull72')}

## Current block

${rows.map((r) => `- ${r.city}: ${r.currentNull.length === 0 ? 'all fields present' : `null: ${r.currentNull.join(', ')}`}`).join('\n')}

## Units and time axis

${rows.map((r) => `- ${r.city}: units ${r.unitProblems.length === 0 ? 'as requested' : r.unitProblems.join(', ')}; time steps ${r.timeProblems.length === 0 ? 'all 3600 s' : r.timeProblems.join(', ')}`).join('\n')}

## Critical fields missing within the 24-hour horizon

${criticalGaps.length === 0 ? 'None in this sample.' : criticalGaps.map((g) => `- ${g}`).join('\n')}
`;
  await writeFile(new URL('../docs/FIELD-AVAILABILITY.md', import.meta.url), report);
  console.log(report);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
