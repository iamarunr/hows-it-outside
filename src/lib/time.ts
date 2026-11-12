/**
 * Time helpers (spec 03-DATA-AND-API §5). Store epoch seconds; format with
 * Intl in the target location's IANA zone; never the device zone, never by
 * adding a fixed UTC offset. Pure.
 */

export function isValidTimeZone(timeZone: string): boolean {
  if (timeZone.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone: string | undefined): { timezone: string; fallback: boolean } {
  return timeZone !== undefined && isValidTimeZone(timeZone)
    ? { timezone: timeZone, fallback: false }
    : { timezone: 'UTC', fallback: true };
}

export type LocalParts = { date: string; time: string; offsetMinutes: number };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(timeZone);
  if (f === undefined) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    });
    partsFormatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock date (YYYY-MM-DD), time (HH:MM, 24 h) and UTC offset in the zone. */
export function localParts(epochSeconds: number, timeZone: string): LocalParts {
  const parts: Record<string, string> = {};
  for (const p of partsFormatter(timeZone).formatToParts(epochSeconds * 1000)) parts[p.type] = p.value;
  const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(parts['timeZoneName'] ?? '');
  const offsetMinutes =
    m?.[1] === undefined ? 0 : (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  return {
    date: `${parts['year'] ?? ''}-${parts['month'] ?? ''}-${parts['day'] ?? ''}`,
    time: `${parts['hour'] ?? ''}:${parts['minute'] ?? ''}`,
    offsetMinutes,
  };
}

export function formatTime(epochSeconds: number, timeZone: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(epochSeconds * 1000);
}

export function formatDate(epochSeconds: number, timeZone: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', month: 'short', day: 'numeric' }).format(
    epochSeconds * 1000,
  );
}

export function zoneName(epochSeconds: number, timeZone: string, locale = 'en-US'): string {
  const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
    .formatToParts(epochSeconds * 1000)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? timeZone;
}

export type HourLabel = {
  epoch: number;
  time: string;
  /** Local date text when it should be shown: first label and whenever the local date changes. */
  date: string | null;
  /** Zone abbreviation when the same wall-clock time occurs more than once (DST fall-back). */
  zone: string | null;
};

export function hourLabels(epochs: readonly number[], timeZone: string, locale = 'en-US'): HourLabel[] {
  const parts = epochs.map((e) => localParts(e, timeZone));
  const wallCounts = new Map<string, number>();
  for (const p of parts) {
    const key = `${p.date} ${p.time}`;
    wallCounts.set(key, (wallCounts.get(key) ?? 0) + 1);
  }
  return epochs.map((epoch, i) => {
    const p = parts[i];
    const prev = i > 0 ? parts[i - 1] : undefined;
    const repeated = p !== undefined && (wallCounts.get(`${p.date} ${p.time}`) ?? 0) > 1;
    return {
      epoch,
      time: formatTime(epoch, timeZone, locale),
      date: prev === undefined || prev.date !== p?.date ? formatDate(epoch, timeZone, locale) : null,
      zone: repeated ? zoneName(epoch, timeZone, locale) : null,
    };
  });
}
