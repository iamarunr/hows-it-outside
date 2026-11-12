/**
 * The next sunrise and sunset after a given instant, from the provider's sun
 * events, in the order they will happen. Pure.
 */
import type { SunEvent } from './types';

export function upcomingSunEvents(events: readonly SunEvent[], now: number): SunEvent[] {
  const out: SunEvent[] = [];
  for (const kind of ['sunrise', 'sunset'] as const) {
    const next = events.find((e) => e.kind === kind && e.time > now);
    if (next !== undefined) out.push(next);
  }
  return out.sort((a, b) => a.time - b.time);
}

/** "in 45 min", "in 2 h 10 min", "in 3 h". Rounded down to the minute; under a minute is "in under a minute". */
export function countdownText(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'in under a minute';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `in ${h > 0 ? `${h} h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 ? `${m} min` : ''}`;
}
