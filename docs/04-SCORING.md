# 04 — Preference scoring and window selection

## 1. Intent and authority
This is a deterministic **product heuristic**, not a scientific comfort model, medical threshold table, official warning feed or safety assessment. Initial thresholds are proposed tuning defaults. Do not describe them as validated, personalized physiology, or provider recommendations. Public methodology must disclose inputs, limitations, and preset values.

Keep numeric scores internal. Public labels: Good match, Mixed conditions, Poor match, Limited data, Check conditions. Their meanings are tied to preferences. “Safe,” “unsafe,” “perfect,” and “guaranteed dry” are prohibited generated verdicts.

## 2. Presets
All values use Celsius and km/h. Rain enum light means some precipitation is acceptable, not a promise of light intensity.

| Activity | Comfortable feels-like range | Temp weight | Rain weight | Wind weight | Default rain | Default wind |
|---|---|---:|---:|---:|---|---|
| Outdoors | 12–26 | .40 | .35 | .25 | light | medium |
| Walk | 8–25 | .40 | .35 | .25 | light | medium |
| Run | 5–20 | .50 | .25 | .25 | light | medium |
| Bike | 10–25 | .30 | .30 | .40 | avoid | low |
| Hang out | 18–27 | .45 | .35 | .20 | avoid | low |

Default daylightOnly=true; default duration 60 minutes. Users can override each activity's comfort band and rain/wind tolerances. General Outdoors is a preset for casual land-based activities; it is not a universal suitability model for every sport.

## 3. Interval penalties
Let clamp(x)=min(1,max(0,x)). All penalties are [0,1].

Temperature: distance d is zero inside [low,high], otherwise distance to the nearest boundary in °C. T=clamp(d/12). Feels-like temperature already incorporates weather effects; humidity is displayed for context and is not penalized a second time. Wind is intentionally penalized separately even though feels-like includes wind chill, because wind also affects effort and comfort independently of temperature (notably for cycling). Methodology must disclose this partial double-count.

Rain: R=max(clamp(probabilityPct/P), clamp(precipMm/M)). Tolerance divisors:

| Rain tolerance | P (%) | M (mm per hour) |
|---|---:|---:|
| avoid | 40 | 0.5 |
| light | 70 | 2 |
| okay | 100 | 5 |

Wind: W=max(clamp((windKmh-S)/20), clamp((gustKmh-G)/30)).

| Wind tolerance | S (sustained km/h) | G (gust km/h) |
|---|---:|---:|
| low | 10 | 20 |
| medium | 18 | 30 |
| high | 28 | 45 |

Base score = 100*(1-(wT*T+wR*R+wW*W)).

Worst-factor cap (prevents one fully unacceptable dimension from being averaged out by good ones): let worst=max(T,R,W) and cap=100-120*max(0, worst-0.5). Interval score = min(baseScore, cap). The cap has no effect while every penalty is at most 0.5, falls linearly, and reaches 40 (Poor match) when any single penalty saturates at 1. Both terms are non-increasing in every penalty, so monotonicity holds and there is no cliff in ranking.

Use full floating precision internally. Classification: score >=75 Good match; >=45 and <75 Mixed conditions; <45 Poor match. Boundaries are inclusive exactly as written. Record whether the cap bound the score (capApplied) alongside contributions so explanations can name the limiting factor.

## 4. Non-negotiable data quality
Scoring requires feelsLikeC, windKmh, gustKmh, precipMm, precipProbabilityPct and complete recognized boundary weather codes. Missing any produces score=null and Limited data; do not reweight the remaining dimensions. Missing actual temperature or humidity does not prevent a score. Daylight missing excludes that interval from daylight-only suggestions, but does not invalidate a nighttime-allowed score. Validity is about complete inputs, not forecast certainty.

Every score returns contributions {temperature, precipitation, wind}, reason IDs and flags. Components may display available metrics despite unavailable score. Unknown weather codes prevent “Good match.” If the forecast is in the stale freshness tier (see ARCHITECTURE §6: fetched 60 minutes or more ago), suppress ranked windows and replace verdict with stale-data text. A forecast that is merely due for refresh (15–60 minutes) still produces recommendations.

## 5. Concerning-weather flags
Independent of user tolerances; display whenever detected, including when other fields are missing. Flagged intervals cannot enter ranked suggested windows. Flag checks take precedence over a high numeric score and produce Check conditions. This is a conservative app policy, not an official hazard threshold.

