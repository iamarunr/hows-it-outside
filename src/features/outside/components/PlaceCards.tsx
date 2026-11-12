import { skyFor } from '../../../domain/sky';
import { sunState } from '../../../domain/sun';
import { formatTime } from '../../../lib/time';
import type { PlaceResult } from '../../../services/geocoding';

type ExamplePlace = PlaceResult & { country: string; timezone: string };

/**
 * PRODUCT ASSUMPTION: three well-known cities spread across time zones, so the
 * cards usually show different times of day. Coordinates are public city centres.
 */
export const EXAMPLE_PLACES: readonly ExamplePlace[] = [
  { id: 2643743, name: 'London', label: 'London, England, United Kingdom', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', latitude: 51.5085, longitude: -0.1257 },
  { id: 1264527, name: 'Chennai', label: 'Chennai, Tamil Nadu, India', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', latitude: 13.0878, longitude: 80.2785 },
  { id: 2147714, name: 'Sydney', label: 'Sydney, New South Wales, Australia', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Sydney', latitude: -33.8679, longitude: 151.2073 },
];

/**
 * Shortcut cards. Each card's sky shows only whether it is day, dusk, dawn or
 * night there right now (from the sun's position), never the weather: no
 * forecast is fetched until a card is chosen.
 */
export function PlaceCards({ now, onSelect }: { now: number; onSelect: (place: PlaceResult) => void }) {
  return (
    <ul className="postcards" aria-label="Places to try">
      {EXAMPLE_PLACES.map((place) => {
        const sun = sunState(place.latitude, place.longitude, now);
        return (
          <li key={place.id}>
            <button
              type="button"
              className="sky postcard"
              data-sky={skyFor(0, sun.body === 'sun', sun.low)}
              data-body={sun.body}
              onClick={() => onSelect(place)}
            >
              <span className="postcard-disc" aria-hidden="true" />
              <span className="postcard-city">{place.name}</span>
              <span className="postcard-country">{place.country}</span>
              <span className="postcard-time">
                <span className="visually-hidden">Local time </span>
                {formatTime(now, place.timezone)}
              </span>
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
