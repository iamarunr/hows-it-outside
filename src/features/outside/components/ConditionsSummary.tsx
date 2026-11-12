import { currentIsUsable } from '../../../domain/freshness';
import type { CurrentConditions } from '../../../domain/types';
import { formatTime, zoneName } from '../../../lib/time';
import { formatPercent, formatWind, type UnitSystem } from '../../../lib/units';

const UNAVAILABLE = 'Unavailable';

export type ConditionsSummaryProps = {
  current: CurrentConditions | null;
  timezone: string;
  units: UnitSystem;
  now: number;
};

/**
 * "Now" details from the provider's current block, kept separate from the next-hour match.
 * Temperature, feels-like and condition are shown once, in the sky readout above.
 */
export function ConditionsSummary({ current, timezone, units, now }: ConditionsSummaryProps) {
  const usable = current === null ? null : currentIsUsable(current.time, now);

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
          <dl className="metrics">
            <div>
              <dt>Wind</dt>
              <dd>{formatWind(current.windKmh, units) ?? UNAVAILABLE}</dd>
            </div>
            <div>
              <dt>Gusts</dt>
              <dd>{formatWind(current.gustKmh, units) ?? UNAVAILABLE}</dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>{formatPercent(current.humidityPct) ?? UNAVAILABLE}</dd>
            </div>
          </dl>
          <p className="hint">
            Conditions as of {formatTime(current.time, timezone)} {zoneName(current.time, timezone)}
          </p>
        </>
      )}
    </section>
  );
}
