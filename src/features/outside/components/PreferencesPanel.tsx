import { useId, useState } from 'react';
import { COMFORT_BOUNDS_C, validateComfortBand, type ActivityPreset } from '../../../domain/activities';
import type { ActivityPreferences, RainTolerance, WindTolerance } from '../../../domain/types';
import { temperatureFromDisplay, temperatureUnit, temperatureValue, type UnitSystem } from '../../../lib/units';

const RAIN_OPTIONS: readonly { value: RainTolerance; label: string }[] = [
  { value: 'avoid', label: 'Avoid rain' },
  { value: 'light', label: 'Some rain is fine' },
  { value: 'okay', label: "Rain doesn't bother me" },
];
const WIND_OPTIONS: readonly { value: WindTolerance; label: string }[] = [
  { value: 'low', label: 'Prefer calm' },
  { value: 'medium', label: 'Some wind is fine' },
  { value: 'high', label: "Wind doesn't bother me" },
];

const toDisplay = (c: number, units: UnitSystem): string => String(Math.round(temperatureValue(c, units) * 10) / 10);

type Props = {
  activity: ActivityPreset;
  /** Changes whenever preferences are reset from outside, so fields reload. */
  resetToken: number;
  prefs: ActivityPreferences;
  units: UnitSystem;
  onChange: (prefs: ActivityPreferences) => void;
  onResetActivity: () => void;
};

/**
 * Comfort range editor. Edits apply as soon as they are valid; invalid input
 * keeps the last valid values and shows an inline error. Remounted (by key)
 * when the activity or units change, so fields always reflect stored SI values.
 */
function ComfortRange({ prefs, units, onChange }: { prefs: ActivityPreferences; units: UnitSystem; onChange: (p: ActivityPreferences) => void }) {
  const id = useId();
  const [low, setLow] = useState(toDisplay(prefs.comfortLowC, units));
  const [high, setHigh] = useState(toDisplay(prefs.comfortHighC, units));
  const [error, setError] = useState<string | null>(null);
  const unit = temperatureUnit(units);
  const min = Math.round(temperatureValue(COMFORT_BOUNDS_C.min, units));
  const max = Math.round(temperatureValue(COMFORT_BOUNDS_C.max, units));

  function apply(nextLow: string, nextHigh: string): void {
    const lowN = Number(nextLow);
    const highN = Number(nextHigh);
    if (nextLow.trim() === '' || nextHigh.trim() === '' || !Number.isFinite(lowN) || !Number.isFinite(highN)) {
      setError('Enter a number for both temperatures.');
      return;
    }
    // Convert once from display units; keep SI precision. Compare on rounded °C to avoid float noise at the bounds.
    const lowC = Math.round(temperatureFromDisplay(lowN, units) * 1e6) / 1e6;
    const highC = Math.round(temperatureFromDisplay(highN, units) * 1e6) / 1e6;
    const problem = validateComfortBand(lowC, highC);
    if (problem === 'out_of_bounds') setError(`Use temperatures from ${min}${unit} to ${max}${unit}.`);
    else if (problem === 'low_not_below_high') setError('The lowest temperature must be below the highest.');
    else if (problem !== null) setError('Enter a number for both temperatures.');
    else {
      setError(null);
      onChange({ ...prefs, comfortLowC: lowC, comfortHighC: highC });
    }
  }

  return (
    <fieldset className="comfort">
      <legend>Comfortable feels-like range ({unit})</legend>
      <p className="hint" id={`${id}-help`}>
        Feels-like temperature combines air temperature with wind and humidity. Allowed: {min} to {max}.
      </p>
      <div className="comfort-fields">
        <label>
          Lowest
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={min}
            max={max}
            value={low}
            aria-describedby={`${id}-help${error === null ? '' : ` ${id}-error`}`}
            aria-invalid={error !== null}
            onChange={(e) => {
              setLow(e.target.value);
              apply(e.target.value, high);
            }}
          />
        </label>
        <label>
          Highest
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={min}
            max={max}
            value={high}
            aria-describedby={`${id}-help${error === null ? '' : ` ${id}-error`}`}
            aria-invalid={error !== null}
            onChange={(e) => {
              setHigh(e.target.value);
              apply(low, e.target.value);
            }}
          />
        </label>
      </div>
      {error !== null && (
        <p id={`${id}-error`} className="field-error">
          {error} Your last valid range is still in use.
        </p>
      )}
    </fieldset>
  );
}

function Select<T extends string>(props: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <select
        id={id}
        value={props.value}
        onChange={(e) => {
          const next = props.options.find((o) => o.value === e.target.value);
          if (next !== undefined) props.onChange(next.value);
        }}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PreferencesPanel({ activity, resetToken, prefs, units, onChange, onResetActivity }: Props) {
  const [localResets, setLocalResets] = useState(0);
  return (
    <div className="preferences">
      <h3>Preferences for {activity.label}</h3>
      <ComfortRange key={`${activity.id}-${units}-${resetToken}-${localResets}`} prefs={prefs} units={units} onChange={onChange} />
      <Select label="Rain" value={prefs.rain} options={RAIN_OPTIONS} onChange={(rain) => onChange({ ...prefs, rain })} />
      <Select label="Wind" value={prefs.wind} options={WIND_OPTIONS} onChange={(wind) => onChange({ ...prefs, wind })} />
      <p className="hint">Concerning weather such as thunderstorms or strong gusts is always flagged, whatever you choose.</p>
      <button
        type="button"
        onClick={() => {
          onResetActivity();
          setLocalResets((n) => n + 1);
        }}
      >
        Reset {activity.label} to defaults
      </button>
    </div>
  );
}

export function StorageControls(props: {
  persistent: boolean;
  remember: boolean;
  hasLocation: boolean;
  onRemember: (v: boolean) => void;
  onForget: () => void;
  onResetAll: () => void;
  onClearAll: () => void;
}) {
  const id = useId();
  return (
    <div className="storage">
      <h3>On this device</h3>
      <p className="hint">
        {props.persistent
          ? 'Your settings are saved in this browser. A place is saved only if you pin it or choose to remember it.'
          : "This browser isn't allowing storage, so settings last only until you close the page."}
      </p>
      <div className="checkbox">
        <input id={id} type="checkbox" checked={props.remember} onChange={(e) => props.onRemember(e.target.checked)} />
        <label htmlFor={id}>Remember this location on this device</label>
      </div>
      <div className="button-row">
        <button type="button" onClick={props.onForget} disabled={!props.hasLocation && !props.remember}>
          Forget location
        </button>
        <button type="button" onClick={props.onResetAll}>
          Reset all preferences
        </button>
        <button type="button" onClick={props.onClearAll}>
          Clear all local data
        </button>
      </div>
    </div>
  );
}