| Flag | Trigger in any relevant interval sample | Copy |
|---|---|---|
| thunderstorm | weather code 95,96,97,99 | Thunderstorms in the forecast. Check local conditions and official alerts. |
| freezing_precip | code 56,57,66,67 | Freezing precipitation in the forecast. |
| strong_gusts | gust >=50 km/h | Strong gusts in the forecast. |
| high_heat | feels-like >=35°C | Very hot feels-like conditions. |
| severe_cold | feels-like <=-15°C | Very cold feels-like conditions. |
| heavy_precip | precipitation >=10 mm/hour | Heavy precipitation in the forecast. |
| snow_or_ice_concern | code 71,73,75,77,85,86,48 | Snow or icy conditions may affect surfaces. |

Do not let a custom preference suppress these flags. Fog code 45 is an informational note, not excluded unless another flag applies. Do not infer surface traction from air temperature alone. Do not assert absence of hazards when no flag fires: air quality, official warnings, visibility detail, terrain and water conditions are outside MVP.

## 6. Window candidate generation
Inject now as epoch seconds. Horizon end=now+86400. Candidate starts are now plus each future normalized interval.start strictly greater than now. De-duplicate by epoch. Duration D is 1800/3600/5400/7200 seconds. Only candidates whose end<=horizon end are considered.

Collect intervals with positive overlap with [start,start+D). They must exactly cover the duration without gaps. Weight interval scores by overlap seconds. Reject candidate if any overlap has score=null, any flag, stale data, or daylight not true while daylightOnly is selected. Never prorate accumulated hourly precipitation to pretend a shorter outing is guaranteed drier.

Window score = 0.7*durationWeightedMean(intervalScores) + 0.3*min(intervalScores). This penalizes one bad hour in a longer outing. Reject candidates with min score<45; only windows with all intervals at least Mixed and aggregate score>=45 are eligible. Classification uses the same 75/45 boundaries.

Ranking: descending full-precision window score; exact ties choose earlier start. Select first, then greedily select remaining candidates with no positive temporal overlap with already selected windows, up to three. Adjacent windows are allowed. Do not include a poor window just to fill three slots. Label top choice “Best match in the next 24 hours”; if it is Mixed, display “Best available: mixed conditions.” A 30-minute recommendation based on an hourly interval must say “Based on hourly forecasts.”

For near-equivalent results, avoid churn: optional future smoothing is deferred. V1 exact deterministic ranking is authoritative.

## 7. Next-hour summary and comparison
Use the same aggregation for [now,now+3600), but do not reject just because it is Poor or flagged: show its label, flags and reasons. If coverage is missing show Limited data. When best window's score exceeds next-hour score by >=10 and begins later, say “A better match around [local time].” Otherwise say “Conditions are similar across these windows.” If now is best, say “Now is one of your best windows.” Do not compare null scores or imply a flagged current period is recommended.

## 8. Explanations
For each window sum weighted penalty contributions by overlap time. Order descending contributions, with deterministic ties temperature then precipitation then wind. If the worst-factor cap bound any interval in the window, the first reason is the dimension with the highest unweighted penalty in that interval (same tie order), because it is what made the period a poor match. Show up to two nonzero drivers, using measured min/max and preference terms: “Warmer than your preferred range,” “Higher chance of precipitation,” “Windier than you prefer.” Zero penalties may generate “Within your preferred temperature range, with low wind and precipitation in the forecast.” Do not say no rain from low probability.

Precipitation window summary uses maximum hourly probability and maximum hourly amount, each explicitly labeled peak hourly; do not multiply probabilities or imply a whole-outing probability. If no windows remain, distinguish missing coverage/data, daylight filtering, concerning-weather flags, and preference mismatch; show the highest-priority applicable reason in that order, with any detected flags still visible. Window wind/gust use maximum; temperature displays min–max. Reason text comes from structured IDs/templates, not raw HTML or provider messages.

## 9. Golden examples
A Walk interval at feels-like 20°C, probability 0%, precipitation 0, sustained 5 and gust 10 has score 100, no flags, Good match. Same weather with probability 35% and light tolerance yields R=.5, base 82.5, cap 100, score=82.5 Good. At probability 52.5%, R=.75, base 73.75, cap 70, score=70 Mixed. At probability 70%, R=1, base 65, cap 40, score=40 Poor. Steady 9 mm/hour with avoid tolerance (no flag; heavy_precip starts at 10) gives R=1 and score 40 Poor, so it can never be suggested. Walk at feels-like -4°C, dry and calm, gives T=1 and score 40 Poor. A 60-minute window with equal half-hour overlaps of scores 100 and 60 yields .7*80+.3*60=74, Mixed. A score of exactly 75 is Good; 45 is Mixed. Gust exactly 50 excludes a suggestion even if aggregate score would otherwise pass. Null probability gives Limited data; numeric zero probability does not.

## 10. Tuning and versioning
Keep constants in one versioned module with scoringVersion=1. Write tests before altering thresholds. Changes require a changelog entry and methodology update. No machine-learned personalization or silent server-controlled scoring. A user can always inspect the underlying weather regardless of the verdict.
