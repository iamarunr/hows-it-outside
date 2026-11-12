/**
 * Versioned local settings (spec 02 §6, 05 Controls). Preferences persist in
 * localStorage; a saved location persists only with the explicit remember
 * opt-in, and pinned places only because the visitor pinned them. Locations
 * are always rounded. Corrupt or unknown data resets to defaults with a
 * notice instead of crashing. Storage failure degrades to memory.
 */
import * as z from 'zod/mini';
import { ACTIVITY_IDS, ACTIVITY_PRESETS, DEFAULT_DURATION, validateComfortBand } from '../domain/activities';
import type { ActivityId, ActivityPreferences, DurationMinutes } from '../domain/types';
import { locationKey, roundCoordinates } from '../lib/geo';
import type { UnitSystem } from '../lib/units';
import type { KeyValueStore } from './storageAdapter';

export const SETTINGS_STORAGE_KEY = 'outside:settings';
export const SETTINGS_VERSION = 1;
/** PRODUCT ASSUMPTION: three pins, matching the three shortcut cards on the first screen. */
export const PIN_LIMIT = 3;

export type SavedLocation = {
  key: string;
  latitude: number;
  longitude: number;
  label: string;
  source: 'search' | 'device';
  countryCode?: string;
  timezone?: string;
};

export type Settings = {
  version: 1;
  activity: ActivityId;
  /** null = follow locale default. */
  units: UnitSystem | null;
  durationMinutes: DurationMinutes;
  activities: Record<ActivityId, ActivityPreferences>;
  rememberLocation: boolean;
  savedLocation: SavedLocation | null;
  /** Places the visitor pinned to the first screen, in pin order. At most PIN_LIMIT. */
  pinnedPlaces: SavedLocation[];
};

export type LoadNotice = 'reset_corrupt' | 'reset_version' | null;

export function defaultSettings(): Settings {
  return {
    version: 1,
    activity: 'outdoors',
    units: null,
    durationMinutes: DEFAULT_DURATION,
    activities: Object.fromEntries(ACTIVITY_IDS.map((id) => [id, { ...ACTIVITY_PRESETS[id].defaults }])) as Record<
      ActivityId,
      ActivityPreferences
    >,
    rememberLocation: false,
    savedLocation: null,
    pinnedPlaces: [],
  };
}

const activitySchema = z.enum(['outdoors', 'walk', 'run', 'bike', 'hangout']);
const prefsSchema = z.object({
  comfortLowC: z.number(),
  comfortHighC: z.number(),
  rain: z.enum(['avoid', 'light', 'okay']),
  wind: z.enum(['low', 'medium', 'high']),
  daylightOnly: z.boolean(),
});
const savedLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  label: z.string().check(z.minLength(1), z.maxLength(200)),
  source: z.enum(['search', 'device']),
  countryCode: z.optional(z.string().check(z.maxLength(3))),
  timezone: z.optional(z.string().check(z.maxLength(64))),
});
const settingsSchema = z.object({
  version: z.number(),
  activity: z.optional(activitySchema),
  units: z.optional(z.nullable(z.enum(['metric', 'us']))),
  durationMinutes: z.optional(z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)])),
  activities: z.optional(z.record(z.string(), z.unknown())),
  rememberLocation: z.optional(z.boolean()),
  savedLocation: z.optional(z.nullable(z.unknown())),
  // Added after version 1 shipped: absent in older data, which then simply has no pins.
  pinnedPlaces: z.optional(z.array(z.unknown())),
});

function sanitizeSavedLocation(raw: unknown): SavedLocation | null {
  const parsed = savedLocationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const coords = roundCoordinates(parsed.data.latitude, parsed.data.longitude);
  if (coords === null) return null;
  return {
    key: locationKey(coords),
    ...coords,
    label: parsed.data.label,
    source: parsed.data.source,
    ...(parsed.data.countryCode !== undefined && { countryCode: parsed.data.countryCode }),
    ...(parsed.data.timezone !== undefined && { timezone: parsed.data.timezone }),
  };
}

