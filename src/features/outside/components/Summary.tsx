import { comparisonText, emptyReasonText, explain, summaryHeadline } from '../../../domain/explanations';
import { FLAG_COPY, NOTE_COPY } from '../../../domain/flags';
import type { FlagId, NoteId } from '../../../domain/types';
import { formatTime } from '../../../lib/time';
import type { UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { MATCH_TEXT } from './copy';

export function FlagNotices({ flags, notes = [] }: { flags: readonly FlagId[]; notes?: readonly NoteId[] }) {
  if (flags.length === 0 && notes.length === 0) return null;
  return (
    <ul className="flag-list">
      {flags.map((f) => (
        <li key={f} className="notice notice-concern">
          <span aria-hidden="true">! </span>
          {FLAG_COPY[f]}
        </li>
      ))}
      {notes.map((n) => (
        <li key={n} className="notice notice-mixed">
          {NOTE_COPY[n]}
        </li>
      ))}
    </ul>
  );
}

/** Next-hour summary: concerning notices first, then the verdict and up to two reasons. */
export function NextHourSummary({ results, units, timezone }: { results: Results; units: UnitSystem; timezone: string }) {
  const { next, activity, recommendationsAllowed, comparison } = results;
  const label = MATCH_TEXT[next.label];
  const reasons = explain(next, units);
  const compare = comparisonText(comparison, (t) => formatTime(t, timezone));

  return (
    <section className={`summary summary-${next.label}`} aria-labelledby="summary-heading">
      <p className="eyebrow">Next hour</p>
      <FlagNotices flags={next.flags} notes={next.notes} />
      {!recommendationsAllowed ? (
        <>
          <h3 id="summary-heading">Suggestions paused</h3>
          <p>The weather below is from an earlier forecast and may be out of date.</p>
        </>
      ) : (
        <>
          <h3 id="summary-heading">
            <span className="match-symbol" aria-hidden="true">
              {label.symbol}
            </span>{' '}
            {summaryHeadline(next, activity)}
          </h3>
          {next.label === 'limited' && <p>{emptyReasonText('data')}</p>}
          {reasons.length > 0 && (
            <ul className="reasons">
              {reasons.map((r) => (
                <li key={r.id}>{r.text}</li>
              ))}
            </ul>
          )}
          {compare !== null && <p className="comparison">{compare}</p>}
        </>
      )}
    </section>
  );
}
