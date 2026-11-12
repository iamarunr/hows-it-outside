/**
 * Single validated configuration module. Public values only: everything here
 * is shipped to the browser. Provider origins are fixed constants; they are
 * never overridable at runtime (no query/hash/localStorage overrides).
 */

export const PROVIDER_ORIGINS = {
  forecast: 'https://api.open-meteo.com',
  geocoding: 'https://geocoding-api.open-meteo.com',
} as const;

export const ENDPOINTS = {
  forecast: `${PROVIDER_ORIGINS.forecast}/v1/forecast`,
  geocoding: `${PROVIDER_ORIGINS.geocoding}/v1/search`,
} as const;

export const BUILD_INFO = {
  scoringVersion: 1,
  schemaVersion: 1,
} as const;

/** Returns the URL only if it is an absolute http(s) URL; otherwise undefined. */
export function parsePublicUrl(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export const SITE_LINKS = {
  source: parsePublicUrl(import.meta.env.PUBLIC_SOURCE_URL),
  author: parsePublicUrl(import.meta.env.PUBLIC_AUTHOR_URL),
} as const;
