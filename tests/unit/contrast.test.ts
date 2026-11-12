import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/** WCAG 2.x contrast for the actual token pairs used by the interface. */
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
function token(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
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
  for (const fg of ['color-text', 'color-text-secondary', 'color-brand', 'color-good', 'color-mixed', 'color-concern']) {
    for (const bg of backgrounds) {
      it(`${fg} on ${bg}`, () => expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  it('white text on the brand fill (selected segmented option)', () => {
    expect(contrast('#ffffff', token('color-brand'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('control boundaries and focus (≥ 3:1)', () => {
  for (const fg of ['color-control-border', 'color-text-secondary', 'color-brand']) {
    for (const bg of ['color-bg', 'color-surface']) {
      it(`${fg} on ${bg}`, () => expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3));
    }
  }
});
