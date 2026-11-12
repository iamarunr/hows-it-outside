import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { explain } from '../../../domain/explanations';
import { hourSky } from '../../../domain/hourSky';
import type { IntervalAssessment } from '../../../domain/score';
import { conditionText } from '../../../domain/weatherCodes';
import { assessWindow } from '../../../domain/windows';
import { hourLabels } from '../../../lib/time';
import { formatPercent, formatPrecipitation, formatTemperature, formatWind, type UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { formatRange, MATCH_TEXT } from './copy';
import { MatchIcon } from './MatchIcon';
import { FlagNotices } from './Summary';

const NA = 'Unavailable';

type Props = {
  results: Results;
  units: UnitSystem;
  timezone: string;
  now: number;
  /** Used only to draw each hour's sky (day, dusk, night) from the sun's position. */
  coords: { latitude: number; longitude: number };
  announce: (text: string) => void;
};

/** Vertical position (0 top – 100 bottom) of a temperature inside the plot; warmer is higher. */
function plotY(value: number, min: number, max: number): number {
  return max === min ? 50 : 86 - ((value - min) / (max - min)) * 72;
}

/**
 * Next 24 hours as a single-select group with one Tab stop (ADR-021):
 * arrows move between hours, Home/End jump to the ends. Every value is
 * visible text; nothing is hover-only.
 */
export function HourlyTimeline({ results, units, timezone, now, coords, announce }: Props) {
  const items = results.timeline;
  // The line shows the same feels-like temperature each tile prints.
  const temps = items.map((a) => a.interval.feelsLikeC);
  const known = temps.filter((t): t is number => t !== null);
  const [min, max] = [Math.min(...known), Math.max(...known)];
  const yAt = (i: number): number | null => {
    const t = temps[i];
    return t === null || t === undefined ? null : plotY(t, min, max);
  };
  const labels = hourLabels(
    items.map((a) => a.interval.start),
    timezone,
  );
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const refs = useRef(new Map<number, HTMLButtonElement>());
  const announcedFallback = useRef<number | null>(null);

  const selectedIndex = Math.max(
    0,
    items.findIndex((a) => a.interval.start === selectedStart),
  );
  const selected = items[selectedIndex];

  // If the chosen hour has passed, the nearest available hour is used; announce that once.
  useEffect(() => {
    if (selectedStart === null || items.some((a) => a.interval.start === selectedStart)) return;
    if (announcedFallback.current === selectedStart) return;
    announcedFallback.current = selectedStart;
    announce('The selected hour has passed. Showing the next available hour.');
  }, [announce, items, selectedStart]);

  function select(index: number, focus: boolean): void {
    const item = items[index];
    if (item === undefined) return;
    setSelectedStart(item.interval.start);
    if (focus) {
      const el = refs.current.get(item.interval.start);
      el?.focus();
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    const keys: Record<string, number> = {
      ArrowRight: selectedIndex + 1,
      ArrowDown: selectedIndex + 1,
      ArrowLeft: selectedIndex - 1,
      ArrowUp: selectedIndex - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(Math.min(items.length - 1, Math.max(0, target)), true);
  }

  if (items.length === 0) return <p className="hint">Hourly forecast is unavailable.</p>;

  return (
    <>
      <div className="timeline-scroll">
        <div role="radiogroup" aria-label="Hourly forecast" className="timeline">
          {items.map((a, i) => {
            const l = labels[i];
            const m = MATCH_TEXT[a.label];
            const isSelected = i === selectedIndex;
            const y = yAt(i);
            const rain = a.interval.precipProbabilityPct;
            return (
              <button
                key={a.interval.start}
                ref={(el) => {
                  if (el === null) refs.current.delete(a.interval.start);
                  else refs.current.set(a.interval.start, el);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`sky hour hour-${a.label}`}
                data-sky={hourSky(a.interval, coords.latitude, coords.longitude).sky}
                onClick={() => select(i, false)}
                onKeyDown={onKeyDown}
              >
                <span className="hour-time">
                  {l?.date !== null && l?.date !== undefined && <span className="hour-date">{l.date} </span>}
                  {l?.time}
                  {l?.zone !== null && l?.zone !== undefined && ` ${l.zone}`}
                </span>
                {/* Decorative: this hour's stretch of the temperature line, over its chance of precipitation. */}
                <svg className="hour-plot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  {rain !== null && rain > 0 && (
                    <rect className="hour-plot-rain" x="0" y={100 - rain * 0.6} width="100" height={rain * 0.6} />
                  )}
                  {y !== null && (
                    <>
                      <polyline points={`0,${(y + (yAt(i - 1) ?? y)) / 2} 50,${y} 100,${(y + (yAt(i + 1) ?? y)) / 2}`} />
                      <line className="hour-plot-dot" x1="50" y1={y} x2="50" y2={y} />
                    </>
                  )}
                </svg>
                <span className="hour-temp">
                  {formatTemperature(a.interval.feelsLikeC, units) ?? NA}
                  <span className="hour-temp-label"> feels like</span>
                </span>
                <span className="hour-match">
                  <MatchIcon label={a.label} />
                  {m.text}
                </span>
                <span>{formatPercent(a.interval.precipProbabilityPct) ?? NA} precip.</span>
                <span>{formatWind(a.interval.windKmh, units) ?? NA} wind</span>
              </button>
            );
          })}
        </div>
      </div>
      {selected !== undefined && <HourDetails assessment={selected} results={results} units={units} timezone={timezone} now={now} />}
    </>
  );
}

function HourDetails({
  assessment,
  results,
  units,
  timezone,
  now,
}: {
  assessment: IntervalAssessment;
  results: Results;
  units: UnitSystem;
  timezone: string;
  now: number;
}) {
  const i = assessment.interval;
  const ctx = { prefs: results.prefs, weights: results.activity.weights };
  const reasons = explain(assessWindow([i], i.start, i.end - i.start, ctx), units);
  const m = MATCH_TEXT[assessment.label];
  const conditions = i.weatherCodes.length === 0 ? [conditionText(null)] : i.weatherCodes.map(conditionText);
  return (
    <section className="hour-details" aria-labelledby="hour-details-heading" aria-live="off">
      <h4 id="hour-details-heading">{formatRange(i.start, i.end, timezone, now)}</h4>
      <p className={`match-label match-${assessment.label}`}>
        <MatchIcon label={assessment.label} />
        {m.text}
      </p>
      <FlagNotices flags={assessment.flags} notes={assessment.notes} />
      <dl className="metrics">
        <div>
          <dt>Conditions</dt>
          <dd>{[...new Set(conditions)].map((t, n) => (n === 0 ? t : t.toLowerCase())).join(', then ')}</dd>
        </div>
        <div>
          <dt>Temperature</dt>
          <dd>{formatTemperature(i.temperatureC, units) ?? NA}</dd>
        </div>
        <div>
          <dt>Feels like</dt>
          <dd>{formatTemperature(i.feelsLikeC, units) ?? NA}</dd>
        </div>
        <div>
          <dt>Chance of precipitation</dt>
          <dd>{formatPercent(i.precipProbabilityPct) ?? NA}</dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>{formatPrecipitation(i.precipMm, units) ?? NA}</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{formatWind(i.windKmh, units) ?? NA}</dd>
        </div>
        <div>
          <dt>Gusts</dt>
          <dd>{formatWind(i.gustKmh, units) ?? NA}</dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{formatPercent(i.humidityPct) ?? NA}</dd>
        </div>
        <div>
          <dt>Daylight</dt>
          <dd>{i.daylight === null ? NA : i.daylight ? 'Yes' : 'No, or only part of the hour'}</dd>
        </div>
      </dl>
      {reasons.length > 0 && (
        <ul className="reasons">
          {reasons.map((r) => (
            <li key={r.id}>{r.text}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
