import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../fixtures/', import.meta.url).pathname;

function allFixtures(): { path: string; data: Record<string, unknown> }[] {
  return readdirSync(ROOT, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => {
      const path = join(e.parentPath, e.name);
      return { path, data: JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown> };
    });
}

describe('fixture conventions', () => {
  it('every fixture declares whether it is synthetic and the invariant it exercises', () => {
    const fixtures = allFixtures();
    expect(fixtures.length).toBeGreaterThan(0);
    for (const { path, data } of fixtures) {
      const meta = data['_fixture'] as { synthetic?: unknown; invariant?: unknown } | undefined;
      expect(typeof meta?.synthetic, path).toBe('boolean');
      expect(typeof meta?.invariant, path).toBe('string');
    }
  });
});

type LocalTime = { date: string; time: string; offsetMinutes: number };
type TzCase = { id: string; timezone: string; epochs: number[]; expectedLocal: LocalTime[]; expectFallback?: string };

function wallClock(epoch: number, timeZone: string): LocalTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    })
      .formatToParts(epoch * 1000)
      .map((p) => [p.type, p.value]),
  );
  const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(String(parts['timeZoneName']));
  const offset = m?.[1] === undefined ? 0 : (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  return { date: `${parts['year']}-${parts['month']}-${parts['day']}`, time: `${parts['hour']}:${parts['minute']}`, offsetMinutes: offset };
}

describe('time-zone fixture is itself correct', () => {
  const fixture = JSON.parse(readFileSync(join(ROOT, 'time/timezones.json'), 'utf8')) as { cases: TzCase[] };

  it.each(fixture.cases)('$id', (c) => {
    const zone = c.expectFallback ?? c.timezone;
    if (c.expectFallback !== undefined) {
      expect(() => new Intl.DateTimeFormat('en', { timeZone: c.timezone })).toThrow(RangeError);
    }
    expect(c.epochs.map((t) => wallClock(t, zone))).toEqual(c.expectedLocal);
  });
});

describe('captured live sample matches the requested contract', () => {
  const sample = JSON.parse(readFileSync(join(ROOT, 'forecast/open-meteo-sample-st-louis.json'), 'utf8')) as {
    hourly_units: Record<string, string>;
    hourly: Record<string, unknown[]>;
    current: Record<string, unknown>;
    timezone: string;
  };

  it('uses SI units and a unixtime axis with hourly steps', () => {
    expect(sample.hourly_units).toMatchObject({
      time: 'unixtime',
      apparent_temperature: '°C',
      precipitation: 'mm',
      precipitation_probability: '%',
      wind_speed_10m: 'km/h',
      wind_gusts_10m: 'km/h',
    });
    const time = sample.hourly['time'] as number[];
    expect(time.length).toBe(72);
    for (let i = 1; i < time.length; i++) expect((time[i] ?? 0) - (time[i - 1] ?? 0)).toBe(3600);
    expect(sample.timezone).toBe('America/Chicago');
  });
});
