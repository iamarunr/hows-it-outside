/**
 * Unit conversion and display formatting (spec 03-DATA-AND-API §6).
 * Domain values stay in SI; convert only at UI boundaries. Pure.
 */

export type UnitSystem = 'metric' | 'us';

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const fToC = (f: number): number => ((f - 32) * 5) / 9;
export const kmhToMph = (kmh: number): number => kmh / 1.609344;
export const mphToKmh = (mph: number): number => mph * 1.609344;
export const mmToIn = (mm: number): number => mm / 25.4;
export const inToMm = (inches: number): number => inches * 25.4;

/** Rounds to an integer, normalizing -0 to 0. */
function roundWhole(value: number): number {
  const r = Math.round(value);
  return Object.is(r, -0) ? 0 : r;
}

export function temperatureValue(c: number, units: UnitSystem): number {
  return units === 'us' ? cToF(c) : c;
}

export function windValue(kmh: number, units: UnitSystem): number {
  return units === 'us' ? kmhToMph(kmh) : kmh;
}

export function temperatureUnit(units: UnitSystem): string {
  return units === 'us' ? '°F' : '°C';
}

export function windUnit(units: UnitSystem): string {
  return units === 'us' ? 'mph' : 'km/h';
}

export function formatTemperature(c: number | null, units: UnitSystem): string | null {
  if (c === null) return null;
  return `${roundWhole(temperatureValue(c, units))}${temperatureUnit(units)}`;
}

export function formatWind(kmh: number | null, units: UnitSystem): string | null {
  if (kmh === null) return null;
  return `${roundWhole(windValue(kmh, units))} ${windUnit(units)}`;
}

export function formatPrecipitation(mm: number | null, units: UnitSystem): string | null {
  if (mm === null) return null;
  if (units === 'us') {
    const inches = mmToIn(mm);
    if (mm === 0) return '0 in';
    const rounded = Math.round(inches * 100) / 100;
    return rounded === 0 ? '<0.01 in' : `${rounded.toFixed(2)} in`;
  }
  if (mm === 0) return '0 mm';
  const rounded = Math.round(mm * 10) / 10;
  return rounded === 0 ? '<0.1 mm' : `${rounded.toFixed(1)} mm`;
}

export function formatPercent(pct: number | null): string | null {
  return pct === null ? null : `${roundWhole(pct)}%`;
}

/** Converts a temperature typed in display units back to °C (once; keep SI precision). */
export function temperatureFromDisplay(value: number, units: UnitSystem): number {
  return units === 'us' ? fToC(value) : value;
}

/**
 * Default units: US only when the locale explicitly carries the US region.
 * Language alone does not establish country (spec PRB §6).
 */
export function defaultUnitSystem(locale: string | undefined): UnitSystem {
  if (locale === undefined) return 'metric';
  try {
    return new Intl.Locale(locale).region === 'US' ? 'us' : 'metric';
  } catch {
    return 'metric';
  }
}
