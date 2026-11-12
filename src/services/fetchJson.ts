/**
 * Minimal JSON request client with timeout, abort, typed error categories,
 * one bounded retry for network/5xx, and 429 cooldown reporting.
 * M2 extends this (dedupe, cooldown state); the error contract is fixed here.
 */

export type FetchErrorKind =
  | 'aborted'
  | 'timeout'
  | 'network'
  | 'rate_limited'
  | 'invalid_request'
  | 'invalid_response'
  | 'provider_unavailable';

export class FetchJsonError extends Error {
  readonly kind: FetchErrorKind;
  /** Seconds until retry is allowed, for rate_limited. */
  readonly retryAfterSeconds: number | undefined;

  constructor(kind: FetchErrorKind, retryAfterSeconds?: number) {
    super(kind);
    this.name = 'FetchJsonError';
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type FetchJsonOptions = {
  signal?: AbortSignal;
  timeoutMs: number;
  /** Automatic retries for network/5xx only. Spec: at most 1. */
  retries?: 0 | 1;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
};

const DEFAULT_RATE_LIMIT_SECONDS = 60;

/** Parses Retry-After (delta-seconds or HTTP date). Falls back to 60 s. */
export function parseRetryAfter(header: string | null, nowMs: number): number {
  if (header === null) return DEFAULT_RATE_LIMIT_SECONDS;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Math.max(0, Number(trimmed));
  const date = Date.parse(trimmed);
  if (Number.isFinite(date)) return Math.max(0, Math.ceil((date - nowMs) / 1000));
  return DEFAULT_RATE_LIMIT_SECONDS;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attempt(url: URL, opts: FetchJsonOptions): Promise<unknown> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs);
  const onOuterAbort = (): void => controller.abort();
  opts.signal?.addEventListener('abort', onOuterAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
    } catch {
      if (opts.signal?.aborted) throw new FetchJsonError('aborted');
      if (timedOut) throw new FetchJsonError('timeout');
      throw new FetchJsonError('network');
    }

    if (response.status === 429) {
      throw new FetchJsonError('rate_limited', parseRetryAfter(response.headers.get('Retry-After'), Date.now()));
    }
    if (response.status >= 500) throw new FetchJsonError('provider_unavailable');
    if (response.status >= 400) throw new FetchJsonError('invalid_request');
    if (!response.ok) throw new FetchJsonError('invalid_response');

    const contentType = response.headers.get('Content-Type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new FetchJsonError('invalid_response');
    }
    try {
      return (await response.json()) as unknown;
    } catch {
      if (opts.signal?.aborted) throw new FetchJsonError('aborted');
      if (timedOut) throw new FetchJsonError('timeout');
      throw new FetchJsonError('invalid_response');
    }
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onOuterAbort);
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof FetchJsonError && (error.kind === 'network' || error.kind === 'provider_unavailable');
}

export async function fetchJson(url: URL, opts: FetchJsonOptions): Promise<unknown> {
  const retries = opts.retries ?? 1;
  try {
    return await attempt(url, opts);
  } catch (error) {
    if (retries === 0 || !isRetryable(error) || opts.signal?.aborted) throw error;
    const random = opts.random ?? Math.random;
    const delay = 500 + random() * 500; // jitter around 750 ms
    await (opts.sleep ?? defaultSleep)(delay);
    if (opts.signal?.aborted) throw new FetchJsonError('aborted');
    return attempt(url, opts);
  }
}
