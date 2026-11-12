import { bestWindowTitle, emptyReasonText, explain, HOURLY_APPROXIMATION_NOTE } from '../../../domain/explanations';
import type { UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { formatRange, MATCH_TEXT } from './copy';
import { FlagNotices } from './Summary';
import { MatchIcon } from './MatchIcon';

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
          <li key={w.start} className={`window window-${w.label}${i === 0 ? ' window-best' : ''}`}>
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
  );
}
