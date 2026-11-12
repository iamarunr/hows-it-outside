import { describe, expect, it } from 'vitest';
import type { Forecast, Location } from '../../src/domain/types';
import {
  forecastView,
  initialState,
  reducer,
  type Action,
  type ControllerState,
} from '../../src/features/outside/controller/reducer';

const NOW = 1794736800;
const london: Location = { key: '51.51,-0.13', latitude: 51.51, longitude: -0.13, label: 'London', source: 'search' };
const chennai: Location = { key: '13.08,80.27', latitude: 13.08, longitude: 80.27, label: 'Chennai', source: 'search' };

function forecastFor(loc: Location, fetchedAt = NOW): Forecast {
  return {
    schemaVersion: 1,
    provider: 'open-meteo',
    locationKey: loc.key,
    timezone: 'UTC',
    timezoneFallback: false,
    fetchedAt,
    current: null,
    intervals: [],
    sunEvents: [],
    diagnostics: [],
  };
}

const run = (actions: Action[], from: ControllerState = initialState) => actions.reduce(reducer, from);

describe('selection and responses', () => {
  it('a slow response for an old selection cannot overwrite the newer place', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    const londonGen = s.generation;
    s = run([{ type: 'fetch_start', generation: londonGen }, { type: 'select', location: chennai, saved: false }], s);
    const chennaiGen = s.generation;
    s = run([{ type: 'fetch_start', generation: chennaiGen }, { type: 'fetch_success', generation: chennaiGen, locationKey: chennai.key, forecast: forecastFor(chennai) }], s);
    s = reducer(s, { type: 'fetch_success', generation: londonGen, locationKey: london.key, forecast: forecastFor(london) });
    expect(s.forecast).toMatchObject({ status: 'ready', forecast: { locationKey: chennai.key } });
  });

  it('rejects a response whose forecast key does not match the selection', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = reducer(s, { type: 'fetch_success', generation: s.generation, locationKey: london.key, forecast: forecastFor(chennai) });
    expect(s.forecast.status).toBe('idle');
  });

  it('a new selection clears the old forecast immediately', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = reducer(s, { type: 'fetch_success', generation: s.generation, locationKey: london.key, forecast: forecastFor(london) });
    s = reducer(s, { type: 'select', location: chennai, saved: false });
    expect(s.forecast).toEqual({ status: 'idle' });
    expect(forecastView(s, NOW)).toEqual({ kind: 'loading' });
  });

  it('aborted requests never become user errors', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = run([{ type: 'fetch_start', generation: s.generation }, { type: 'fetch_failure', generation: s.generation, locationKey: london.key, error: 'aborted', now: NOW }], s);
    expect(s.forecast.status).not.toBe('error');
  });
});

describe('refresh and failure', () => {
  function loaded(fetchedAt = NOW): ControllerState {
    const s = run([{ type: 'select', location: london, saved: false }]);
    return reducer(s, { type: 'fetch_success', generation: s.generation, locationKey: london.key, forecast: forecastFor(london, fetchedAt) });
  }

  it('keeps showing data and recommendations while refreshing (no flicker)', () => {
    const s = reducer(loaded(), { type: 'fetch_start', generation: 1 });
    expect(s.forecast.status).toBe('refreshing');
    expect(forecastView(s, NOW + 1000)).toMatchObject({ kind: 'data', tier: 'due', recommendationsAllowed: true, refreshing: true });
  });

  it('a failed refresh keeps data with a refresh error', () => {
    const s = run([{ type: 'fetch_start', generation: 1 }, { type: 'fetch_failure', generation: 1, locationKey: london.key, error: 'network', now: NOW }], loaded());
    expect(forecastView(s, NOW + 1000)).toMatchObject({ kind: 'data', refreshError: 'network', recommendationsAllowed: true });
  });

  it('pauses recommendations once stale and clears the display when expired', () => {
    const s = loaded();
    expect(forecastView(s, NOW + 3600)).toMatchObject({ kind: 'data', tier: 'stale', recommendationsAllowed: false });
    expect(forecastView(s, NOW + 7200)).toEqual({ kind: 'error', error: 'expired' });
    const refreshing = reducer(s, { type: 'fetch_start', generation: 1 });
    expect(forecastView(refreshing, NOW + 7200)).toEqual({ kind: 'loading' });
  });

  it('a first-load failure is an error', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = run([{ type: 'fetch_start', generation: s.generation }, { type: 'fetch_failure', generation: s.generation, locationKey: london.key, error: 'provider_unavailable', now: NOW }], s);
    expect(forecastView(s, NOW)).toEqual({ kind: 'error', error: 'provider_unavailable' });
  });

  it('rate limiting sets a cooldown from Retry-After, defaulting to 60 s', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = reducer(s, { type: 'fetch_failure', generation: s.generation, locationKey: london.key, error: 'rate_limited', retryAfterSeconds: 120, now: NOW });
    expect(s.cooldownUntil).toBe(NOW + 120);
    s = reducer(s, { type: 'fetch_failure', generation: s.generation, locationKey: london.key, error: 'rate_limited', now: NOW });
    expect(s.cooldownUntil).toBe(NOW + 60);
  });
});

describe('device location', () => {
  it('denial with no previous place returns to none with a notice', () => {
    const s = run([{ type: 'locate_start' }, { type: 'locate_failed', error: 'denied' }]);
    expect(s.location).toEqual({ status: 'none' });
    expect(s.geoNotice).toBe('denied');
  });

  it('denial keeps the previously selected place and its forecast', () => {
    let s = run([{ type: 'select', location: london, saved: false }]);
    s = reducer(s, { type: 'fetch_success', generation: s.generation, locationKey: london.key, forecast: forecastFor(london) });
    const gen = s.generation;
    s = run([{ type: 'locate_start' }, { type: 'locate_failed', error: 'timeout' }], s);
    expect(s.location).toMatchObject({ status: 'selected', location: { key: london.key } });
    expect(s.generation).toBe(gen);
    expect(s.forecast.status).toBe('ready');
    expect(s.geoNotice).toBe('timeout');
  });

  it('a new selection clears the location notice', () => {
    const s = run([{ type: 'locate_start' }, { type: 'locate_failed', error: 'denied' }, { type: 'select', location: london, saved: false }]);
    expect(s.geoNotice).toBeNull();
  });
});
