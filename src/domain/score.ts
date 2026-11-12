/**
 * Interval preference scoring (spec 04-SCORING §3–§5). Deterministic and pure.
 * Scores are internal; public output is a label plus reasons.
 */
import {
  CAP_KNEE,
  CAP_SLOPE,
  GOOD_THRESHOLD,
  MIXED_THRESHOLD,
  RAIN_DIVISORS,
  TEMPERATURE_SCALE_C,
  WIND_GUST_SCALE_KMH,
  WIND_SUSTAINED_SCALE_KMH,
  WIND_THRESHOLDS,
} from './activities';
import { intervalFlags, intervalNotes } from './flags';
import type {
  ActivityPreferences,
  CriticalField,
  DimensionValues,
  FlagId,
  Interval,
  MatchLabel,
  NoteId,
  Weights,
} from './types';

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export type IntervalAssessment = {
  interval: Interval;
  /** Full-precision score, or null when any critical input is missing. */
  score: number | null;
  baseScore: number | null;
  /** Unweighted penalties in [0,1]. */
  penalties: DimensionValues | null;
  /** Weighted penalties (weight × penalty). */
  contributions: DimensionValues | null;
  capApplied: boolean;
  /** Direction of the temperature penalty, when nonzero. */
  temperatureDirection: 'warmer' | 'colder' | null;
  flags: FlagId[];
  notes: NoteId[];
  missing: CriticalField[];
  label: MatchLabel;
};

export function classifyScore(score: number): 'good' | 'mixed' | 'poor' {
  if (score >= GOOD_THRESHOLD) return 'good';
  if (score >= MIXED_THRESHOLD) return 'mixed';
  return 'poor';
}

export function temperaturePenalty(feelsLikeC: number, lowC: number, highC: number): number {
  const d = feelsLikeC < lowC ? lowC - feelsLikeC : feelsLikeC > highC ? feelsLikeC - highC : 0;
  return clamp01(d / TEMPERATURE_SCALE_C);
}

export function rainPenalty(probabilityPct: number, amountMm: number, tolerance: ActivityPreferences['rain']): number {
  const { probabilityPct: p, amountMm: m } = RAIN_DIVISORS[tolerance];
  return Math.max(clamp01(probabilityPct / p), clamp01(amountMm / m));
}

export function windPenalty(windKmh: number, gustKmh: number, tolerance: ActivityPreferences['wind']): number {
  const { sustainedKmh: s, gustKmh: g } = WIND_THRESHOLDS[tolerance];
  return Math.max(clamp01((windKmh - s) / WIND_SUSTAINED_SCALE_KMH), clamp01((gustKmh - g) / WIND_GUST_SCALE_KMH));
}

/** Worst-factor cap (ADR-015). No effect while every penalty ≤ 0.5; 40 when any penalty is 1. */
export function worstFactorCap(penalties: DimensionValues): number {
  const worst = Math.max(penalties.temperature, penalties.precipitation, penalties.wind);
  return 100 - CAP_SLOPE * Math.max(0, worst - CAP_KNEE);
}

export function missingCriticalFields(interval: Interval): CriticalField[] {
  const missing: CriticalField[] = [];
  if (interval.feelsLikeC === null) missing.push('feelsLikeC');
  if (interval.windKmh === null) missing.push('windKmh');
  if (interval.gustKmh === null) missing.push('gustKmh');
  if (interval.precipMm === null) missing.push('precipMm');
  if (interval.precipProbabilityPct === null) missing.push('precipProbabilityPct');
  if (!interval.weatherCodeComplete) missing.push('weatherCode');
  return missing;
}

export function scoreInterval(interval: Interval, prefs: ActivityPreferences, weights: Weights): IntervalAssessment {
  const flags = intervalFlags(interval);
  const notes = intervalNotes(interval);
  const missing = missingCriticalFields(interval);

  const { feelsLikeC, windKmh, gustKmh, precipMm, precipProbabilityPct } = interval;
  if (
    missing.length > 0 ||
    feelsLikeC === null ||
    windKmh === null ||
    gustKmh === null ||
    precipMm === null ||
    precipProbabilityPct === null
  ) {
    return {
      interval,
      score: null,
      baseScore: null,
      penalties: null,
      contributions: null,
      capApplied: false,
      temperatureDirection: null,
      flags,
      notes,
      missing,
      label: flags.length > 0 ? 'check' : 'limited',
    };
  }

  const penalties: DimensionValues = {
    temperature: temperaturePenalty(feelsLikeC, prefs.comfortLowC, prefs.comfortHighC),
    precipitation: rainPenalty(precipProbabilityPct, precipMm, prefs.rain),
    wind: windPenalty(windKmh, gustKmh, prefs.wind),
  };
  const contributions: DimensionValues = {
    temperature: weights.temperature * penalties.temperature,
    precipitation: weights.precipitation * penalties.precipitation,
    wind: weights.wind * penalties.wind,
  };
  const baseScore = 100 * (1 - (contributions.temperature + contributions.precipitation + contributions.wind));
  const cap = worstFactorCap(penalties);
  const score = Math.min(baseScore, cap);

  return {
    interval,
    score,
    baseScore,
    penalties,
    contributions,
    capApplied: cap < baseScore,
    temperatureDirection:
      penalties.temperature === 0 ? null : feelsLikeC > prefs.comfortHighC ? 'warmer' : 'colder',
    flags,
    notes,
    missing,
    label: flags.length > 0 ? 'check' : classifyScore(score),
  };
}
