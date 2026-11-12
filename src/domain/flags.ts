/**
 * Concerning-weather flags (spec 04-SCORING §5). Independent of user
 * preferences; evaluated even when other fields are missing.
 */
import {
  FLAG_THRESHOLDS,
  FOG_CODES,
  FREEZING_PRECIP_CODES,
  SNOW_OR_ICE_CODES,
  THUNDERSTORM_CODES,
} from './activities';
import type { FlagId, Interval, NoteId } from './types';

/** Display order of flags (most urgent first). */
export const FLAG_ORDER: readonly FlagId[] = [
  'thunderstorm',
  'freezing_precip',
  'strong_gusts',
  'heavy_precip',
  'high_heat',
  'severe_cold',
  'snow_or_ice_concern',
];

export const FLAG_COPY: Readonly<Record<FlagId, string>> = {
  thunderstorm: 'Thunderstorms in the forecast. Check local conditions and official alerts.',
  freezing_precip: 'Freezing precipitation in the forecast.',
  strong_gusts: 'Strong gusts in the forecast.',
  high_heat: 'Very hot feels-like conditions.',
  severe_cold: 'Very cold feels-like conditions.',
  heavy_precip: 'Heavy precipitation in the forecast.',
  snow_or_ice_concern: 'Snow or icy conditions may affect surfaces.',
};

export const NOTE_COPY: Readonly<Record<NoteId, string>> = {
  fog: 'Fog in the forecast may reduce visibility.',
};

function anyIn(codes: readonly number[], set: ReadonlySet<number>): boolean {
  return codes.some((c) => set.has(c));
}

export function intervalFlags(interval: Interval): FlagId[] {
  const found = new Set<FlagId>();
  const codes = interval.weatherCodes;
  if (anyIn(codes, THUNDERSTORM_CODES)) found.add('thunderstorm');
  if (anyIn(codes, FREEZING_PRECIP_CODES)) found.add('freezing_precip');
  if (anyIn(codes, SNOW_OR_ICE_CODES)) found.add('snow_or_ice_concern');
  if (interval.gustKmh !== null && interval.gustKmh >= FLAG_THRESHOLDS.strongGustKmh) found.add('strong_gusts');
  if (interval.feelsLikeC !== null && interval.feelsLikeC >= FLAG_THRESHOLDS.highHeatFeelsLikeC) found.add('high_heat');
  if (interval.feelsLikeC !== null && interval.feelsLikeC <= FLAG_THRESHOLDS.severeColdFeelsLikeC) found.add('severe_cold');
  if (interval.precipMm !== null && interval.precipMm >= FLAG_THRESHOLDS.heavyPrecipMm) found.add('heavy_precip');
  return FLAG_ORDER.filter((f) => found.has(f));
}

export function intervalNotes(interval: Interval): NoteId[] {
  return anyIn(interval.weatherCodes, FOG_CODES) ? ['fog'] : [];
}

export function sortFlags(flags: Iterable<FlagId>): FlagId[] {
  const set = new Set(flags);
  return FLAG_ORDER.filter((f) => set.has(f));
}
