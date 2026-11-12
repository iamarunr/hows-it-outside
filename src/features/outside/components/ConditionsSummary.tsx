import { currentIsUsable } from '../../../domain/freshness';
import type { CurrentConditions } from '../../../domain/types';
import { conditionText } from '../../../domain/weatherCodes';
import { formatTime, zoneName } from '../../../lib/time';
import { formatPercent, formatTemperature, formatWind, type UnitSystem } from '../../../lib/units';

const UNAVAILABLE = 'Unavailable';

export type ConditionsSummaryProps = {
  current: CurrentConditions | null;
  timezone: string;
  units: UnitSystem;
  now: number;
};

/** "Now" measurements from the provider's current block, kept separate from the next-hour match. */
export function ConditionsSummary({ current, timezone, units, now }: ConditionsSummaryProps) {
  const usable = current === null ? null : currentIsUsable(current.time, now);

  return (
    <section className="now" aria-labelledby="now-heading">
      <h2 id="now-heading">Now</h2>
      {current === null && <p className="hint">Current conditions are unavailable. The hourly forecast may still be available.</p>}
      {usable === 'too_old' && <p className="hint">Current conditions are out of date and are hidden.</p>}
      {usable === 'in_future' && (
        <p className="hint">Current conditions are hidden because the data time and this device&apos;s clock disagree.</p>
      )}
      {current !== null && usable === 'ok' && (
        <>
          <p className="now-condition">{conditionText(current.weatherCode)}</p>
          <dl className="metrics">
            <div>
              <dt>Temperature</dt>
              <dd>{formatTemperature(current.temperatureC, units) ?? UNAVAILABLE}</dd>
            </div>
            <div>
              <dt>Feels like</dt>
              <dd>{formatTemperature(current.feelsLikeC, units) ?? UNAVAILABLE}</dd>
            </div>
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
