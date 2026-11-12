import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_PRESETS } from '../../domain/activities';
import { summaryHeadline } from '../../domain/explanations';
import { defaultUnitSystem } from '../../lib/units';
import { resetActivity } from '../../services/settings';
import { skyFor } from '../../domain/sky';
import { clockSunState, reconcileSun, sunState, type SunState } from '../../domain/sun';
import { ConditionsSummary } from './components/ConditionsSummary';
import { SkyReadout } from './components/SkyReadout';
import { ActivityPicker, UnitsPicker, WindowControls } from './components/Controls';
import { DataStatus } from './components/DataStatus';
import { HourlyTimeline } from './components/HourlyTimeline';
import { LocationPicker } from './components/LocationPicker';
import { PreferencesPanel, StorageControls } from './components/PreferencesPanel';
import { PlaceCards } from './components/PlaceCards';
import { SkyScene } from './components/SkyScene';
import { NextHourSummary } from './components/Summary';
import { WindowSuggestions } from './components/WindowSuggestions';
import { computeResults } from './controller/results';
import { browserDeps, useWeatherController, type ControllerDeps } from './controller/useWeatherController';

/** Shown until the island hydrates, so server and client markup agree. */
const NOON: SunState = { body: 'sun', arc: 0.5, low: null };

export type OutsideAppProps = { depsFactory?: () => ControllerDeps };

