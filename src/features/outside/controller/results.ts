/**
 * Derives everything the result UI shows from one forecast, the injected
 * time and the visitor's settings. Pure and synchronous: switching activity,
 * units or preferences recomputes locally and never requests weather.
 */
import { ACTIVITY_PRESETS, type ActivityPreset } from '../../../domain/activities';
import { scoreInterval, type IntervalAssessment } from '../../../domain/score';
import type { ActivityPreferences, Forecast } from '../../../domain/types';
import {
  compareNextHour,
  findWindows,
  nextHour,
  timelineIntervals,
  type NextHourComparison,
  type WindowAssessment,
  type WindowSearch,
} from '../../../domain/windows';
import type { Settings } from '../../../services/settings';

export type Results = {
  activity: ActivityPreset;
  prefs: ActivityPreferences;
  next: WindowAssessment;
  search: WindowSearch;
  comparison: NextHourComparison;
  timeline: IntervalAssessment[];
  recommendationsAllowed: boolean;
};

export function computeResults(
  forecast: Forecast,
  now: number,
  settings: Settings,
  recommendationsAllowed: boolean,
): Results {
  const activity = ACTIVITY_PRESETS[settings.activity];
  const prefs = settings.activities[settings.activity];
  const ctx = { prefs, weights: activity.weights };
  const next = nextHour(forecast.intervals, now, ctx);
  const search = findWindows(forecast.intervals, now, {
    ...ctx,
    durationMinutes: settings.durationMinutes,
    stale: !recommendationsAllowed,
  });
  return {
    activity,
    prefs,
    next,
    search,
    comparison: recommendationsAllowed ? compareNextHour(next, search.windows[0], now) : { kind: 'none' },
    timeline: timelineIntervals(forecast.intervals, now).map((i) => scoreInterval(i, prefs, activity.weights)),
    recommendationsAllowed,
  };
}
