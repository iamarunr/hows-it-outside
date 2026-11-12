import type { ForecastErrorKind, ForecastView } from '../controller/reducer';
import { formatTime, zoneName } from '../../../lib/time';

const ERROR_COPY: Readonly<Record<ForecastErrorKind | 'expired', string>> = {
  offline: "Weather couldn't load because you're offline. Try again when you're connected.",
  rate_limited: 'The weather service is busy. Please wait a minute and try again.',
  timeout: "Weather couldn't load. Try again or choose another location.",
  network: "Weather couldn't load. Try again or choose another location.",
  invalid_request: "Weather couldn't load. Try again or choose another location.",
  invalid_response: "Weather couldn't load. Try again or choose another location.",
  provider_unavailable: "Weather couldn't load. Try again or choose another location.",
  expired: "Weather couldn't load. Try again or choose another location.",
};

export type DataStatusProps = {
  view: ForecastView;
  now: number;
  cooldownUntil: number | null;
  onRetry: () => void;
};

/** Loading, error, stale and retrieval notices. Concerning states render before any positive summary. */
export function DataStatus({ view, now, cooldownUntil, onRetry }: DataStatusProps) {
  const coolingDown = cooldownUntil !== null && now < cooldownUntil;

  if (view.kind === 'loading') {
    return (
      <div className="skeleton" aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
    );
  }

  if (view.kind === 'error') {
    return (
      <div role="alert" className="notice notice-concern">
        <p>{ERROR_COPY[view.error]}</p>
        <button type="button" onClick={onRetry} disabled={coolingDown}>
          Try again
        </button>
      </div>
    );
  }

  if (view.kind !== 'data') return null;
  const { forecast, tier, refreshError } = view;
  const retrieved = `${formatTime(forecast.fetchedAt, forecast.timezone)} ${zoneName(forecast.fetchedAt, forecast.timezone)}`;

  return (
    <>
      {forecast.timezoneFallback && (
        <p className="notice notice-mixed">
          The time zone for this place is unavailable, so times are shown in UTC.
        </p>
      )}
      {tier === 'stale' && (
        <div className="notice notice-mixed">
          <p>Showing an earlier forecast retrieved at {retrieved}. Suggestions are paused until it refreshes.</p>
          <button type="button" onClick={onRetry} disabled={coolingDown}>
            Refresh
          </button>
        </div>
      )}
      {tier !== 'stale' && refreshError !== null && (
        <p className="notice notice-mixed">Couldn&apos;t refresh. Forecast retrieved at {retrieved}.</p>
      )}
    </>
  );
}
