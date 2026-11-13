import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SKY_IDS } from '../../src/domain/sky';

/** WCAG 2.x contrast for the actual token pairs used by the interface. */
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
function token(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(css);
  if (m?.[1] === undefined) throw new Error(`missing token ${name}`);
  return m[1];
}
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const backgrounds = ['color-bg', 'color-surface', 'color-selected'];

describe('token contrast (normal text ≥ 4.5:1)', () => {
  for (const fg of ['color-text', 'color-text-secondary', 'color-brand', 'color-slate', 'color-good', 'color-mixed', 'color-concern']) {
    for (const bg of backgrounds) {
      it(`${fg} on ${bg}`, () => expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  it('white text on the brand fill (selected pill)', () => {
    expect(contrast('#ffffff', token('color-brand'))).toBeGreaterThanOrEqual(4.5);
  });
  it('notice text on its tint', () => {
    expect(contrast(token('color-concern-text'), token('color-concern-tint'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('color-mixed-text'), token('color-mixed-tint'))).toBeGreaterThanOrEqual(4.5);
  });
  it('band text, secondary text and sand on the charcoal band', () => {
    for (const fg of ['color-band-text', 'color-band-text-secondary', 'color-sand']) {
      expect(contrast(token(fg), token('color-band')), fg).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(token('color-band'), token('color-band-text'))).toBeGreaterThanOrEqual(4.5);
    for (const fg of ['color-good-on-band', 'color-mixed-on-band', 'color-concern-on-band']) {
      expect(contrast(token(fg), token('color-band')), fg).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function blend(base: string, over: string, alpha: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round(ch(base, i) * (1 - alpha) + ch(over, i) * alpha).toString(16).padStart(2, '0'))
    .join('')}`;
}

describe('sky readouts (ink ≥ 4.5:1 on both stops, bare and under the strongest veil)', () => {
  for (const sky of SKY_IDS) {
    it(sky, () => {
      const ink = token(`sky-${sky}-ink`);
      const veil = token(`sky-${sky}-veil`);
      const strength = Number(new RegExp(`--sky-${sky}-veil-strength:\\s*(\\d+)%`).exec(css)?.[1]) / 100;
      expect(strength).toBeGreaterThan(0);
      for (const stop of ['top', 'bottom']) {
        const bg = token(`sky-${sky}-${stop}`);
        expect(contrast(ink, bg), `${stop} bare`).toBeGreaterThanOrEqual(4.5);
        for (const a of [0.25, 0.5, 0.75, 1]) {
          expect(contrast(ink, blend(bg, veil, strength * a)), `${stop} veiled ${a}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});

describe('frosted menu', () => {
  it('white ink holds 4.5:1 on the frost over the lightest thing that can scroll beneath it (white)', () => {
    const strength = Number(/--header-frost:\s*(\d+)%/.exec(css)?.[1]) / 100;
    expect(strength).toBeGreaterThan(0);
    for (const beneath of ['#ffffff', token('color-bg'), token('color-band'), token('sky-night-clear-top')]) {
      expect(contrast('#ffffff', blend(beneath, token('color-brand'), strength)), beneath).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('control boundaries and focus (≥ 3:1)', () => {
  for (const fg of ['color-control-border', 'color-text-secondary', 'color-brand']) {
    for (const bg of ['color-bg', 'color-surface']) {
      it(`${fg} on ${bg}`, () => expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3));
    }
  }
  it('control borders on the charcoal band', () => {
    expect(contrast(token('color-band-border'), token('color-band'))).toBeGreaterThanOrEqual(3);
  });
});
