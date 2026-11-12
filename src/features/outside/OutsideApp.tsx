import { useCallback, useEffect, useRef } from 'react';
import { defaultUnitSystem } from '../../lib/units';
import { ConditionsSummary } from './components/ConditionsSummary';
import { DataStatus } from './components/DataStatus';
import { LocationPicker } from './components/LocationPicker';
import { browserDeps, useWeatherController, type ControllerDeps } from './controller/useWeatherController';

export type OutsideAppProps = { depsFactory?: () => ControllerDeps };

/**
 * The single interactive island. M2: location selection and basic loaded weather.
 * Activities, preferences, windows and the timeline arrive in M3.
 */
export default function OutsideApp({ depsFactory = browserDeps }: OutsideAppProps) {
  const c = useWeatherController(depsFactory);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const lastAnnounced = useRef<string | null>(null);

  // The live region is written directly so announcements never cause extra renders.
  const announce = useCallback((text: string) => {
    if (liveRef.current !== null) liveRef.current.textContent = text;
  }, []);

  const units = c.settings.units ?? (c.hydrated ? defaultUnitSystem(navigator.language) : 'metric');
  const location = c.location;
  const view = c.view;

  // One polite status message per state change; never one per hourly tile.
  useEffect(() => {
    if (location === null) return;
    const key = `${location.key}:${view.kind}`;
    if (lastAnnounced.current === key) return;
    lastAnnounced.current = key;
    if (view.kind === 'loading') announce(`Loading weather for ${location.label}…`);
    else if (view.kind === 'data') announce(`Weather loaded for ${location.label}.`);
  }, [announce, location, view.kind]);

  // After the visitor chooses a place, move focus to the results heading, never to the body.
  // A restored saved location does not move focus on page load.
  const focusedFor = useRef<string | null>(null);
  const saved = c.locationSaved;
  useEffect(() => {
    if (location === null || saved || view.kind !== 'data' || focusedFor.current === location.key) return;
    focusedFor.current = location.key;
    headingRef.current?.focus();
  }, [location, saved, view.kind]);

  return (
    <div className="outside-app">
      <p ref={liveRef} role="status" aria-live="polite" className="visually-hidden" />

      <LocationPicker
        location={location}
        saved={c.locationSaved}
        locating={c.locating}
        geoNotice={c.geoNotice}
        geocodingCache={c.geocodingCache}
        onSelectPlace={c.selectPlace}
        onLocateMe={c.locateMe}
        announce={announce}
      />

      {location !== null && (
        <section className="weather" aria-labelledby="weather-heading">
          <h2 id="weather-heading" ref={headingRef} tabIndex={-1} className="weather-heading">
            Weather for {location.label}
          </h2>
          <DataStatus view={view} now={c.now} cooldownUntil={c.cooldownUntil} onRetry={c.retry} />
          {view.kind === 'data' && (
            <>
              <p className="hint">
                Times shown for {view.forecast.timezone}
                {location.source === 'device' && ' · Based on your approximate location'}
              </p>
              <ConditionsSummary current={view.forecast.current} timezone={view.forecast.timezone} units={units} now={c.now} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
