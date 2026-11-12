import { describe, expect, it } from 'vitest';
import {
  cToF,
  defaultUnitSystem,
  fToC,
  formatPrecipitation,
  formatTemperature,
  formatWind,
  inToMm,
  kmhToMph,
  mmToIn,
  mphToKmh,
  temperatureFromDisplay,
} from '../../src/lib/units';

describe('conversions', () => {
  it('uses the exact factors', () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(100)).toBe(212);
    expect(kmhToMph(1.609344)).toBeCloseTo(1, 12);
    expect(mmToIn(25.4)).toBeCloseTo(1, 12);
  });

  it('round-trips within tolerance', () => {
    for (const v of [-30, -15.5, 0, 12.3, 45]) expect(fToC(cToF(v))).toBeCloseTo(v, 10);
    for (const v of [0, 5, 18.2, 50]) expect(mphToKmh(kmhToMph(v))).toBeCloseTo(v, 10);
    for (const v of [0, 0.04, 2, 10]) expect(inToMm(mmToIn(v))).toBeCloseTo(v, 10);
  });
});

describe('display formatting', () => {
  it('rounds temperature and wind to whole units', () => {
    expect(formatTemperature(20.4, 'metric')).toBe('20°C');
    expect(formatTemperature(20.5, 'us')).toBe('69°F');
    expect(formatTemperature(-0.4, 'metric')).toBe('0°C');
    expect(formatWind(17.6, 'metric')).toBe('18 km/h');
    expect(formatWind(16.09344, 'us')).toBe('10 mph');
  });

  it('formats precipitation with <0.1 mm / <0.01 in for small positive amounts', () => {
    expect(formatPrecipitation(0, 'metric')).toBe('0 mm');
    expect(formatPrecipitation(0.04, 'metric')).toBe('<0.1 mm');
    expect(formatPrecipitation(1.26, 'metric')).toBe('1.3 mm');
    expect(formatPrecipitation(0.1, 'us')).toBe('<0.01 in');
    expect(formatPrecipitation(25.4, 'us')).toBe('1.00 in');
    expect(formatPrecipitation(0, 'us')).toBe('0 in');
  });

  it('returns null for missing values rather than a number', () => {
    expect(formatTemperature(null, 'metric')).toBeNull();
    expect(formatWind(null, 'us')).toBeNull();
    expect(formatPrecipitation(null, 'metric')).toBeNull();
  });

  it('converts edited display temperature back to SI once', () => {
    expect(temperatureFromDisplay(68, 'us')).toBeCloseTo(20, 10);
    expect(temperatureFromDisplay(20, 'metric')).toBe(20);
  });
});

describe('default unit system', () => {
  it('uses US units only when the locale explicitly has the US region', () => {
    expect(defaultUnitSystem('en-US')).toBe('us');
    expect(defaultUnitSystem('es-US')).toBe('us');
    expect(defaultUnitSystem('en')).toBe('metric');
    expect(defaultUnitSystem('en-GB')).toBe('metric');
    expect(defaultUnitSystem('fr-FR')).toBe('metric');
    expect(defaultUnitSystem(undefined)).toBe('metric');
    expect(defaultUnitSystem('not a locale!!')).toBe('metric');
  });
});
