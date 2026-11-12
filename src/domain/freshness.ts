/**
 * Forecast freshness tiers (spec 02-ARCHITECTURE §6, ADR-016).
 * Boundaries belong to the later tier. Pure.
 */

export type FreshnessTier = 'fresh' | 'due' | 'stale' | 'expired';

export const FRESH_SECONDS = 15 * 60;
export const STALE_AFTER_SECONDS = 60 * 60;
export const EXPIRE_AFTER_SECONDS = 2 * 60 * 60;
/** Cache entries whose fetchedAt is further in the future than this are invalid. */
export const MAX_FUTURE_SKEW_SECONDS = 60;

export function freshnessTier(fetchedAt: number, now: number): FreshnessTier {
  const age = now - fetchedAt;
  if (age < FRESH_SECONDS) return 'fresh';
  if (age < STALE_AFTER_SECONDS) return 'due';
  if (age < EXPIRE_AFTER_SECONDS) return 'stale';
  return 'expired';
}

/** Whether recommendations may be shown for a forecast of this age. */
export function recommendationsAllowed(tier: FreshnessTier): boolean {
  return tier === 'fresh' || tier === 'due';
}

/** Whether "now" from the current block is usable: ≤90 min old and ≤10 min in the future (spec 03 §4). */
export function currentIsUsable(currentTime: number, now: number): 'ok' | 'too_old' | 'in_future' {
  if (currentTime - now > 10 * 60) return 'in_future';
  if (now - currentTime > 90 * 60) return 'too_old';
  return 'ok';
}
