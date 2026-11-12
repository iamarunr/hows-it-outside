import { hourSky } from '../../../domain/hourSky';
import { hourLabels } from '../../../lib/time';
import { bestWindowTitle, emptyReasonText, explain, HOURLY_APPROXIMATION_NOTE } from '../../../domain/explanations';
import type { UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { formatRange, MATCH_TEXT } from './copy';
import { FlagNotices } from './Summary';
import { MatchIcon } from './MatchIcon';

type Props = {
  results: Results;
  units: UnitSystem;
  timezone: string;
  now: number;
  /** Used only to draw the best window's sky from the sun's position. */
  coords: { latitude: number; longitude: number };
};

/**
 * The next 24 hours at a glance: one bar per hour, taller for a better match,
 * with the best window bracketed. Decorative: the same facts are in the list
 * below and in the hourly forecast, so it is hidden from assistive technology.
 */
function DayStrip({ results, timezone }: { results: Results; timezone: string }) {
  const best = results.search.windows[0];
  const labels = hourLabels(
    results.timeline.map((a) => a.interval.start),
    timezone,
  );
  return (
    <div className="daystrip-wrap" aria-hidden="true">
      <div className="daystrip">
        {results.timeline.map((a, i) => {
          const inBest = best !== undefined && a.interval.start < best.end && a.interval.end > best.start;
          return (
            <span key={a.interval.start} className={`daystrip-hour daystrip-${a.label}${inBest ? ' daystrip-best' : ''}`}>
              <span className="daystrip-bar" />
              {i % 6 === 0 && <span className="daystrip-label">{labels[i]?.time}</span>}
            </span>
          );
        })}
      </div>
      <p className="daystrip-key">Each bar is one hour. Taller is a better match; the line marks the best window.</p>
    </div>
  );
}

export function WindowSuggestions({ results, units, timezone, now, coords }: Props) {
  const { windows, emptyReason, horizonFlags } = results.search;

  if (windows.length === 0) {
    return (
      <div className="windows-empty">
        {emptyReason !== null && emptyReason !== 'stale' && <p>{emptyReasonText(emptyReason)}</p>}
        {emptyReason === 'stale' && <p>Suggestions are paused until the forecast refreshes.</p>}
        <FlagNotices flags={horizonFlags} />
      </div>
    );
  }

  return (
    <>
      <DayStrip results={results} timezone={timezone} />
      <ol className="windows">
        {windows.map((w, i) => {
          const label = MATCH_TEXT[w.label];
          // The best window is a card under the sky expected at that time.
          const first = i === 0 ? results.timeline.find((a) => a.interval.end > w.start) : undefined;
          const sky = first === undefined ? null : hourSky(first.interval, coords.latitude, coords.longitude);
          return (
            <li
              key={w.start}
              className={`window window-${w.label}${i === 0 ? ' window-best' : ''}${sky === null ? '' : ' sky'}`}
              data-sky={sky?.sky}
              data-body={sky?.body}
            >
              {sky !== null && <span className="postcard-disc" aria-hidden="true" />}
              <div className="window-head">
                <h4 className="window-time">{formatRange(w.start, w.end, timezone, now)}</h4>
                <p className="window-rank">{i === 0 ? bestWindowTitle(w) : 'Another option'}</p>
                <p className={`match-label match-${w.label}`}>
                  <MatchIcon label={w.label} />
                  {label.text}
                </p>
              </div>
              <ul className="reasons">
                {explain(w, units).map((r) => (
                  <li key={r.id}>{r.text}</li>
                ))}
              </ul>
              {w.hourlyApproximation && <p className="hint">{HOURLY_APPROXIMATION_NOTE}</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
