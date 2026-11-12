/**
 * Forecast provider: request → validate → normalize, with identical in-flight
 * requests deduplicated (spec 02 §5). A shared request is aborted only when
 * every caller has aborted.
 */
import type { Forecast } from '../../domain/types';
import { locationKey, type Coordinates } from '../../lib/geo';
import { fetchJson, FetchJsonError } from '../fetchJson';
import { forecastCacheKey } from '../cache';
import { normalizeForecast } from './normalize';
import { buildForecastUrl } from './openMeteo';

export const FORECAST_TIMEOUT_MS = 10_000;

export type ForecastProvider = {
  fetch(coords: Coordinates, signal?: AbortSignal): Promise<Forecast>;
};

type Inflight = { promise: Promise<Forecast>; controller: AbortController; waiters: number };

export function createForecastProvider(deps: { now: () => number; fetchImpl?: typeof fetch }): ForecastProvider {
  const inflight = new Map<string, Inflight>();

  function start(coords: Coordinates, key: string): Inflight {
    const controller = new AbortController();
    const promise = fetchJson(buildForecastUrl(coords), {
      timeoutMs: FORECAST_TIMEOUT_MS,
      signal: controller.signal,
      ...(deps.fetchImpl !== undefined && { fetchImpl: deps.fetchImpl }),
    })
      .then((payload) => {
        const result = normalizeForecast(payload, { locationKey: locationKey(coords), fetchedAt: deps.now() });
        if (!result.ok) throw new FetchJsonError('invalid_response');
        return result.forecast;
      })
      .finally(() => {
        if (inflight.get(key)?.promise === promise) inflight.delete(key);
      });
    const entry: Inflight = { promise, controller, waiters: 0 };
    inflight.set(key, entry);
    return entry;
  }

  return {
    fetch(coords, signal) {
      if (signal?.aborted) return Promise.reject(new FetchJsonError('aborted'));
      const key = forecastCacheKey(coords);
      const entry = inflight.get(key) ?? start(coords, key);
      entry.waiters += 1;

      return new Promise<Forecast>((resolve, reject) => {
        let settled = false;
        const onAbort = (): void => {
          if (settled) return;
          settled = true;
          entry.waiters -= 1;
          if (entry.waiters === 0) {
            entry.controller.abort();
            if (inflight.get(key) === entry) inflight.delete(key);
          }
          reject(new FetchJsonError('aborted'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        entry.promise.then(
          (forecast) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener('abort', onAbort);
            resolve(forecast);
          },
          (error: unknown) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener('abort', onAbort);
            reject(error instanceof FetchJsonError ? error : new FetchJsonError('invalid_response'));
          },
        );
      });
    },
  };
}
