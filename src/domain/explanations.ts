/**
 * Deterministic explanations (spec 04-SCORING §6–§8, DESIGN content examples).
 * Text comes from structured IDs and templates built from the same
 * contributions the scoring engine used. No provider text, no HTML, no LLM,
 * and never "safe", "unsafe", "perfect" or "guaranteed".
 */
import { formatPercent, formatPrecipitation, formatTemperature, formatWind, type UnitSystem } from '../lib/units';
import type { ActivityPreset } from './activities';
import type { Dimension, DimensionValues, MatchLabel } from './types';
import type { EmptyReason, NextHourComparison, WindowAssessment } from './windows';

export type ReasonId = 'warmer' | 'colder' | 'precipitation' | 'wind' | 'all_within' | 'mostly_within';
export type Reason = { id: ReasonId; text: string };

/** Deterministic tie order (spec §8). */
export const DIMENSION_ORDER: readonly Dimension[] = ['temperature', 'precipitation', 'wind'];

function ranked(values: DimensionValues): Dimension[] {
  return [...DIMENSION_ORDER].sort((a, b) => values[b] - values[a] || DIMENSION_ORDER.indexOf(a) - DIMENSION_ORDER.indexOf(b));
}

/**
 * A factor is named as a reason only when its unweighted penalty in some hour of
 * the window reaches this level, so a 5% rain chance is not called "higher".
 * Ranking still uses the scoring contributions (IMP-023).
 */
export const NOTABLE_PENALTY = 0.25;

/** Highest unweighted penalty per dimension across the window's hours. */
export function peakPenalties(w: WindowAssessment): DimensionValues {
  const out = { temperature: 0, precipitation: 0, wind: 0 };
  for (const p of w.parts) {
    const pen = p.assessment.penalties;
    if (pen === null) continue;
    out.temperature = Math.max(out.temperature, pen.temperature);
    out.precipitation = Math.max(out.precipitation, pen.precipitation);
    out.wind = Math.max(out.wind, pen.wind);
  }
  return out;
}

/** Dimensions driving the result, most important first. Uses the scoring engine's own values. */
export function drivers(w: WindowAssessment): Dimension[] {
  const c = w.contributions;
  if (c === null) return [];
  const nonzero = ranked(c).filter((d) => c[d] > 0);
  if (w.cappedPenalties === null) return nonzero;
  const capped = w.cappedPenalties;
  const lead = ranked(capped).find((d) => capped[d] > 0);
  if (lead === undefined) return nonzero;
  return [lead, ...nonzero.filter((d) => d !== lead)];
}

function reasonFor(d: Dimension, w: WindowAssessment, units: UnitSystem): Reason {
  const m = w.metrics;
  switch (d) {
    case 'temperature':
      if (w.temperatureDirection === 'warmer') {
        const t = formatTemperature(m.feelsLikeMaxC, units);
        return { id: 'warmer', text: `Warmer than your preferred range${t === null ? '' : ` (feels like up to ${t})`}.` };
      }
      {
        const t = formatTemperature(m.feelsLikeMinC, units);
        return { id: 'colder', text: `Colder than your preferred range${t === null ? '' : ` (feels like down to ${t})`}.` };
      }
    case 'precipitation': {
      const parts = [
        m.precipProbabilityPeakPct === null ? null : `${formatPercent(m.precipProbabilityPeakPct) ?? ''} chance`,
        m.precipPeakMm === null ? null : formatPrecipitation(m.precipPeakMm, units),
      ].filter((p): p is string => p !== null);
      return {
        id: 'precipitation',
        text: `Higher chance of precipitation${parts.length === 0 ? '' : ` (peak hourly: ${parts.join(', ')})`}.`,
      };
    }
    case 'wind': {
      const wind = formatWind(m.windMaxKmh, units);
      const gust = formatWind(m.gustMaxKmh, units);
      const detail = [wind === null ? null : `up to ${wind}`, gust === null ? null : `gusts ${gust}`].filter(
        (p): p is string => p !== null,
      );
      return { id: 'wind', text: `Windier than you prefer${detail.length === 0 ? '' : ` (${detail.join(', ')})`}.` };
    }
  }
}

/** Up to two reasons for a scored window or next-hour summary. Empty when unscored. */
export function explain(w: WindowAssessment, units: UnitSystem): Reason[] {
  if (w.contributions === null) return [];
  const peak = peakPenalties(w);
  const ds = drivers(w)
    .filter((d) => peak[d] >= NOTABLE_PENALTY)
    .slice(0, 2);
  if (ds.length === 0) {
    return peak.temperature === 0
      ? [{ id: 'all_within', text: 'Within your preferred temperature range, with low wind and precipitation in the forecast.' }]
      : [{ id: 'mostly_within', text: 'Close to your preferred temperature range, with low wind and precipitation in the forecast.' }];
  }
  return ds.map((d) => reasonFor(d, w, units));
}

/** Headline for the next-hour summary. */
export function summaryHeadline(w: WindowAssessment, activity: ActivityPreset): string {
  const label: MatchLabel = w.label;
  switch (label) {
    case 'good':
      return `Good match for ${activity.phrase}`;
    case 'mixed':
      return drivers(w)[0] === 'wind' ? `A little windy for ${activity.phrase}` : `Mixed conditions for ${activity.phrase}`;
    case 'poor':
      return 'Poor match for your preferences';
    case 'limited':
      return 'Limited data';
    case 'check':
      return 'Check conditions';
  }
}

/** Title for the top suggested window (only Good or Mixed windows are ever suggested). */
export function bestWindowTitle(w: WindowAssessment): string {
  return w.label === 'good' ? 'Best match in the next 24 hours' : 'Best available: mixed conditions';
}

export const HOURLY_APPROXIMATION_NOTE = 'Based on hourly forecasts.';

export function comparisonText(c: NextHourComparison, formatTime: (epoch: number) => string): string | null {
  switch (c.kind) {
    case 'now_is_best':
      return 'Now is one of your best windows.';
    case 'better_later':
      return `A better match around ${formatTime(c.start)}.`;
    case 'similar':
      return 'Conditions are similar across these windows.';
    case 'none':
      return null;
  }
}

export function emptyReasonText(reason: EmptyReason, retrievedAt?: string): string {
  switch (reason) {
    case 'stale':
      return `Showing an earlier forecast${retrievedAt === undefined ? '' : ` retrieved at ${retrievedAt}`}. Suggestions are paused until it refreshes.`;
    case 'data':
      return 'Some forecast details are unavailable. You can still review the available weather.';
    case 'daylight':
      return 'No matching daylight window in the next 24 hours. Try another duration or include nighttime.';
    case 'flag':
      return 'No suggested window with the current forecast. Review the conditions below.';
    case 'preference':
      return 'No window in the next 24 hours matches your preferences. Try another duration or adjust your preferences.';
  }
}
