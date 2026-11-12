import type { Ref } from 'react';
import { currentIsUsable } from '../../../domain/freshness';
import type { CurrentConditions } from '../../../domain/types';
import { conditionText } from '../../../domain/weatherCodes';
import { formatTemperature, type UnitSystem } from '../../../lib/units';

type Props = {
  label: string;
  current: CurrentConditions | null;
  units: UnitSystem;
  now: number;
  headingRef: Ref<HTMLHeadingElement>;
};

/**
 * The scoreboard: place and temperature in display capitals, set into the
 * sky hero. The sky is decorative; every fact is text.
 */
export function SkyReadout({ label, current, units, now, headingRef }: Props) {
  const [city, ...rest] = label.split(',').map((s) => s.trim());
  const region = rest.join(', ');
  const usable = current !== null && currentIsUsable(current.time, now) === 'ok';
  const temp = usable ? formatTemperature(current.temperatureC, units) : null;
  const feels = usable ? formatTemperature(current.feelsLikeC, units) : null;

  return (
    <div className="readout">
        <h2
          id="weather-heading"
          ref={headingRef}
          tabIndex={-1}
          className="readout-place"
          aria-label={`Weather for ${label}`}
        >
          <span className="readout-city">{city}</span>
          {region !== '' && <span className="readout-region">{region}</span>}
        </h2>
        <div className="readout-now">
          <p className="readout-temp">
            {temp ?? (
              <>
                <span aria-hidden="true">—</span>
                <span className="visually-hidden">Temperature unavailable</span>
              </>
            )}
          </p>
          <p className="readout-condition">
            {usable ? conditionText(current.weatherCode) : 'Current conditions unavailable'}
            {feels !== null && <span className="readout-feels">Feels like {feels}</span>}
          </p>
      </div>
    </div>
  );
}
