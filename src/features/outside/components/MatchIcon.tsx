import type { MatchLabel } from '../../../domain/types';

/**
 * Drawn status marks, one stroke weight, decorative (the label text carries the meaning).
 * good: filled disc with check · mixed: half-filled disc · poor: ring with bar ·
 * limited: dashed ring · check: triangle with exclamation.
 */
export function MatchIcon({ label, className }: { label: MatchLabel; className?: string }) {
  const common = {
    className: `match-icon match-icon-${label} ${className ?? ''}`,
    width: 18,
    height: 18,
    viewBox: '0 0 18 18',
    'aria-hidden': true,
    focusable: false,
  } as const;
  switch (label) {
    case 'good':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="8" fill="currentColor" />
          <path d="M5.2 9.3l2.4 2.4 5.2-5.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'mixed':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 1.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
        </svg>
      );
    case 'poor':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 9h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'limited':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.6 2.4" />
          <circle cx="9" cy="9" r="1.4" fill="currentColor" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 1.8l7.6 13.4H1.4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 6.6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="9" cy="13" r="1" fill="currentColor" />
        </svg>
      );
  }
}
