import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FetchJsonError } from '../../src/services/fetchJson';
import { GEOLOCATION_OPTIONS, requestDeviceLocation } from '../../src/services/geolocation';
import { createForecastProvider } from '../../src/services/weather/provider';

const sample = readFileSync(new URL('../fixtures/forecast/open-meteo-sample-st-louis.json', import.meta.url), 'utf8');
const coords = { latitude: 38.63, longitude: -90.2 };
const NOW = 1794736800;

function controlledFetch(body = sample) {
  const calls: URL[] = [];
  const pending: { resolve: () => void; signal: AbortSignal | undefined }[] = [];
  const fetchImpl = ((url: URL, init: RequestInit) => {
    calls.push(url);
    return new Promise<Response>((resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      pending.push({
        resolve: () => resolve(new Response(body, { headers: { 'Content-Type': 'application/json' } })),
        signal: init.signal ?? undefined,
      });
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls, pending };
}

async function kind(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return e instanceof FetchJsonError ? e.kind : 'other';
  }
}

describe('forecast provider', () => {
  it('fetches, validates and normalizes with fetchedAt from the injected clock', async () => {
    const f = controlledFetch();
    const provider = createForecastProvider({ now: () => NOW, fetchImpl: f.fetchImpl });
    const p = provider.fetch(coords);
    await Promise.resolve();
    f.pending[0]?.resolve();
    const forecast = await p;
    expect(forecast.fetchedAt).toBe(NOW);
    expect(forecast.locationKey).toBe('38.63,-90.20');
    expect(forecast.intervals.length).toBeGreaterThan(24);
    expect(f.calls[0]?.searchParams.get('latitude')).toBe('38.63');
  });

  it('deduplicates identical in-flight requests', async () => {
    const f = controlledFetch();
    const provider = createForecastProvider({ now: () => NOW, fetchImpl: f.fetchImpl });
    const a = provider.fetch(coords);
    const b = provider.fetch(coords);
    await Promise.resolve();
    expect(f.calls).toHaveLength(1);
    f.pending[0]?.resolve();
    expect((await a).fetchedAt).toBe((await b).fetchedAt);
  });

  it('aborts the shared request only when every caller aborts', async () => {
    const f = controlledFetch();
    const provider = createForecastProvider({ now: () => NOW, fetchImpl: f.fetchImpl });
    const c1 = new AbortController();
    const c2 = new AbortController();
    const a = provider.fetch(coords, c1.signal);
    const b = provider.fetch(coords, c2.signal);
    await Promise.resolve();
    c1.abort();
    expect(await kind(a)).toBe('aborted');
    expect(f.pending[0]?.signal?.aborted).toBe(false);
    f.pending[0]?.resolve();
    expect(await kind(b)).toBe('ok');

    const c3 = new AbortController();
    const c = provider.fetch(coords, c3.signal);
    await Promise.resolve();
    c3.abort();
    expect(await kind(c)).toBe('aborted');
    expect(f.pending[1]?.signal?.aborted).toBe(true);
  });

  it('reports a payload that fails normalization as invalid_response', async () => {
    const f = controlledFetch(JSON.stringify({ hourly: { time: [3, 2, 1] }, hourly_units: { time: 'unixtime' } }));
    const provider = createForecastProvider({ now: () => NOW, fetchImpl: f.fetchImpl });
    const p = provider.fetch(coords);
    await Promise.resolve();
    f.pending[0]?.resolve();
    expect(await kind(p)).toBe('invalid_response');
  });
});

describe('device location', () => {
  type Success = (p: GeolocationPosition) => void;
  type Failure = (e: GeolocationPositionError) => void;

  function geo(behaviour: (ok: Success, fail: Failure, opts?: PositionOptions) => void) {
    const seen: (PositionOptions | undefined)[] = [];
    return {
      seen,
      api: {
        getCurrentPosition: (ok: Success, fail?: Failure | null, opts?: PositionOptions) => {
          seen.push(opts);
          behaviour(ok, fail ?? (() => {}), opts);
        },
      },
    };
  }

  it('rounds coordinates and uses the specified options', async () => {
    const g = geo((ok) => ok({ coords: { latitude: 38.627274, longitude: -90.197889, accuracy: 12 } } as GeolocationPosition));
    expect(await requestDeviceLocation(g.api)).toEqual({ ok: true, coords: { latitude: 38.63, longitude: -90.2 } });
    expect(g.seen[0]).toEqual(GEOLOCATION_OPTIONS);
    expect(GEOLOCATION_OPTIONS).toEqual({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ] as const)('maps error code %i to %s', async (code, expected) => {
    const g = geo((_ok, fail) => fail({ code } as GeolocationPositionError));
    expect(await requestDeviceLocation(g.api)).toEqual({ ok: false, error: expected });
  });

  it('reports unsupported when the API is missing', async () => {
    expect(await requestDeviceLocation(undefined)).toEqual({ ok: false, error: 'unsupported' });
  });

  it('treats invalid coordinates as unavailable, not as 0,0', async () => {
    const g = geo((ok) => ok({ coords: { latitude: Number.NaN, longitude: 0 } } as GeolocationPosition));
    expect(await requestDeviceLocation(g.api)).toEqual({ ok: false, error: 'unavailable' });
  });
});
