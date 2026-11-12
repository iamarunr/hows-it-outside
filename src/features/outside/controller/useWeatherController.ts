/**
 * Weather controller hook: owns selection, request lifecycle, cache and
 * refresh triggers (spec 02-ARCHITECTURE §4–§6). Side effects live here;
 * state transitions live in the pure reducer.
 *
 * Refresh triggers: first selection, explicit retry, tab becoming visible,
 * coming back online, and a once-a-minute check while visible. Never while
 * hidden, offline or in a 429 cooldown; only when the forecast is due.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { freshnessTier } from '../../../domain/freshness';
import type { Location } from '../../../domain/types';
import { locationKey, type Coordinates } from '../../../lib/geo';
import { createForecastCache, forecastCacheKey, type ForecastCache } from '../../../services/cache';
import { FetchJsonError } from '../../../services/fetchJson';
import { createGeocodingCache, type GeocodingCache, type PlaceResult } from '../../../services/geocoding';
import { requestDeviceLocation } from '../../../services/geolocation';
import {
  createSettingsStore,
  defaultSettings,
  forgetLocation as forgetSaved,
  withRemember,
  withSavedLocation,
  type LoadNotice,
  type SavedLocation,
  type Settings,
  type SettingsStore,
} from '../../../services/settings';
import { browserLocalStore, browserSessionStore } from '../../../services/storageAdapter';
import { createForecastProvider, type ForecastProvider } from '../../../services/weather/provider';
import { forecastView, initialState, reducer, selectedLocation, type ForecastView } from './reducer';

export const REFRESH_CHECK_MS = 60_000;

export type ControllerDeps = {
  now: () => number;
  provider: ForecastProvider;
  cache: ForecastCache;
  settingsStore: SettingsStore;
  geocodingCache: GeocodingCache;
  geolocation: () => Pick<Geolocation, 'getCurrentPosition'> | undefined;
  isOnline: () => boolean;
  isVisible: () => boolean;
};

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

export function browserDeps(): ControllerDeps {
  return {
    now: nowSeconds,
    provider: createForecastProvider({ now: nowSeconds }),
    cache: createForecastCache(browserSessionStore()),
    settingsStore: createSettingsStore(browserLocalStore()),
    geocodingCache: createGeocodingCache(nowSeconds),
    geolocation: () => (typeof navigator === 'undefined' ? undefined : navigator.geolocation),
    isOnline: () => typeof navigator === 'undefined' || navigator.onLine,
    isVisible: () => typeof document === 'undefined' || document.visibilityState === 'visible',
  };
}

export function locationFromPlace(place: PlaceResult): Location {
  return {
    key: locationKey(place),
    latitude: place.latitude,
    longitude: place.longitude,
    label: place.label,
    source: 'search',
    ...(place.countryCode !== undefined && { countryCode: place.countryCode }),
    ...(place.timezone !== undefined && { timezone: place.timezone }),
  };
}

export function deviceLocation(coords: Coordinates): Location {
  return { key: locationKey(coords), ...coords, label: 'Current area', source: 'device' };
}

function toSaved(location: Location): SavedLocation {
  return { ...location };
}

export type WeatherController = {
  view: ForecastView;
  now: number;
  location: ReturnType<typeof selectedLocation>;
  locationSaved: boolean;
  locating: boolean;
  geoNotice: ReturnType<typeof reducer>['geoNotice'];
  cooldownUntil: number | null;
  settings: Settings;
  settingsNotice: LoadNotice;
  storagePersistent: boolean;
  /** False until browser-only state (settings, clock) has loaded after hydration. */
  hydrated: boolean;
  online: boolean;
  geocodingCache: GeocodingCache;
  selectPlace: (place: PlaceResult) => void;
  locateMe: () => void;
  retry: () => void;
  updateSettings: (update: (s: Settings) => Settings) => void;
  setRemember: (remember: boolean) => void;
  forgetLocation: () => void;
};

