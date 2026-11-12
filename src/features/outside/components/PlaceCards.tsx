import { skyFor } from '../../../domain/sky';
import { sunState } from '../../../domain/sun';
import type { Location } from '../../../domain/types';
import { formatTime } from '../../../lib/time';

/**
 * PRODUCT ASSUMPTION: three well-known cities spread across time zones, shown
 * until the visitor pins places of their own. Coordinates are public city centres.
 */
export const EXAMPLE_PLACES: readonly Location[] = [
  { key: '51.51,-0.13', latitude: 51.51, longitude: -0.13, label: 'London, England, United Kingdom', source: 'search', countryCode: 'GB', timezone: 'Europe/London' },
  { key: '13.09,80.28', latitude: 13.09, longitude: 80.28, label: 'Chennai, Tamil Nadu, India', source: 'search', countryCode: 'IN', timezone: 'Asia/Kolkata' },
  { key: '-33.87,151.21', latitude: -33.87, longitude: 151.21, label: 'Sydney, New South Wales, Australia', source: 'search', countryCode: 'AU', timezone: 'Australia/Sydney' },
];

type Props = {
  /** The visitor's pinned places, or the examples when there are none. */
  places: readonly Location[];
  /** Names the list: "Places to try" for the examples, "Your pinned places" for pins. */
  label: string;
  now: number;
  onSelect: (place: Location) => void;
};

/**
 * Shortcut cards. Each card's sky shows only whether it is day, dusk, dawn or
 * night there right now (from the sun's position), never the weather: no
 * forecast is fetched until a card is chosen.
 */
export function PlaceCards({ places, label, now, onSelect }: Props) {
  return (
    <ul className="postcards" aria-label={label}>
      {places.map((place) => {
        const sun = sunState(place.latitude, place.longitude, now);
        const parts = place.label.split(',').map((p) => p.trim());
        return (
          <li key={place.key}>
            <button
              type="button"
              className="sky postcard"
              data-sky={skyFor(0, sun.body === 'sun', sun.low)}
              data-body={sun.body}
              onClick={() => onSelect(place)}
            >
              <span className="postcard-disc" aria-hidden="true" />
              <span className="postcard-city">{parts[0]}</span>
              <span className="postcard-country">{parts.length > 1 ? parts.at(-1) : '\u00a0'}</span>
              {place.timezone !== undefined && (
                <span className="postcard-time">
                  <span className="visually-hidden">Local time </span>
                  {formatTime(now, place.timezone)}
                </span>
              )}
              <span className="postcard-cue">
                See how it is
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                  <path d="M3 9h11M10 4.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
