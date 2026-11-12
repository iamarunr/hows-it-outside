import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hourLabels, isValidTimeZone, localParts, resolveTimeZone } from '../../src/lib/time';

type LocalTime = { date: string; time: string; offsetMinutes: number };
type TzCase = { id: string; timezone: string; epochs: number[]; expectedLocal: LocalTime[]; expectFallback?: string };
const fixture = JSON.parse(
  readFileSync(new URL('../fixtures/time/timezones.json', import.meta.url), 'utf8'),
) as { cases: TzCase[] };

function byId(id: string): TzCase {
  const c = fixture.cases.find((x) => x.id === id);
  if (c === undefined) throw new Error(id);
  return c;
}

describe('time zones', () => {
  it('validates IANA names', () => {
    expect(isValidTimeZone('America/Chicago')).toBe(true);
    expect(isValidTimeZone('Asia/Kathmandu')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('falls back to UTC for invalid zones and reports it', () => {
    expect(resolveTimeZone('Mars/Olympus_Mons')).toEqual({ timezone: 'UTC', fallback: true });
    expect(resolveTimeZone(undefined)).toEqual({ timezone: 'UTC', fallback: true });
    expect(resolveTimeZone('Asia/Kolkata')).toEqual({ timezone: 'Asia/Kolkata', fallback: false });
  });

  it.each(fixture.cases)('localParts matches fixture: $id', (c) => {
    const zone = resolveTimeZone(c.timezone).timezone;
    expect(c.epochs.map((t) => localParts(t, zone))).toEqual(c.expectedLocal);
  });

  it('runs with a non-UTC device zone so device-zone leaks are caught', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Pacific/Chatham');
  });

  it('is independent of the device time zone', () => {
    // Tests run in Pacific/Chatham (vitest.config.ts); output must depend only on the target zone.
    const c = byId('kathmandu-quarter-hour-offset');
    expect(localParts(c.epochs[0] ?? 0, 'Asia/Kathmandu')).toEqual(c.expectedLocal[0]);
  });
});

describe('hour labels', () => {
  it('gives repeated DST hours unique labels with a zone marker', () => {
    const c = byId('chicago-fall-back-repeated-1am');
    const labels = hourLabels(c.epochs, 'America/Chicago', 'en-US');
    const texts = labels.map((l) => `${l.time}${l.zone === null ? '' : ` ${l.zone}`}`);
    expect(new Set(texts).size).toBe(c.epochs.length);
    expect(labels[1]?.zone).not.toBeNull();
    expect(labels[2]?.zone).not.toBeNull();
    expect(labels[0]?.zone).toBeNull();
    expect(labels[3]?.zone).toBeNull();
  });

  it('shows the date on the first label and when the local date changes', () => {
    const c = byId('kolkata-half-hour-offset');
    const labels = hourLabels(c.epochs, 'Asia/Kolkata', 'en-US');
    expect(labels[0]?.date).not.toBeNull();
    expect(labels[1]?.date).not.toBeNull();
    expect(labels[1]?.date).not.toBe(labels[0]?.date);
  });

  it('omits the date for later labels on the same local day', () => {
    const base = Date.parse('2026-11-11T12:00:00Z') / 1000;
    const labels = hourLabels([base, base + 3600], 'UTC', 'en-US');
    expect(labels[0]?.date).not.toBeNull();
    expect(labels[1]?.date).toBeNull();
    expect(labels.map((l) => l.time)).toEqual(['12:00 PM', '1:00 PM']);
  });

  it('keys on epoch, never on formatted text', () => {
    const c = byId('chicago-fall-back-repeated-1am');
    expect(hourLabels(c.epochs, 'America/Chicago', 'en-US').map((l) => l.epoch)).toEqual(c.epochs);
  });
});
