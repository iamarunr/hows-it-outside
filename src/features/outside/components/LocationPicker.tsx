import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import type { Location } from '../../../domain/types';
import { FetchJsonError } from '../../../services/fetchJson';
import {
  normalizeQuery,
  searchPlaces,
  shouldAutoSearch,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MAX_LENGTH,
  type GeocodingCache,
  type PlaceResult,
} from '../../../services/geocoding';
import { GEO_ERROR_COPY, type GeoError } from '../../../services/geolocation';

type SearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'results'; results: PlaceResult[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

function searchErrorMessage(error: unknown): string {
  if (error instanceof FetchJsonError) {
    if (error.kind === 'rate_limited') return 'Too many searches right now. Please wait a minute and try again.';
    if (error.kind === 'timeout' || error.kind === 'network') {
      return 'Search could not reach the location service. Check your connection and try again.';
    }
  }
  return 'Search is unavailable right now. Please try again.';
}

export type LocationPickerProps = {
  location: Location | null;
  saved: boolean;
  locating: boolean;
  geoNotice: GeoError | null;
  geocodingCache: GeocodingCache;
  onSelectPlace: (place: PlaceResult) => void;
  onLocateMe: () => void;
  announce: (message: string) => void;
  /** False until the island has hydrated: controls stay disabled so early input is never lost or natively submitted. */
  ready: boolean;
};

export function LocationPicker(props: LocationPickerProps) {
  const { location, saved, locating, geoNotice, geocodingCache, onSelectPlace, onLocateMe, announce, ready } = props;
  const inputId = useId();
  const [openRequested, setOpen] = useState(false);
  // The search is always shown when nothing is selected (first visit, cleared, or after a denied location).
  const open = openRequested || location === null;
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  // Move focus deliberately: into the input when opened by Change; back to Change when closed.
  useEffect(() => {
    if (open && !wasOpen.current) inputRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  function runSearch(raw: string): void {
    const normalized = normalizeQuery(raw);
    controllerRef.current?.abort();
    if (normalized === '') {
      setSearch({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    const generation = ++generationRef.current;
    setSearch({ status: 'searching' });
    searchPlaces(normalized, controller.signal, geocodingCache).then(
      (results) => {
        if (generation !== generationRef.current) return;
        if (results.length > 0) {
          setSearch({ status: 'results', results });
          announce(`${results.length} ${results.length === 1 ? 'place' : 'places'} found.`);
        } else {
          setSearch({ status: 'empty' });
          announce('No places found. Try the full name or add the country.');
        }
      },
      (error: unknown) => {
        if (generation !== generationRef.current) return;
        if (error instanceof FetchJsonError && error.kind === 'aborted') return;
        setSearch({ status: 'error', message: searchErrorMessage(error) });
      },
    );
  }

  useEffect(() => {
    const normalized = normalizeQuery(query);
    if (!shouldAutoSearch(normalized)) return undefined;
    const timer = setTimeout(() => runSearch(normalized), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // runSearch is intentionally recreated each render; the query is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function onSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    runSearch(query);
  }

  function choose(place: PlaceResult): void {
    controllerRef.current?.abort();
    generationRef.current += 1;
    setSearch({ status: 'idle' });
    setQuery('');
    setOpen(false);
    onSelectPlace(place);
  }

  function locate(): void {
    setOpen(false);
    onLocateMe();
  }

  return (
    <section className="location" aria-label="Location">
      {location !== null && (
        <div className="location-current">
          {(saved || location.source === 'device') && (
            <p className="location-label">
              <span className="location-kind">{saved ? 'Saved location' : 'Approximate location'}</span>
            </p>
          )}
          {!open && (
            <button ref={changeRef} type="button" onClick={() => setOpen(true)}>
              Change location
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="location-panel">
          <div className="locate">
            <button type="button" onClick={locate} disabled={locating || !ready} aria-describedby={`${inputId}-geo-help`}>
              {locating ? 'Finding your location…' : 'Use my location'}
            </button>
            <p id={`${inputId}-geo-help`} className="hint">
              Uses your approximate location to load weather.
            </p>
          </div>

          <form role="search" onSubmit={onSubmit} className="search-form">
            <label htmlFor={inputId}>Search city or place</label>
            <div className="search-row">
              <input
                disabled={!ready}
                ref={inputRef}
                id={inputId}
                type="search"
                name="place"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" disabled={!ready}>
                Search
              </button>
            </div>
          </form>

          {search.status === 'searching' && <p className="hint">Searching…</p>}
          {search.status === 'empty' && <p className="hint">No places found. Try the full name or add the country.</p>}
          {search.status === 'error' && (
            <p role="alert" className="notice notice-concern">
              {search.message}
            </p>
          )}
          {search.status === 'results' && (
            <ul className="search-results" aria-label="Matching places">
              {search.results.map((place) => (
                <li key={place.id}>
                  <button type="button" onClick={() => choose(place)}>
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {location !== null && (
            <button type="button" className="link-button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          )}
        </div>
      )}

      {geoNotice !== null && (
        <div role="alert" className="notice notice-concern">
          <p>{GEO_ERROR_COPY[geoNotice]}</p>
          {geoNotice !== 'unsupported' && geoNotice !== 'denied' && (
            <button type="button" onClick={locate}>
              Try again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
