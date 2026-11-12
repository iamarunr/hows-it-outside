# 03 — Data contracts and API integration

## 1. Canonical representation
All internal temperatures Celsius, speed km/h, precipitation mm, probability percent 0–100, duration seconds, and timestamps UTC epoch seconds. Convert only at UI boundaries. Keep requested rounded coordinates separate from provider-returned grid-cell coordinates. Never substitute a grid coordinate as the person's location.

```ts
type ActivityId = 'outdoors' | 'walk' | 'run' | 'bike' | 'hangout';
type Location = {
  key: string; latitude: number; longitude: number;
  label: string; source: 'search' | 'device';
  countryCode?: string; timezone?: string;
};
type Interval = {
  start: number; end: number; // [start,end), normally 3600 seconds
  temperatureC: number | null; feelsLikeC: number | null;
  humidityPct: number | null; windKmh: number | null;
  gustKmh: number | null; precipMm: number | null;
  precipProbabilityPct: number | null;
  weatherCodes: number[]; // both boundary samples, known codes only
  weatherCodeComplete: boolean;
  daylight: boolean | null; // true only if full interval passes day test
};
type Forecast = {
  schemaVersion: 1; provider: 'open-meteo';
  locationKey: string; timezone: string; fetchedAt: number;
  current: CurrentConditions | null;
  intervals: Interval[]; diagnostics: string[];
};
type CurrentConditions = {
  time: number; temperatureC: number | null; feelsLikeC: number | null;
  windKmh: number | null; gustKmh: number | null;
  humidityPct: number | null; weatherCode: number | null;
};
```

Implement equivalent concrete runtime schemas. Arrays can contain nulls. Finite numbers only; no NaN/Infinity. Latitude [-90,90], longitude [-180,180], including zero. Percent fields outside range become null with diagnostic, not silently clamped. Negative precipitation or wind becomes null. Invalid timezone falls back to UTC with explicit visible timezone warning; do not quietly use device time.

## 2. Provider requests
Forecast endpoint: https://api.open-meteo.com/v1/forecast. Request one rounded coordinate pair; temperature_unit=celsius, wind_speed_unit=kmh, precipitation_unit=mm, timezone=auto, timeformat=unixtime, forecast_days=3.

Daily block (IMP-063): the same request adds `daily=sunrise,sunset` (unixtime). Normalized to `Forecast.sunEvents`, time-ordered. Optional: a missing block, wrong unit, non-integer, zero or out-of-range value is dropped with a diagnostic and never invented; the interface then shows no sun times.

Hourly field list: temperature_2m, apparent_temperature, relative_humidity_2m, precipitation_probability, precipitation, weather_code, wind_speed_10m, wind_gusts_10m, is_day.

Current field list: temperature_2m, apparent_temperature, relative_humidity_2m, weather_code, wind_speed_10m, wind_gusts_10m.

Three provider days provide a buffer for the next 24 elapsed hours and interval endpoints; UI still shows only the next 24 hours. Confirm the requested fields and response units against installed fixtures and live smoke tests.

Field-availability check (M0, before the scoring rule is relied on): because missing precipitation_probability, gusts or weather codes yield Limited data, request the live forecast for at least five geographically varied locations (for example St. Louis, London, Chennai, Sydney, Tromsø, plus one in Africa and one in South America) and record, per field, the share of null values across the 72-hour response in a sanitized note under docs/. Do not commit coordinates beyond city-level. If any critical field is commonly null for a region or for later hours within the 24-hour horizon, record it in the decision log and raise it with the owner; do not silently relax the data-quality rule or substitute values. No forecast data is fetched at build time for visitors.

Geocoding endpoint: https://geocoding-api.open-meteo.com/v1/search. Parameters: name=trimmed user query, count=8, language=en, format=json. Build using URLSearchParams, never string concatenation of untrusted text. Start debounced search (300 ms) after 2 characters, counted as Unicode code points after trimming, so two-character names such as 北京 or 東京 work. Pressing Enter submits immediately, bypassing the debounce, for any non-empty query (single-character place names exist, e.g. Å in Norway). Per current provider documentation, short queries may match exact names only while longer queries match fuzzily; recheck in M0 and keep the empty-result copy helpful (“No places found. Try the full name or add the country.”). Empty results are not an HTTP error. Abort previous query; only newest response may update results. Maximum query length 120 characters. Label results using available name/admin1/country; omit missing parts gracefully. Preserve provider result IDs for stable keys.

