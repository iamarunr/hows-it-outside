import { describe, expect, it } from 'vitest';
import {
  createSettingsStore,
  defaultSettings,
  forgetLocation,
  parseSettings,
  resetActivity,
  resetPreferences,
  SETTINGS_STORAGE_KEY,
  withRemember,
  type SavedLocation,
} from '../../src/services/settings';
import { createStore } from '../../src/services/storageAdapter';
import { fakeStorage } from './helpers';

const place: SavedLocation = {
  key: '38.63,-90.20',
  latitude: 38.63,
  longitude: -90.2,
  label: 'St. Louis, Missouri, United States',
  source: 'search',
  timezone: 'America/Chicago',
};

describe('settings parsing', () => {
  it('returns defaults with no notice when nothing is stored', () => {
    expect(parseSettings(null)).toEqual({ settings: defaultSettings(), notice: null });
    const d = defaultSettings();
    expect(d.activity).toBe('outdoors');
    expect(d.durationMinutes).toBe(60);
    expect(d.rememberLocation).toBe(false);
    expect(d.units).toBeNull();
  });

  it('resets corrupted JSON and unknown versions with a notice', () => {
    expect(parseSettings('{oops').notice).toBe('reset_corrupt');
    expect(parseSettings('[]').notice).toBe('reset_corrupt');
    expect(parseSettings(JSON.stringify({ version: 0 })).notice).toBe('reset_version');
    expect(parseSettings(JSON.stringify({ version: 2 })).settings).toEqual(defaultSettings());
  });

  it('keeps valid parts and replaces only invalid activity preferences', () => {
    const stored = {
      ...defaultSettings(),
      activity: 'bike',
      units: 'us',
      durationMinutes: 90,
      activities: {
        ...defaultSettings().activities,
        walk: { comfortLowC: 30, comfortHighC: 10, rain: 'okay', wind: 'high', daylightOnly: false },
        run: { comfortLowC: 2, comfortHighC: 18, rain: 'okay', wind: 'high', daylightOnly: false },
      },
    };
    const { settings, notice } = parseSettings(JSON.stringify(stored));
    expect(notice).toBeNull();
    expect(settings.activity).toBe('bike');
    expect(settings.units).toBe('us');
    expect(settings.durationMinutes).toBe(90);
    expect(settings.activities.walk).toEqual(defaultSettings().activities.walk);
    expect(settings.activities.run).toEqual({ comfortLowC: 2, comfortHighC: 18, rain: 'okay', wind: 'high', daylightOnly: false });
  });

  it('restores a saved location only with remember on, re-rounded', () => {
    const on = parseSettings(JSON.stringify({ ...defaultSettings(), rememberLocation: true, savedLocation: { ...place, latitude: 38.62727, longitude: -90.19789 } }));
    expect(on.settings.savedLocation).toMatchObject({ latitude: 38.63, longitude: -90.2, key: '38.63,-90.20' });
    const off = parseSettings(JSON.stringify({ ...defaultSettings(), rememberLocation: false, savedLocation: place }));
    expect(off.settings.savedLocation).toBeNull();
  });

  it('drops a saved location with invalid coordinates', () => {
    const bad = parseSettings(JSON.stringify({ ...defaultSettings(), rememberLocation: true, savedLocation: { ...place, latitude: 95 } }));
    expect(bad.settings.savedLocation).toBeNull();
  });
});

describe('settings store', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage();
    const s = createSettingsStore(createStore(() => storage));
    const settings = withRemember({ ...defaultSettings(), activity: 'run' }, true, place);
    s.save(settings);
    expect(s.load().settings).toEqual(settings);
  });

  it('never persists a location without the opt-in', () => {
    const storage = fakeStorage();
    const s = createSettingsStore(createStore(() => storage));
    s.save({ ...defaultSettings(), rememberLocation: false, savedLocation: place });
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).not.toContain('St. Louis');
  });

  it('turning remember off removes a previously saved location', () => {
    const storage = fakeStorage();
    const s = createSettingsStore(createStore(() => storage));
    s.save(withRemember(defaultSettings(), true, place));
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toContain('St. Louis');
    s.save(withRemember(s.load().settings, false, place));
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).not.toContain('St. Louis');
    expect(s.load().settings.savedLocation).toBeNull();
  });

  it('works in memory when storage is disabled or full', () => {
    for (const throwOn of ['all', 'set'] as const) {
      const s = createSettingsStore(createStore(() => fakeStorage({ throwOn })));
      s.save({ ...defaultSettings(), activity: 'walk' });
      expect(s.load().settings.activity).toBe('walk');
      expect(s.persistent).toBe(false);
    }
  });
});

describe('settings transitions', () => {
  it('forget clears the location but keeps preferences', () => {
    const s = withRemember({ ...defaultSettings(), activity: 'bike' }, true, place);
    expect(forgetLocation(s)).toMatchObject({ savedLocation: null, activity: 'bike', rememberLocation: true });
  });

  it('reset preferences restores presets but keeps the location choice', () => {
    const s = withRemember({ ...defaultSettings(), activity: 'bike', durationMinutes: 120 }, true, place);
    const r = resetPreferences(s);
    expect(r.activity).toBe('outdoors');
    expect(r.durationMinutes).toBe(60);
    expect(r.savedLocation).toEqual(place);
  });

  it('reset activity restores only that preset', () => {
    const s = defaultSettings();
    s.activities.walk = { ...s.activities.walk, comfortLowC: 0 };
    s.activities.run = { ...s.activities.run, comfortLowC: 0 };
    const r = resetActivity(s, 'walk');
    expect(r.activities.walk.comfortLowC).toBe(8);
    expect(r.activities.run.comfortLowC).toBe(0);
  });
});
