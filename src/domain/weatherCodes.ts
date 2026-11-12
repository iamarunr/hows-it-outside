/**
 * Explicit local map of supported WMO-style weather codes (spec 03 §7).
 * Unknown codes are never rendered as clear weather.
 */

export type ConditionGroup =
  | 'clear'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing'
  | 'snow'
  | 'showers'
  | 'thunderstorm';

export type WeatherCodeInfo = { text: string; group: ConditionGroup };

export const WEATHER_CODES: ReadonlyMap<number, WeatherCodeInfo> = new Map([
  [0, { text: 'Clear sky', group: 'clear' }],
  [1, { text: 'Mainly clear', group: 'clear' }],
  [2, { text: 'Partly cloudy', group: 'cloud' }],
  [3, { text: 'Overcast', group: 'cloud' }],
  [45, { text: 'Fog', group: 'fog' }],
  [48, { text: 'Depositing rime fog', group: 'fog' }],
  [51, { text: 'Light drizzle', group: 'drizzle' }],
  [53, { text: 'Drizzle', group: 'drizzle' }],
  [55, { text: 'Dense drizzle', group: 'drizzle' }],
  [56, { text: 'Light freezing drizzle', group: 'freezing' }],
  [57, { text: 'Dense freezing drizzle', group: 'freezing' }],
  [61, { text: 'Light rain', group: 'rain' }],
  [63, { text: 'Rain', group: 'rain' }],
  [65, { text: 'Heavy rain', group: 'rain' }],
  [66, { text: 'Light freezing rain', group: 'freezing' }],
  [67, { text: 'Heavy freezing rain', group: 'freezing' }],
  [71, { text: 'Light snow', group: 'snow' }],
  [73, { text: 'Snow', group: 'snow' }],
  [75, { text: 'Heavy snow', group: 'snow' }],
  [77, { text: 'Snow grains', group: 'snow' }],
  [80, { text: 'Light rain showers', group: 'showers' }],
  [81, { text: 'Rain showers', group: 'showers' }],
  [82, { text: 'Violent rain showers', group: 'showers' }],
  [85, { text: 'Light snow showers', group: 'snow' }],
  [86, { text: 'Heavy snow showers', group: 'snow' }],
  [95, { text: 'Thunderstorm', group: 'thunderstorm' }],
  [96, { text: 'Thunderstorm with light hail', group: 'thunderstorm' }],
  [97, { text: 'Heavy thunderstorm', group: 'thunderstorm' }],
  [99, { text: 'Thunderstorm with heavy hail', group: 'thunderstorm' }],
]);

export const UNKNOWN_CONDITION_TEXT = 'Conditions unavailable';

export function isKnownWeatherCode(code: number): boolean {
  return WEATHER_CODES.has(code);
}

export function conditionText(code: number | null): string {
  if (code === null) return UNKNOWN_CONDITION_TEXT;
  return WEATHER_CODES.get(code)?.text ?? UNKNOWN_CONDITION_TEXT;
}
