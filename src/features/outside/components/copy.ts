import type { MatchLabel } from '../../../domain/types';
import { formatDate, formatTime, localParts } from '../../../lib/time';

/** Public match labels (SCORING §1). Each has a text symbol so meaning never depends on color. */
export const MATCH_TEXT: Readonly<Record<MatchLabel, { text: string; symbol: string }>> = {
  good: { text: 'Good match', symbol: '●' },
  mixed: { text: 'Mixed conditions', symbol: '◐' },
  poor: { text: 'Poor match', symbol: '○' },
  limited: { text: 'Limited data', symbol: '?' },
  check: { text: 'Check conditions', symbol: '!' },
};

/** "2:00 PM – 3:30 PM", with the local date when it is not today in the target zone. */
export function formatRange(start: number, end: number, timeZone: string, now: number): string {
  const today = localParts(now, timeZone).date;
  const startDay = localParts(start, timeZone).date;
  const range = `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;
  return startDay === today ? range : `${formatDate(start, timeZone)}, ${range}`;
}
