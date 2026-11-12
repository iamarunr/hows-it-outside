/**
 * Versioned scoring constants and activity presets (spec 04-SCORING §2–§5, §10).
 * These are product heuristics and proposed tuning defaults, not validated
 * comfort, medical or safety thresholds. Change only with tests, a changelog
 * entry and a methodology update.
 */
import type {
  ActivityId,
  ActivityPreferences,
  DurationMinutes,
  RainTolerance,
  Weights,
  WindTolerance,
} from './types';

export const SCORING_VERSION = 1;

export const ACTIVITY_IDS: readonly ActivityId[] = ['outdoors', 'walk', 'run', 'bike', 'hangout'];

export type ActivityPreset = {
  id: ActivityId;
  label: string;
  /** Lowercase noun phrase for sentences, e.g. "Good match for a walk". */
  phrase: string;
  weights: Weights;
  defaults: ActivityPreferences;
};

function preset(
  id: ActivityId,
  label: string,
  phrase: string,
  [low, high]: [number, number],
  [t, r, w]: [number, number, number],
  rain: RainTolerance,
  wind: WindTolerance,
): ActivityPreset {
  return {
    id,
    label,
    phrase,
    weights: { temperature: t, precipitation: r, wind: w },
    defaults: { comfortLowC: low, comfortHighC: high, rain, wind, daylightOnly: true },
  };
}

export const ACTIVITY_PRESETS: Readonly<Record<ActivityId, ActivityPreset>> = {
  outdoors: preset('outdoors', 'Outdoors', 'time outdoors', [12, 26], [0.4, 0.35, 0.25], 'light', 'medium'),
  walk: preset('walk', 'Walk', 'a walk', [8, 25], [0.4, 0.35, 0.25], 'light', 'medium'),
  run: preset('run', 'Run', 'a run', [5, 20], [0.5, 0.25, 0.25], 'light', 'medium'),
  bike: preset('bike', 'Bike', 'a bike ride', [10, 25], [0.3, 0.3, 0.4], 'avoid', 'low'),
  hangout: preset('hangout', 'Hang out', 'hanging out', [18, 27], [0.45, 0.35, 0.2], 'avoid', 'low'),
};

export const DURATIONS: readonly DurationMinutes[] = [30, 60, 90, 120];
export const DEFAULT_DURATION: DurationMinutes = 60;

/** Temperature distance (°C) at which T saturates. */
export const TEMPERATURE_SCALE_C = 12;

/** Rain divisors: P in percent, M in mm per hour. */
export const RAIN_DIVISORS: Readonly<Record<RainTolerance, { probabilityPct: number; amountMm: number }>> = {
  avoid: { probabilityPct: 40, amountMm: 0.5 },
  light: { probabilityPct: 70, amountMm: 2 },
  okay: { probabilityPct: 100, amountMm: 5 },
};

/** Wind thresholds: S sustained, G gust (km/h); scales 20 and 30 km/h. */
export const WIND_THRESHOLDS: Readonly<Record<WindTolerance, { sustainedKmh: number; gustKmh: number }>> = {
  low: { sustainedKmh: 10, gustKmh: 20 },
  medium: { sustainedKmh: 18, gustKmh: 30 },
  high: { sustainedKmh: 28, gustKmh: 45 },
};
export const WIND_SUSTAINED_SCALE_KMH = 20;
export const WIND_GUST_SCALE_KMH = 30;

/** Worst-factor cap: cap = 100 - CAP_SLOPE * max(0, worst - CAP_KNEE). Reaches 40 at worst = 1. */
export const CAP_KNEE = 0.5;
export const CAP_SLOPE = 120;

export const GOOD_THRESHOLD = 75;
export const MIXED_THRESHOLD = 45;

/** Window score = MEAN_WEIGHT * duration-weighted mean + MIN_WEIGHT * min interval score. */
export const WINDOW_MEAN_WEIGHT = 0.7;
export const WINDOW_MIN_WEIGHT = 0.3;
export const MAX_WINDOWS = 3;
export const HORIZON_SECONDS = 86_400;
/** Best window must beat the next hour by this many points to say "a better match later". */
export const BETTER_LATER_MARGIN = 10;

/** Concerning-weather flag thresholds (app policy, not official hazard thresholds). */
export const FLAG_THRESHOLDS = {
  strongGustKmh: 50,
  highHeatFeelsLikeC: 35,
  severeColdFeelsLikeC: -15,
  heavyPrecipMm: 10,
} as const;
export const THUNDERSTORM_CODES: ReadonlySet<number> = new Set([95, 96, 97, 99]);
export const FREEZING_PRECIP_CODES: ReadonlySet<number> = new Set([56, 57, 66, 67]);
export const SNOW_OR_ICE_CODES: ReadonlySet<number> = new Set([71, 73, 75, 77, 85, 86, 48]);
export const FOG_CODES: ReadonlySet<number> = new Set([45]);

export const COMFORT_BOUNDS_C = { min: -30, max: 45 } as const;

export type PreferenceError = 'not_a_number' | 'out_of_bounds' | 'low_not_below_high';

/** Validates a comfort band (°C). Low must be strictly below high; both within -30..45. */
export function validateComfortBand(lowC: number, highC: number): PreferenceError | null {
  if (!Number.isFinite(lowC) || !Number.isFinite(highC)) return 'not_a_number';
  if (lowC < COMFORT_BOUNDS_C.min || highC > COMFORT_BOUNDS_C.max || highC < COMFORT_BOUNDS_C.min || lowC > COMFORT_BOUNDS_C.max) {
    return 'out_of_bounds';
  }
  if (!(lowC < highC)) return 'low_not_below_high';
  return null;
}