/** Valid pins only, re-rounded, without duplicates, capped at PIN_LIMIT. */
function sanitizePins(raw: readonly unknown[] | undefined): SavedLocation[] {
  const pins: SavedLocation[] = [];
  for (const item of raw ?? []) {
    const pin = sanitizeSavedLocation(item);
    if (pin !== null && pins.length < PIN_LIMIT && !pins.some((p) => p.key === pin.key)) pins.push(pin);
  }
  return pins;
}

/** Parses stored JSON. Invalid parts fall back to defaults individually; unknown versions reset. */
export function parseSettings(raw: string | null): { settings: Settings; notice: LoadNotice } {
  const defaults = defaultSettings();
  if (raw === null) return { settings: defaults, notice: null };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { settings: defaults, notice: 'reset_corrupt' };
  }
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) return { settings: defaults, notice: 'reset_corrupt' };
  if (parsed.data.version !== SETTINGS_VERSION) return { settings: defaults, notice: 'reset_version' };
  const d = parsed.data;

  const activities = { ...defaults.activities };
  for (const id of ACTIVITY_IDS) {
    const p = prefsSchema.safeParse(d.activities?.[id]);
    if (p.success && validateComfortBand(p.data.comfortLowC, p.data.comfortHighC) === null) activities[id] = p.data;
  }
  const rememberLocation = d.rememberLocation ?? false;
  return {
    settings: {
      version: 1,
      activity: d.activity ?? defaults.activity,
      units: d.units ?? null,
      durationMinutes: d.durationMinutes ?? defaults.durationMinutes,
      activities,
      rememberLocation,
      savedLocation: rememberLocation ? sanitizeSavedLocation(d.savedLocation) : null,
      pinnedPlaces: sanitizePins(d.pinnedPlaces),
    },
    notice: null,
  };
}

export type SettingsStore = {
  load(): { settings: Settings; notice: LoadNotice };
  save(settings: Settings): void;
  readonly persistent: boolean;
};

export function createSettingsStore(store: KeyValueStore): SettingsStore {
  return {
    load() {
      return parseSettings(store.get(SETTINGS_STORAGE_KEY));
    },
    save(settings) {
      // Never persist the current location without the opt-in. Pins are their own explicit opt-in.
      const safe: Settings = settings.rememberLocation ? settings : { ...settings, savedLocation: null };
      store.set(SETTINGS_STORAGE_KEY, JSON.stringify(safe));
    },
    get persistent() {
      return store.persistent;
    },
  };
}

/* Pure settings transitions used by the controller. */

export function withRemember(settings: Settings, remember: boolean, current: SavedLocation | null): Settings {
  return { ...settings, rememberLocation: remember, savedLocation: remember ? current : null };
}

export function withSavedLocation(settings: Settings, location: SavedLocation | null): Settings {
  return settings.rememberLocation ? { ...settings, savedLocation: location } : { ...settings, savedLocation: null };
}

export function forgetLocation(settings: Settings): Settings {
  return { ...settings, savedLocation: null };
}

export function resetPreferences(settings: Settings): Settings {
  const d = defaultSettings();
  return { ...d, rememberLocation: settings.rememberLocation, savedLocation: settings.savedLocation, pinnedPlaces: settings.pinnedPlaces };
}

export function isPinned(settings: Settings, key: string): boolean {
  return settings.pinnedPlaces.some((p) => p.key === key);
}

/** Unpins a pinned place; pins an unpinned one if there is room. A full list is left unchanged. */
export function togglePin(settings: Settings, location: SavedLocation): Settings {
  if (isPinned(settings, location.key)) return { ...settings, pinnedPlaces: settings.pinnedPlaces.filter((p) => p.key !== location.key) };
  if (settings.pinnedPlaces.length >= PIN_LIMIT) return settings;
  return { ...settings, pinnedPlaces: [...settings.pinnedPlaces, location] };
}

export function resetActivity(settings: Settings, id: ActivityId): Settings {
  return { ...settings, activities: { ...settings.activities, [id]: { ...ACTIVITY_PRESETS[id].defaults } } };
}
