import { describe, expect, it } from 'vitest';
import { fetchJson, FetchJsonError, parseRetryAfter, type FetchJsonOptions } from '../../src/services/fetchJson';

const URL_ = new URL('https://geocoding-api.open-meteo.com/v1/search?name=x');

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function opts(responses: (() => Response | Promise<Response>)[], extra: Partial<FetchJsonOptions> = {}) {
  let calls = 0;
  const fetchImpl = (async () => {
    const next = responses[Math.min(calls, responses.length - 1)];
    calls += 1;
    if (next === undefined) throw new Error('no response');
    return next();
  }) as unknown as typeof fetch;
  return { o: { timeoutMs: 1000, fetchImpl, sleep: async () => {}, random: () => 0.5, ...extra }, calls: () => calls };
}

async function kindOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return e instanceof FetchJsonError ? e.kind : 'other';
  }
}

describe('fetchJson', () => {
  it('returns parsed JSON', async () => {
    const { o } = opts([() => json({ a: 1 })]);
    await expect(fetchJson(URL_, o)).resolves.toEqual({ a: 1 });
  });

  it('retries a 5xx exactly once', async () => {
    const { o, calls } = opts([() => json({}, { status: 503 }), () => json({}, { status: 503 })]);
    expect(await kindOf(fetchJson(URL_, o))).toBe('provider_unavailable');
    expect(calls()).toBe(2);
  });

  it('does not retry a 400', async () => {
    const { o, calls } = opts([() => json({}, { status: 400 })]);
    expect(await kindOf(fetchJson(URL_, o))).toBe('invalid_request');
    expect(calls()).toBe(1);
  });

  it('reports 429 with Retry-After and does not retry', async () => {
    const { o, calls } = opts([() => json({}, { status: 429, headers: { 'Retry-After': '120' } })]);
    try {
      await fetchJson(URL_, o);
    } catch (e) {
      expect(e).toBeInstanceOf(FetchJsonError);
      expect((e as FetchJsonError).retryAfterSeconds).toBe(120);
    }
    expect(calls()).toBe(1);
  });

  it('rejects non-JSON content and malformed JSON as invalid_response', async () => {
    const html = opts([() => new Response('<html>', { headers: { 'Content-Type': 'text/html' } })]);
    expect(await kindOf(fetchJson(URL_, html.o))).toBe('invalid_response');
    const bad = opts([() => new Response('{', { headers: { 'Content-Type': 'application/json' } })]);
    expect(await kindOf(fetchJson(URL_, bad.o))).toBe('invalid_response');
  });

  it('times out', async () => {
    const fetchImpl = ((_: URL, init: RequestInit) =>
      new Promise((_r, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))) as unknown as typeof fetch;
    expect(await kindOf(fetchJson(URL_, { timeoutMs: 10, retries: 0, fetchImpl }))).toBe('timeout');
  });

  it('reports caller aborts as aborted, never retried', async () => {
    const controller = new AbortController();
    let calls = 0;
    const fetchImpl = ((_: URL, init: RequestInit) => {
      calls += 1;
      return new Promise((_r, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    }) as unknown as typeof fetch;
    const p = fetchJson(URL_, { timeoutMs: 1000, fetchImpl, signal: controller.signal });
    controller.abort();
    expect(await kindOf(p)).toBe('aborted');
    expect(calls).toBe(1);
  });
});

describe('parseRetryAfter', () => {
  it('parses seconds, HTTP dates and falls back to 60', () => {
    expect(parseRetryAfter('30', 0)).toBe(30);
    expect(parseRetryAfter(new Date(90_000).toUTCString(), 0)).toBe(90);
    expect(parseRetryAfter('soon', 0)).toBe(60);
    expect(parseRetryAfter(null, 0)).toBe(60);
  });
});