Area-name endpoint (device location only, IMP-056 to IMP-058): https://api.bigdatacloud.net/data/reverse-geocode-client, which currently redirects to the same path on https://api-bdc.io (both origins are in connect-src). Parameters: latitude and longitude at two decimals, localityLanguage=en. Called once, right after a fresh geolocation result; never for searched or remembered places; no retry; 2 s timeout. Accept only `lookupSource: "coordinates"`; label is city (else locality), principalSubdivision, countryName with duplicates removed; anything else falls back to "Current area".

## 3. Temporal normalization — critical
The provider assigns different temporal meanings to fields. Keep a field-to-time-semantics registry in the adapter and test it. For adjacent timestamps t[i], t[i+1], create interval [t[i],t[i+1]) only when the difference is exactly 3600 seconds.

For the interval: instantaneous temperature, apparent temperature, humidity and sustained wind use the t[i] sample as the representative value. Precipitation amount, precipitation probability and maximum gust use t[i+1], because these summarize the preceding hour. Evaluate known weather codes from both boundary samples conservatively; mark weatherCodeComplete only when both are present and recognized. Daylight=true only if both endpoint is_day values are 1; false if either is 0; null if either missing and neither 0. This deliberately excludes a partial dawn/dusk hour from daylight-only suggestions. State the approximation in methodology.

Do not apply one index shift to all fields. Do not infer precipitation amount from probability, or probability from amount. Drop duplicate timestamp records deterministically after retaining the first and record a diagnostic; do not merge mismatched arrays by index across missing times. If arrays have different lengths, missing elements become null; time axis remains authoritative. Unsorted time arrays are invalid response data, not something to reorder independently of field arrays.

This normalization yields coarse hourly estimates, not promises about conditions at each minute. A 30-minute outing uses the entire intersecting hour's weather for scoring. Weather code flags from both boundaries are intentionally conservative.

## 4. Current vs next hour
The “Now” measurements come from current, with its own timestamp. The preference summary is labeled “Next hour” and uses intervals intersecting [now,now+3600). Do not label a blended hourly rain probability as a current observation. Hide stale current measurements if current.time is over 90 minutes old, or more than 10 minutes in the future relative to the device clock; explain clock/data mismatch. Valid hourly data may still render independently. “Retrieved” time is never described as model update time.

## 5. Time zones and date handling
Store epoch seconds; convert to milliseconds only for Date/Intl APIs. Use Intl.DateTimeFormat with forecast.timezone and explicit options. Do not add utc_offset_seconds before formatting an epoch in an IANA zone. Local midnight and DST are not fixed UTC offsets. Selection horizon is now to now+86400, regardless of calendar-day length. Include local date when crossing midnight; display zone abbreviation on repeated DST hours. Internal keys use epoch, never formatted labels. Half-hour and quarter-hour time zones are valid.

## 6. Display conversions
Fahrenheit = C*9/5+32; mph = km/h/1.609344; inches = mm/25.4. Round temperatures to whole degrees, wind to whole units, precipitation to one decimal mm or two decimals inches. For positive amounts that round to zero, display <0.1 mm or <0.01 in. Preference editing may show one decimal; convert back once and retain SI precision. Scoring must not use display-rounded values.

## 7. Weather-code mapping and attribution
Maintain a local explicit map of supported provider WMO-style codes with text/icons. At minimum support clear/cloud/fog/drizzle/rain/freezing precipitation/snow/showers/thunderstorms. Unknown codes render “Conditions unavailable,” never sunshine. Thunderstorm set includes 95,96,97,99 under current documentation; adapter tests must verify provider changes. Data-derived flag sets are specified in SCORING.

Visible forecast attribution: Weather data by Open-Meteo, linked to provider, plus CC BY 4.0 link in About/methodology. Search attribution: Location data by GeoNames via Open-Meteo. Keep data and source-code license statements distinct. Recheck exact provider attribution requirements before release.

## 8. Response handling
Validate response status, content type and JSON shape before normalization. Convert HTTP errors into typed categories: timeout, network, rate_limited, invalid_request, invalid_response, provider_unavailable. Show helpful user copy, not raw server reason or query URL. Diagnostics must not include coordinates or search text in production telemetry. No automated CI live requests; fixtures include both synthetic boundary cases and a documented sanitized example response.
