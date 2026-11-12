import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { FetchJsonError } from '../../services/fetchJson';
import {
  normalizeQuery,
  searchPlaces,
  shouldAutoSearch,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MAX_LENGTH,
  type PlaceResult,
} from '../../services/geocoding';

/**
 * M0 slice: place search only, wired to the real geocoding service.
 * The forecast, scoring and full location controls arrive in M1–M3.
 */

type SearchState =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'results'; query: string; results: PlaceResult[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof FetchJsonError) {
    switch (error.kind) {
      case 'rate_limited':
        return 'Too many searches right now. Please wait a minute and try again.';
      case 'timeout':
      case 'network':
        return 'Search could not reach the location service. Check your connection and try again.';
      default:
        return 'Search is unavailable right now. Please try again.';
    }
  }
  return 'Search is unavailable right now. Please try again.';
}

export default function OutsideApp() {
  const inputId = useId();
  const statusId = useId();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null);

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
    setSearch({ status: 'searching', query: normalized });
    searchPlaces(normalized, controller.signal).then(
      (results) => {
        if (generation !== generationRef.current) return;
        setSearch(
          results.length > 0
            ? { status: 'results', query: normalized, results }
            : { status: 'empty', query: normalized },
        );
      },
      (error: unknown) => {
        if (generation !== generationRef.current) return;
        if (error instanceof FetchJsonError && error.kind === 'aborted') return;
        setSearch({ status: 'error', query: normalized, message: errorMessage(error) });
      },
    );
  }

  useEffect(() => {
    const normalized = normalizeQuery(query);
    if (!shouldAutoSearch(normalized)) return undefined;
    const timer = setTimeout(() => runSearch(normalized), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (selected !== null) selectedHeadingRef.current?.focus();
  }, [selected]);

  function onSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    runSearch(query);
  }

  const statusText =
    search.status === 'searching'
      ? 'Searching…'
      : search.status === 'results'
        ? `${search.results.length} ${search.results.length === 1 ? 'place' : 'places'} found.`
        : search.status === 'empty'
          ? 'No places found. Try the full name or add the country.'
          : '';

  return (
    <div className="outside-app">
      <form role="search" onSubmit={onSubmit} className="search-form">
        <label htmlFor={inputId}>Search city or place</label>
        <div className="search-row">
          <input
            id={inputId}
            type="search"
            name="place"
            autoComplete="off"
            maxLength={SEARCH_MAX_LENGTH}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={statusId}
          />
          <button type="submit">Search</button>
        </div>
      </form>

      <p id={statusId} role="status" aria-live="polite" className="search-status">
        {statusText}
      </p>

      {search.status === 'error' && (
        <p role="alert" className="search-error">
          {search.message}
        </p>
      )}

      {search.status === 'results' && (
        <ul className="search-results" aria-label="Matching places">
          {search.results.map((place) => (
            <li key={place.id}>
              <button type="button" onClick={() => setSelected(place)}>
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected !== null && (
        <section aria-labelledby="selected-place" className="selected-place">
          <h2 id="selected-place" ref={selectedHeadingRef} tabIndex={-1}>
            {selected.label}
          </h2>
          {selected.timezone !== undefined && <p>Time zone: {selected.timezone}</p>}
          <p>Forecast display is not built yet (implementation milestones M1–M3).</p>
        </section>
      )}
    </div>
  );
}
