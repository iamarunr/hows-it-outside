/**
 * Duration-based window aggregation, candidate generation, ranking and the
 * next-hour summary (spec 04-SCORING §6–§7). Pure; `now` is always injected.
 */
import {
  BETTER_LATER_MARGIN,
  HORIZON_SECONDS,
  MAX_WINDOWS,
  MIXED_THRESHOLD,
  WINDOW_MEAN_WEIGHT,
  WINDOW_MIN_WEIGHT,
} from './activities';
import { sortFlags } from './flags';
import { classifyScore, scoreInterval, type IntervalAssessment } from './score';
import type {
  ActivityPreferences,
  DimensionValues,
  DurationMinutes,
  FlagId,
  Interval,
  MatchLabel,
  NoteId,
  Weights,
} from './types';

/** Why a candidate is not suggested. Order is priority order (spec §8). */
export const REJECTION_ORDER = ['data', 'daylight', 'flag', 'preference'] as const;
export type WindowRejection = (typeof REJECTION_ORDER)[number];
export type EmptyReason = WindowRejection | 'stale';

export type WindowMetrics = {
  feelsLikeMinC: number | null;
  feelsLikeMaxC: number | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  windMaxKmh: number | null;
  gustMaxKmh: number | null;
  /** Peak hourly values; never a whole-outing probability. */
  precipProbabilityPeakPct: number | null;
  precipPeakMm: number | null;
};

export type WindowPart = { assessment: IntervalAssessment; overlapSeconds: number };

export type WindowAssessment = {
  start: number;
  end: number;
  coverageComplete: boolean;
  parts: WindowPart[];
  score: number | null;
  meanScore: number | null;
  minScore: number | null;
  label: MatchLabel;
  flags: FlagId[];
  notes: NoteId[];
  /** Overlap-time-weighted mean of weighted penalty contributions. */
  contributions: DimensionValues | null;
  capApplied: boolean;
  /** Max unweighted penalty per dimension across intervals where the cap bound the score. */
  cappedPenalties: DimensionValues | null;
  temperatureDirection: 'warmer' | 'colder' | null;
  metrics: WindowMetrics;
  /** All overlapped intervals are daylight (true), any is night (false), otherwise unknown (null). */
  daylight: boolean | null;
  /** True when the window uses only part of an hourly interval: say "Based on hourly forecasts". */
  hourlyApproximation: boolean;
  rejection: WindowRejection | null;
};

export type ScoringContext = { prefs: ActivityPreferences; weights: Weights };

const overlap = (aStart: number, aEnd: number, bStart: number, bEnd: number): number =>
  Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

function extreme(values: (number | null)[], fn: (...v: number[]) => number): number | null {
  const present = values.filter((v): v is number => v !== null);
  return present.length === 0 ? null : fn(...present);
}

function coverageIsComplete(intervals: Interval[], start: number, end: number): boolean {
  if (intervals.length === 0) return false;
  const first = intervals[0];
  const last = intervals.at(-1);
  if (first === undefined || last === undefined || first.start > start || last.end < end) return false;
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i]?.start !== intervals[i - 1]?.end) return false;
  }
  return true;
}

export function assessWindow(
  intervals: readonly Interval[],
  start: number,
  durationSeconds: number,
  ctx: ScoringContext,
): WindowAssessment {
  const end = start + durationSeconds;
  const overlapping = intervals
    .filter((i) => overlap(i.start, i.end, start, end) > 0)
    .sort((a, b) => a.start - b.start);
  const coverageComplete = coverageIsComplete(overlapping, start, end);
  const parts: WindowPart[] = overlapping.map((interval) => ({
    assessment: scoreInterval(interval, ctx.prefs, ctx.weights),
    overlapSeconds: overlap(interval.start, interval.end, start, end),
  }));

  const flags = sortFlags(parts.flatMap((p) => p.assessment.flags));
  const notes = [...new Set(parts.flatMap((p) => p.assessment.notes))];
  const scores = parts.map((p) => p.assessment.score);
  const allScored = coverageComplete && scores.every((s) => s !== null);

  let score: number | null = null;
  let meanScore: number | null = null;
  let minScore: number | null = null;
  let contributions: DimensionValues | null = null;
  if (allScored) {
    let weighted = 0;
    const c = { temperature: 0, precipitation: 0, wind: 0 };
    for (const p of parts) {
      const share = p.overlapSeconds / durationSeconds;
      weighted += (p.assessment.score ?? 0) * share;
      const pc = p.assessment.contributions;
      if (pc !== null) {
        c.temperature += pc.temperature * share;
        c.precipitation += pc.precipitation * share;
        c.wind += pc.wind * share;
      }
    }
    meanScore = weighted;
    minScore = Math.min(...parts.map((p) => p.assessment.score ?? 0));
    score = WINDOW_MEAN_WEIGHT * meanScore + WINDOW_MIN_WEIGHT * minScore;
    contributions = c;
  }

  const capped = parts.filter((p) => p.assessment.capApplied && p.assessment.penalties !== null);
  const cappedPenalties =
    capped.length === 0
      ? null
      : {
          temperature: Math.max(...capped.map((p) => p.assessment.penalties?.temperature ?? 0)),
          precipitation: Math.max(...capped.map((p) => p.assessment.penalties?.precipitation ?? 0)),
          wind: Math.max(...capped.map((p) => p.assessment.penalties?.wind ?? 0)),
        };

  const directions = parts.map((p) => p.assessment.temperatureDirection).filter((d) => d !== null);
  const temperatureDirection = directions.includes('warmer') ? 'warmer' : directions.includes('colder') ? 'colder' : null;

  const days = parts.map((p) => p.assessment.interval.daylight);
  const daylight = days.length === 0 ? null : days.includes(false) ? false : days.every((d) => d === true) ? true : null;

  const ivs = parts.map((p) => p.assessment.interval);
  const metrics: WindowMetrics = {
    feelsLikeMinC: extreme(ivs.map((i) => i.feelsLikeC), Math.min),
    feelsLikeMaxC: extreme(ivs.map((i) => i.feelsLikeC), Math.max),
    temperatureMinC: extreme(ivs.map((i) => i.temperatureC), Math.min),
    temperatureMaxC: extreme(ivs.map((i) => i.temperatureC), Math.max),
    windMaxKmh: extreme(ivs.map((i) => i.windKmh), Math.max),
    gustMaxKmh: extreme(ivs.map((i) => i.gustKmh), Math.max),
    precipProbabilityPeakPct: extreme(ivs.map((i) => i.precipProbabilityPct), Math.max),
    precipPeakMm: extreme(ivs.map((i) => i.precipMm), Math.max),
  };

  let rejection: WindowRejection | null = null;
  if (!allScored || score === null || minScore === null) rejection = 'data';
  else if (ctx.prefs.daylightOnly && daylight !== true) rejection = 'daylight';
  else if (flags.length > 0) rejection = 'flag';
  else if (minScore < MIXED_THRESHOLD || score < MIXED_THRESHOLD) rejection = 'preference';

  return {
    start,
    end,
    coverageComplete,
    parts,
    score,
    meanScore,
    minScore,
    label: flags.length > 0 ? 'check' : score === null ? 'limited' : classifyScore(score),
    flags,
    notes,
    contributions,
    capApplied: capped.length > 0,
    cappedPenalties,
    temperatureDirection,
    metrics,
    daylight,
    hourlyApproximation: parts.some((p) => p.overlapSeconds < p.assessment.interval.end - p.assessment.interval.start),
    rejection,
  };
}