export function useWeatherController(depsFactory: () => ControllerDeps = browserDeps): WeatherController {
  const deps = useMemo(depsFactory, [depsFactory]);
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  // Declared first so it runs before the other effects in each commit.
  useEffect(() => {
    stateRef.current = state;
  });

  const [now, setNow] = useState(() => deps.now());
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsNotice, setSettingsNotice] = useState<LoadNotice>(null);
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    const s = stateRef.current;
    const loc = selectedLocation(s);
    if (loc === null) return;
    const t = deps.now();
    if (s.cooldownUntil !== null && t < s.cooldownUntil) return;
    const generation = s.generation;
    if (!deps.isOnline()) {
      dispatch({ type: 'fetch_failure', generation, locationKey: loc.key, error: 'offline', now: t });
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'fetch_start', generation });
    deps.provider.fetch(loc, controller.signal).then(
      (forecast) => {
        deps.cache.put(forecastCacheKey(loc), forecast);
        dispatch({ type: 'fetch_success', generation, locationKey: loc.key, forecast });
      },
      (error: unknown) => {
        const e = error instanceof FetchJsonError ? error : new FetchJsonError('invalid_response');
        dispatch({
          type: 'fetch_failure',
          generation,
          locationKey: loc.key,
          error: e.kind,
          ...(e.retryAfterSeconds !== undefined && { retryAfterSeconds: e.retryAfterSeconds }),
          now: deps.now(),
        });
      },
    );
  }, [deps]);

  /** Refresh only when the shown forecast is due or older and nothing is in flight. */
  const maybeRefresh = useCallback(() => {
    const s = stateRef.current;
    const t = deps.now();
    setNow(t);
    if (!deps.isVisible() || !deps.isOnline()) return;
    const f = s.forecast;
    if (f.status === 'ready') {
      if (freshnessTier(f.forecast.fetchedAt, t) !== 'fresh') load();
    } else if (f.status === 'error' && (f.error === 'offline' || f.error === 'network')) {
      load();
    }
  }, [deps, load]);

  // Browser-only initialization after hydration: settings and saved location.
  useEffect(() => {
    const loaded = deps.settingsStore.load();
    setSettings(loaded.settings);
    setSettingsNotice(loaded.notice);
    setOnline(deps.isOnline());
    setNow(deps.now());
    setHydrated(true);
    const saved = loaded.settings.savedLocation;
    if (loaded.settings.rememberLocation && saved !== null) dispatch({ type: 'select', location: saved, saved: true });
  }, [deps]);

  // Persist settings after the initial load.
  useEffect(() => {
    if (hydrated) deps.settingsStore.save(settings);
  }, [deps, hydrated, settings]);

  // On each new selection: abort the old request, use the cache, fetch if needed.
  useEffect(() => {
    const loc = selectedLocation(stateRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    if (loc === null) return;
    const t = deps.now();
    setNow(t);
    const cached = deps.cache.get(forecastCacheKey(loc), loc.key, t);
    if (cached !== null) {
      dispatch({ type: 'fetch_success', generation: state.generation, locationKey: loc.key, forecast: cached });
      if (freshnessTier(cached.fetchedAt, t) === 'fresh') return;
    }
    load();
  }, [deps, load, state.generation]);

  // Refresh checks: once a minute while visible, on visibility return, on reconnect.
  useEffect(() => {
    const timer = setInterval(maybeRefresh, REFRESH_CHECK_MS);
    const onVisibility = (): void => {
      if (deps.isVisible()) maybeRefresh();
    };
    const onOnline = (): void => {
      setOnline(true);
      maybeRefresh();
    };
    const onOffline = (): void => setOnline(false);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [deps, maybeRefresh]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const select = useCallback((location: Location) => {
    dispatch({ type: 'select', location, saved: false });
    setSettings((s) => withSavedLocation(s, toSaved(location)));
  }, []);

  const selectPlace = useCallback((place: PlaceResult) => select(locationFromPlace(place)), [select]);

  const locateMe = useCallback(() => {
    dispatch({ type: 'locate_start' });
    void requestDeviceLocation(deps.geolocation()).then((result) => {
      if (result.ok) select(deviceLocation(result.coords));
      else dispatch({ type: 'locate_failed', error: result.error });
    });
  }, [deps, select]);

  const setRemember = useCallback((remember: boolean) => {
    const loc = selectedLocation(stateRef.current);
    setSettings((s) => withRemember(s, remember, loc === null ? null : toSaved(loc)));
  }, []);

  const forgetLocation = useCallback(() => {
    abortRef.current?.abort();
    deps.cache.clear();
    setSettings((s) => forgetSaved(s));
    dispatch({ type: 'clear_location' });
  }, [deps]);

  return {
    view: forecastView(state, now),
    now,
    location: selectedLocation(state),
    locationSaved: state.location.status === 'selected' && state.location.saved,
    locating: state.location.status === 'locating',
    geoNotice: state.geoNotice,
    cooldownUntil: state.cooldownUntil,
    settings,
    settingsNotice,
    storagePersistent: deps.settingsStore.persistent,
    hydrated,
    online,
    geocodingCache: deps.geocodingCache,
    selectPlace,
    locateMe,
    retry: load,
    updateSettings: setSettings,
    setRemember,
    forgetLocation,
  };
}
