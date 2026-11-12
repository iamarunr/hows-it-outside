import { useEffect, useRef } from 'react';
import type { SunState } from '../../../domain/sun';

const HILLS = [
  'M0 86C160 40 300 18 460 56s260 70 420 30 300-84 560-22v136H0z',
  'M0 128c140-38 280-54 430-22s250 62 410 38 330-84 600-30v86H0z',
  'M0 164c180-28 330-30 520-10s330 36 520 16 250-40 400-22v52H0z',
];

/**
 * The decorative world behind the readout: sun or moon on its arc, a layered
 * landscape, and rare sky moments (birds, a shooting star, lightning, fog).
 * Purely visual and hidden from assistive technology; all motion is CSS.
 */
export function SkyScene({ sun }: { sun: SunState }) {
  const extras = useRef<HTMLDivElement>(null);
  // Set through the CSSOM: the strict CSP forbids style attributes in markup.
  useEffect(() => {
    extras.current?.style.setProperty('--arc', sun.arc.toFixed(3));
  }, [sun.arc]);

  return (
    <>
      <div ref={extras} className="sky-extras" aria-hidden="true">
        <span className="scene-body" />
        <span className="sky-star" />
        <svg className="sky-birds" viewBox="0 0 120 40" focusable="false">
          <path d="M2 14q9-10 16 0q8-10 16 0M52 30q7-8 13 0q7-8 13 0M84 8q6-7 11 0q6-7 11 0" />
        </svg>
        <span className="sky-flash" />
      </div>
      <div className="scene" aria-hidden="true">
        {HILLS.map((d, i) => (
          <svg key={d} className={`scene-hill scene-hill-${i + 1}`} viewBox="0 0 1440 200" preserveAspectRatio="none" focusable="false">
            <path d={d} />
          </svg>
        ))}
        <span className="scene-fog" />
      </div>
    </>
  );
}
