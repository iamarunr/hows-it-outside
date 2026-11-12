/**
 * Weather controller state machine (spec 02-ARCHITECTURE §4). Pure.
 * Every location change bumps the generation; responses are accepted only
 * when both their generation and location key match the current selection,
 * so a slow old response can never overwrite a newer place.
 */
import { freshnessTier, recommendationsAllowed, type FreshnessTier } from '../../../domain/freshness';
import type { Forecast, Location } from '../../../domain/types';
import type { FetchErrorKind } from '../../../services/fetchJson';
import type { GeoError } from '../../../services/geolocation';

export type LocationState =
  | { status: 'none' }
  | { status: 'locating'; previous: SelectedLocation | null }
  | ({ status: 'selected' } & SelectedLocation);

export type SelectedLocation = { location: Location; saved: boolean };

export type ForecastErrorKind = Exclude<FetchErrorKind, 'aborted'> | 'offline';

export type ForecastState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; forecast: Forecast; refreshError: ForecastErrorKind | null }
  | { status: 'refreshing'; forecast: Forecast }
  | { status: 'error'; error: ForecastErrorKind };

export type ControllerState = {
  generation: number;
  location: LocationState;
  geoNotice: GeoError | null;
  forecast: ForecastState;
  /** Epoch seconds until which no automatic or manual retry is sent (429). */
  cooldownUntil: number | null;
};

export type Action =
  | { type: 'select'; location: Location; saved: boolean }
  | { type: 'clear_location' }
  | { type: 'locate_start' }
  | { type: 'locate_failed'; error: GeoError }
  | { type: 'fetch_start'; generation: number }
  | { type: 'fetch_success'; generation: number; locationKey: string; forecast: Forecast }
  | {
      type: 'fetch_failure';
      generation: number;
      locationKey: string;
      error: FetchErrorKind | 'offline';
      retryAfterSeconds?: number;
      now: number;
    };

export const initialState: ControllerState = {
  generation: 0,
  location: { status: 'none' },
  geoNotice: null,
  forecast: { status: 'idle' },
  cooldownUntil: null,
};

export function selectedLocation(state: ControllerState): Location | null {
  return state.location.status === 'selected' ? state.location.location : null;
}

function currentForecast(f: ForecastState): Forecast | null {
  return f.status === 'ready' || f.status === 'refreshing' ? f.forecast : null;
}

function matches(state: ControllerState, generation: number, locationKey: string): boolean {
  return state.generation === generation && selectedLocation(state)?.key === locationKey;
}

export function reducer(state: ControllerState, action: Action): ControllerState {
  switch (action.type) {
    case 'select':
      return {
        ...state,
        generation: state.generation + 1,
        location: { status: 'selected', location: action.location, saved: action.saved },
        geoNotice: null,
        forecast: { status: 'idle' },
      };
    case 'clear_location':
      return { ...state, generation: state.generation + 1, location: { status: 'none' }, forecast: { status: 'idle' } };
    case 'locate_start': {
      const previous =
        state.location.status === 'selected'
          ? { location: state.location.location, saved: state.location.saved }
          : state.location.status === 'locating'
            ? state.location.previous
            : null;
      return { ...state, location: { status: 'locating', previous }, geoNotice: null };
    }
    case 'locate_failed': {
      if (state.location.status !== 'locating') return state;
      const prev = state.location.previous;
      return {
        ...state,
        location: prev === null ? { status: 'none' } : { status: 'selected', ...prev },
        geoNotice: action.error,
      };
    }
    case 'fetch_start': {
      if (action.generation !== state.generation) return state;
      const existing = currentForecast(state.forecast);
      return { ...state, forecast: existing === null ? { status: 'loading' } : { status: 'refreshing', forecast: existing } };
    }
    case 'fetch_success':
      if (!matches(state, action.generation, action.locationKey)) return state;
      if (action.forecast.locationKey !== action.locationKey) return state;
      return { ...state, forecast: { status: 'ready', forecast: action.forecast, refreshError: null } };
    case 'fetch_failure': {
      if (!matches(state, action.generation, action.locationKey)) return state;
      const existing = currentForecast(state.forecast);
      if (action.error === 'aborted') {
        return existing === null ? state : { ...state, forecast: { status: 'ready', forecast: existing, refreshError: null } };
      }
      const cooldownUntil =
        action.error === 'rate_limited' ? action.now + (action.retryAfterSeconds ?? 60) : state.cooldownUntil;
      return {
        ...state,
        cooldownUntil,
        forecast:
          existing === null
            ? { status: 'error', error: action.error }
            : { status: 'ready', forecast: existing, refreshError: action.error },
      };
    }
  }
}

/** What the UI may show at `now`, derived from state and forecast age (ADR-016). */
export type ForecastView =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'error'; error: ForecastErrorKind | 'expired' }
  | {
      kind: 'data';
      forecast: Forecast;
      tier: Exclude<FreshnessTier, 'expired'>;
      recommendationsAllowed: boolean;
      refreshing: boolean;
      refreshError: ForecastErrorKind | null;
    };

export function forecastView(state: ControllerState, now: number): ForecastView {
  const f = state.forecast;
  switch (f.status) {
    case 'idle':
      return state.location.status === 'selected' ? { kind: 'loading' } : { kind: 'none' };
    case 'loading':
      return { kind: 'loading' };
    case 'error':
      return { kind: 'error', error: f.error };
    case 'ready':
    case 'refreshing': {
      const tier = freshnessTier(f.forecast.fetchedAt, now);
      if (tier === 'expired') {
        if (f.status === 'refreshing') return { kind: 'loading' };
        return { kind: 'error', error: f.refreshError ?? 'expired' };
      }
      return {
        kind: 'data',
        forecast: f.forecast,
        tier,
        recommendationsAllowed: recommendationsAllowed(tier),
        refreshing: f.status === 'refreshing',
        refreshError: f.status === 'ready' ? f.refreshError : null,
      };
    }
  }
}