/** The single interactive island (ADR-002). Page order follows DESIGN.md. */
export default function OutsideApp({ depsFactory = browserDeps }: OutsideAppProps) {
  const c = useWeatherController(depsFactory);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const lastAnnounced = useRef<string | null>(null);
  const [resetToken, setResetToken] = useState(0);

  // The live region is written directly so announcements never cause extra renders.
  const announce = useCallback((text: string) => {
    if (liveRef.current !== null) liveRef.current.textContent = text;
  }, []);

  const { settings, updateSettings, view, location } = c;
  const units = settings.units ?? (c.hydrated ? defaultUnitSystem(navigator.language) : 'metric');
  const activity = ACTIVITY_PRESETS[settings.activity];

  const results = useMemo(
    () => (view.kind === 'data' ? computeResults(view.forecast, c.now, settings, view.recommendationsAllowed) : null),
    [view, c.now, settings],
  );

  // One polite status message per state change; never one per hourly tile.
  useEffect(() => {
    if (location === null) return;
    const key = `${location.key}:${view.kind}`;
    if (lastAnnounced.current === key) return;
    lastAnnounced.current = key;
    if (view.kind === 'loading') announce(`Loading weather for ${location.label}…`);
    else if (view.kind === 'data') announce(`Weather loaded for ${location.label}.`);
  }, [announce, location, view.kind]);

  // Switching activity keeps focus where it is and briefly announces the new summary.
  const lastActivity = useRef(settings.activity);
  useEffect(() => {
    if (results === null || lastActivity.current === settings.activity) return;
    lastActivity.current = settings.activity;
    if (results.recommendationsAllowed) announce(`${results.activity.label}: ${summaryHeadline(results.next, results.activity)}.`);
  }, [announce, results, settings.activity]);

  // After the visitor chooses a place, move focus to the results heading, never to the body.
  // A restored saved location does not move focus on page load.
  const focusedFor = useRef<string | null>(null);
  const saved = c.locationSaved;
  useEffect(() => {
    if (location === null || saved || view.kind !== 'data' || focusedFor.current === location.key) return;
    focusedFor.current = location.key;
    // Show the new place's sky from the top (choosing a low search result may have scrolled the page),
    // then move focus to its heading without scrolling again.
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [location, saved, view.kind]);

  const timezone = view.kind === 'data' ? view.forecast.timezone : 'UTC';
  const firstHour = results?.timeline[0]?.interval;
  const idle = location === null;
  // The disc follows the real sun for a chosen place, and the visitor's own clock before one is chosen.
  const localDate = new Date(c.now * 1000);
  const sun: SunState = !c.hydrated
    ? NOON
    : location === null
      ? clockSunState(localDate.getHours() + localDate.getMinutes() / 60)
      : reconcileSun(sunState(location.latitude, location.longitude, c.now), firstHour?.daylight ?? null);
  const sky =
    location === null
      ? skyFor(0, sun.body === 'sun', sun.low)
      : view.kind === 'data'
        ? skyFor(view.forecast.current?.weatherCode ?? firstHour?.weatherCodes[0] ?? null, sun.body === 'sun', sun.low)
        : 'unknown';

  const toolbar = (
    <div className="hero-toolbar">
      <LocationPicker
        location={location}
        saved={c.locationSaved}
        locating={c.locating}
        geoNotice={c.geoNotice}
        geocodingCache={c.geocodingCache}
        onSelectPlace={c.selectPlace}
        onLocateMe={c.locateMe}
        announce={announce}
        ready={c.hydrated}
      />
      <UnitsPicker value={units} onChange={(u) => updateSettings((s) => ({ ...s, units: u }))} />
    </div>
  );

  return (
    <div className="outside-app">
      <p ref={liveRef} role="status" aria-live="polite" className="visually-hidden" />

      {!c.online && <p className="notice notice-mixed">You&apos;re offline. Previously loaded weather may be out of date.</p>}
      {c.settingsNotice !== null && (
        <p className="notice notice-mixed">Your saved settings couldn&apos;t be read, so the default settings are in use.</p>
      )}

      <section className="weather" aria-labelledby={idle ? 'page-title' : 'weather-heading'}>
        {!idle && <h1 className="visually-hidden">How&apos;s it outside?</h1>}
        {/* One sky element for both states, so choosing a place melts one sky into the next. */}
        <div className={`sky sky-hero${idle ? ' sky-hero-idle' : ''}`} data-sky={sky} data-body={sun.body}>
          {location === null ? (
            <div className="hero-inner">
              <div className="hero-copy">
                <h1 id="page-title" className="hero-title">
                  <span>How&apos;s it</span> <span>outside?</span>
                </h1>
                <p className="hero-lede">
                  Pick a place. See whether now is good for a walk, a run, a ride or just being outside, and when it
                  gets better.
                </p>
                {toolbar}
              </div>
              <div className="hero-cards">{c.hydrated && <PlaceCards now={c.now} onSelect={c.selectPlace} />}</div>
            </div>
          ) : (
            <div className="hero-inner hero-results">
              {toolbar}
              <SkyReadout
                label={location.label}
                current={view.kind === 'data' ? view.forecast.current : null}
                units={units}
                now={c.now}
                headingRef={headingRef}
              />
              <DataStatus view={view} now={c.now} cooldownUntil={c.cooldownUntil} onRetry={c.retry} />
              {view.kind === 'data' && results !== null && (
                <div className="hero-verdict">
                  <NextHourSummary results={results} units={units} timezone={timezone} />
                  <ActivityPicker value={settings.activity} onChange={(id) => updateSettings((s) => ({ ...s, activity: id }))} />
                </div>
              )}
            </div>
          )}
          <SkyScene sun={sun} />
        </div>

        {location !== null && view.kind === 'data' && results !== null && (
          <>
            <ConditionsSummary current={view.forecast.current} sunEvents={view.forecast.sunEvents} timezone={timezone} units={units} now={c.now} />

            <section className="best-windows" aria-labelledby="windows-heading">
              <h3 id="windows-heading">Best times in the next 24 hours</h3>
              <WindowControls
                duration={settings.durationMinutes}
                daylightOnly={results.prefs.daylightOnly}
                onDuration={(durationMinutes) => updateSettings((s) => ({ ...s, durationMinutes }))}
                onDaylightOnly={(daylightOnly) =>
                  updateSettings((s) => ({
                    ...s,
                    activities: { ...s.activities, [s.activity]: { ...s.activities[s.activity], daylightOnly } },
                  }))
                }
              />
              <WindowSuggestions results={results} units={units} timezone={timezone} now={c.now} coords={location} />
            </section>

            <section className="next-24" aria-labelledby="timeline-heading">
              <h3 id="timeline-heading">Next 24 hours</h3>
              <p className="hint">
                Times shown for {timezone}
                {location.source === 'device' && ' · Based on your approximate location'}
              </p>
              <HourlyTimeline results={results} units={units} timezone={timezone} now={c.now} coords={location} announce={announce} />
            </section>
          </>
        )}
      </section>

      {c.hydrated && (
        <details className="settings">
          <summary>Preferences and saved data</summary>
          <PreferencesPanel
            activity={activity}
            resetToken={resetToken}
            prefs={settings.activities[settings.activity]}
            units={units}
            onChange={(prefs) => updateSettings((s) => ({ ...s, activities: { ...s.activities, [s.activity]: prefs } }))}
            onResetActivity={() => updateSettings((s) => resetActivity(s, s.activity))}
          />
          <StorageControls
            persistent={c.storagePersistent}
            remember={settings.rememberLocation}
            hasLocation={location !== null}
            onRemember={c.setRemember}
            onForget={c.forgetLocation}
            onResetAll={() => {
              c.resetAllPreferences();
              setResetToken((n) => n + 1);
            }}
            onClearAll={() => {
              c.clearAllData();
              setResetToken((n) => n + 1);
            }}
          />
        </details>
      )}
    </div>
  );
}
