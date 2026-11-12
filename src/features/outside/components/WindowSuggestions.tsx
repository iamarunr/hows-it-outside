import { bestWindowTitle, emptyReasonText, explain, HOURLY_APPROXIMATION_NOTE } from '../../../domain/explanations';
import type { UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { formatRange, MATCH_TEXT } from './copy';
import { FlagNotices } from './Summary';

export function WindowSuggestions({ results, units, timezone, now }: { results: Results; units: UnitSystem; timezone: string; now: number }) {
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
    <ol className="windows">
      {windows.map((w, i) => {
        const label = MATCH_TEXT[w.label];
        return (
          <li key={w.start} className={`window window-${w.label}`}>
            <p className="window-title">{i === 0 ? bestWindowTitle(w) : 'Another option'}</p>
            <p className="window-time">{formatRange(w.start, w.end, timezone, now)}</p>
            <p className="window-label">
              <span aria-hidden="true">{label.symbol} </span>
              {label.text}
            </p>
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
  );
}
