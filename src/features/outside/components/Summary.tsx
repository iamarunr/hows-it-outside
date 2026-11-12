import { comparisonText, emptyReasonText, explain, summaryHeadline } from '../../../domain/explanations';
import { FLAG_COPY, NOTE_COPY } from '../../../domain/flags';
import type { FlagId, NoteId } from '../../../domain/types';
import { formatTime } from '../../../lib/time';
import type { UnitSystem } from '../../../lib/units';
import type { Results } from '../controller/results';
import { MatchIcon } from './MatchIcon';

export function FlagNotices({ flags, notes = [] }: { flags: readonly FlagId[]; notes?: readonly NoteId[] }) {
  if (flags.length === 0 && notes.length === 0) return null;
  return (
    <ul className="flag-list">
      {flags.map((f) => (
        <li key={f} className="notice notice-concern">
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
  const reasons = explain(next, units);
  const compare = comparisonText(comparison, (t) => formatTime(t, timezone));

  return (
    <section className={`summary summary-${next.label}`} aria-labelledby="summary-heading">
      <FlagNotices flags={next.flags} notes={next.notes} />
      {!recommendationsAllowed ? (
        <>
          <h3 id="summary-heading">Suggestions paused</h3>
          <p className="summary-when">Next hour · The weather below is from an earlier forecast and may be out of date.</p>
        </>
      ) : (
        <>
          <h3 id="summary-heading">
            <MatchIcon label={next.label} className="summary-icon" />
            {summaryHeadline(next, activity)}
          </h3>
          <p className="summary-when">Next hour, from {formatTime(next.start, timezone)}</p>
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
