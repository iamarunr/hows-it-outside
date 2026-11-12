import type { Interval } from '../../src/domain/types';

/** Synthetic interval: mild, dry, calm daylight hour unless overridden. */
export function makeInterval(start: number, overrides: Partial<Interval> = {}): Interval {
  return {
    start,
    end: start + 3600,
    temperatureC: 20,
    feelsLikeC: 20,
    humidityPct: 50,
    windKmh: 5,
    gustKmh: 10,
    precipMm: 0,
    precipProbabilityPct: 0,
    weatherCodes: [1],
    weatherCodeComplete: true,
    daylight: true,
    ...overrides,
  };
}

/** Deterministic PRNG (mulberry32) for property tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** In-memory Storage double; optionally throws on every call. */
export function fakeStorage(opts: { throwOn?: 'all' | 'set' } = {}): Storage {
  const map = new Map<string, string>();
  const maybeThrow = (op: 'get' | 'set') => {
    if (opts.throwOn === 'all' || (opts.throwOn === 'set' && op === 'set')) throw new DOMException('nope', 'QuotaExceededError');
  };
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => {
      maybeThrow('get');
      return map.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      maybeThrow('set');
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