/** Candidate starts: now, plus each interval start strictly after now, ending within the horizon. */
export function candidateStarts(intervals: readonly Interval[], now: number, durationSeconds: number): number[] {
  const horizonEnd = now + HORIZON_SECONDS;
  const starts = new Set<number>([now]);
  for (const i of intervals) if (i.start > now) starts.add(i.start);
  return [...starts].filter((s) => s + durationSeconds <= horizonEnd).sort((a, b) => a - b);
}

export type WindowSearch = {
  windows: WindowAssessment[];
  /** Set only when no window is suggested. */
  emptyReason: EmptyReason | null;
  /** Flags seen anywhere in the 24-hour horizon; always shown, even when no window is suggested. */
  horizonFlags: FlagId[];
};

export function findWindows(
  intervals: readonly Interval[],
  now: number,
  options: ScoringContext & { durationMinutes: DurationMinutes; stale: boolean },
): WindowSearch {
  const duration = options.durationMinutes * 60;
  const horizonFlags = sortFlags(
    intervals
      .filter((i) => overlap(i.start, i.end, now, now + HORIZON_SECONDS) > 0)
      .flatMap((i) => scoreInterval(i, options.prefs, options.weights).flags),
  );
  if (options.stale) return { windows: [], emptyReason: 'stale', horizonFlags };

  const candidates = candidateStarts(intervals, now, duration).map((s) => assessWindow(intervals, s, duration, options));
  const eligible = candidates
    .filter((c) => c.rejection === null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.start - b.start);

  const selected: WindowAssessment[] = [];
  for (const c of eligible) {
    if (selected.length >= MAX_WINDOWS) break;
    if (selected.every((s) => overlap(s.start, s.end, c.start, c.end) === 0)) selected.push(c);
  }
  if (selected.length > 0) return { windows: selected, emptyReason: null, horizonFlags };

  // Constraints apply in priority order; the reason is the stage at which no candidate remained.
  let stage = 0;
  for (const c of candidates) {
    if (c.rejection !== null) stage = Math.max(stage, REJECTION_ORDER.indexOf(c.rejection));
  }
  return { windows: [], emptyReason: REJECTION_ORDER[stage] ?? 'data', horizonFlags };
}

export type NextHourComparison =
  | { kind: 'now_is_best' }
  | { kind: 'better_later'; start: number }
  | { kind: 'similar' }
  | { kind: 'none' };

/** Next-hour summary: same aggregation over [now, now+3600); never rejected, only labeled. */
export function nextHour(intervals: readonly Interval[], now: number, ctx: ScoringContext): WindowAssessment {
  return assessWindow(intervals, now, 3600, ctx);
}

export function compareNextHour(next: WindowAssessment, best: WindowAssessment | undefined, now: number): NextHourComparison {
  if (best === undefined || best.score === null) return { kind: 'none' };
  if (next.flags.length > 0) return best.start > now ? { kind: 'better_later', start: best.start } : { kind: 'none' };
  if (next.score === null) return { kind: 'none' };
  if (best.start === now) return { kind: 'now_is_best' };
  if (best.score - next.score >= BETTER_LATER_MARGIN) return { kind: 'better_later', start: best.start };
  return { kind: 'similar' };
}

/** Intervals intersecting the next 24 hours, for the timeline. */
export function timelineIntervals(intervals: readonly Interval[], now: number): Interval[] {
  return intervals.filter((i) => overlap(i.start, i.end, now, now + HORIZON_SECONDS) > 0);
}
