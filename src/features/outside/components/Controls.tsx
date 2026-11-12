import { useId } from 'react';
import { ACTIVITY_IDS, ACTIVITY_PRESETS, DURATIONS } from '../../../domain/activities';
import type { ActivityId, DurationMinutes } from '../../../domain/types';
import type { UnitSystem } from '../../../lib/units';

type RadioGroupProps<T extends string | number> = {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Native radios styled as segmented buttons (DESIGN: not tabs; wraps on narrow screens). */
function SegmentedRadios<T extends string | number>({ legend, name, options, value, onChange, className }: RadioGroupProps<T>) {
  const id = useId();
  return (
    <fieldset className={`segmented ${className ?? ''}`}>
      <legend>{legend}</legend>
      <div className="segmented-options">
        {options.map((o) => (
          <label key={String(o.value)} className="segmented-option">
            <input
              type="radio"
              name={`${name}-${id}`}
              value={String(o.value)}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ActivityPicker({ value, onChange }: { value: ActivityId; onChange: (id: ActivityId) => void }) {
  return (
    <SegmentedRadios
      legend="Activity"
      name="activity"
      options={ACTIVITY_IDS.map((id) => ({ value: id, label: ACTIVITY_PRESETS[id].label }))}
      value={value}
      onChange={onChange}
    />
  );
}

export function UnitsPicker({ value, onChange }: { value: UnitSystem; onChange: (u: UnitSystem) => void }) {
  return (
    <SegmentedRadios
      legend="Units"
      name="units"
      className="segmented-compact"
      options={[
        { value: 'metric', label: '°C, km/h, mm' },
        { value: 'us', label: '°F, mph, in' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

const DURATION_LABELS: Readonly<Record<DurationMinutes, string>> = { 30: '30 min', 60: '1 hour', 90: '1.5 hours', 120: '2 hours' };

export function WindowControls(props: {
  duration: DurationMinutes;
  daylightOnly: boolean;
  onDuration: (d: DurationMinutes) => void;
  onDaylightOnly: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="window-controls">
      <SegmentedRadios
        legend="How long will you be out?"
        name="duration"
        options={DURATIONS.map((d) => ({ value: d, label: DURATION_LABELS[d] }))}
        value={props.duration}
        onChange={props.onDuration}
      />
      <div className="checkbox">
        <input id={id} type="checkbox" checked={props.daylightOnly} onChange={(e) => props.onDaylightOnly(e.target.checked)} />
        <label htmlFor={id}>Daylight only</label>
      </div>
    </div>
  );
}
