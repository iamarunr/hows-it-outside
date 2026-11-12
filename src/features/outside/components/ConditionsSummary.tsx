import { countdownText, upcomingSunEvents } from '../../../domain/daylight';
import { currentIsUsable } from '../../../domain/freshness';
import type { CurrentConditions, SunEvent } from '../../../domain/types';
import { formatTime, zoneName } from '../../../lib/time';
import { formatPercent, formatWind, type UnitSystem } from '../../../lib/units';

const UNAVAILABLE = 'Unavailable';

/** HEURISTIC display scales: the arc is full at a strong breeze (wind) and at gale-force gusts. Not used for scoring. */
const WIND_SCALE_KMH = 50;
const GUST_SCALE_KMH = 75;
const ARC = 'M12 66A48 48 0 0 1 108 66';

/** A missing value has no arc at all (never drawn as zero). */
function fraction(value: number | null, scale: number): number | null {
  return value === null ? null : Math.min(1, Math.max(0, value / scale));
}

/** A value with a decorative half-dial behind it. The number is the fact; the arc only gives it a sense of scale. */
function Gauge({ label, value, fraction: f }: { label: string; value: string | null; fraction: number | null }) {
  return (
    <div className="gauge">
      <dt>{label}</dt>
      <dd>
        <svg viewBox="0 0 120 72" aria-hidden="true" focusable="false">
          <path className="gauge-track" d={ARC} pathLength="100" />
          {f !== null && f > 0 && <path className="gauge-fill" d={ARC} pathLength="100" strokeDasharray={`${f * 100} 100`} />}
        </svg>
        <span className={value === null ? 'gauge-na' : undefined}>{value ?? UNAVAILABLE}</span>
      </dd>
    </div>
  );
}

export type ConditionsSummaryProps = {
  current: CurrentConditions | null;
  sunEvents: readonly SunEvent[];
  timezone: string;
  units: UnitSystem;
  now: number;
};

/**
 * "Now" details from the provider's current block, kept separate from the next-hour match.
 * Temperature, feels-like and condition are shown once, in the sky readout above.
 */
export function ConditionsSummary({ current, sunEvents, timezone, units, now }: ConditionsSummaryProps) {
  const usable = current === null ? null : currentIsUsable(current.time, now);
  const sun = upcomingSunEvents(sunEvents, now);

  return (
    <section className="now" aria-labelledby="now-heading">
      <h3 id="now-heading">Now</h3>
      {current === null && <p className="hint">Current conditions are unavailable. The hourly forecast may still be available.</p>}
      {usable === 'too_old' && <p className="hint">Current conditions are out of date and are hidden.</p>}
      {usable === 'in_future' && (
        <p className="hint">Current conditions are hidden because the data time and this device&apos;s clock disagree.</p>
      )}
      {current !== null && usable === 'ok' && (
        <>
          <dl className="metrics gauges">
            <Gauge label="Wind" value={formatWind(current.windKmh, units)} fraction={fraction(current.windKmh, WIND_SCALE_KMH)} />
            <Gauge label="Gusts" value={formatWind(current.gustKmh, units)} fraction={fraction(current.gustKmh, GUST_SCALE_KMH)} />
            <Gauge label="Humidity" value={formatPercent(current.humidityPct)} fraction={fraction(current.humidityPct, 100)} />
          </dl>
          <p className="hint">
            Conditions as of {formatTime(current.time, timezone)} {zoneName(current.time, timezone)}
          </p>
        </>
      )}
      {sun.length > 0 && (
        <dl className="sun-times">
          {sun.map((e) => (
            <div key={e.kind} className={`sun-time sun-time-${e.kind}`}>
              <dt>{e.kind === 'sunrise' ? 'Sunrise' : 'Sunset'}</dt>
              <dd>
                {formatTime(e.time, timezone)} <span>{countdownText(e.time - now)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
