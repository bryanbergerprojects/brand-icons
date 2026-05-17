import { describe, expect, it } from 'vitest';
import { optimize } from '../src/optimize';

const rawColor = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
  <rect fill="#FF0000" x="0" y="0" width="24" height="24"/>
</svg>`;

const rawMono = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
  <path fill="#000000" d="M0 0h24v24H0z"/>
</svg>`;

describe('optimize(color)', () => {
  const out = optimize({ svg: rawColor, variant: 'color', prefix: 'test' });

  it('preserves the 0 0 24 24 viewBox', () => {
    expect(out).toContain('viewBox="0 0 24 24"');
  });

  it('strips width and height from the root svg', () => {
    expect(/<svg[^>]*\bwidth=/.test(out)).toBe(false);
    expect(/<svg[^>]*\bheight=/.test(out)).toBe(false);
  });

  it('preserves official hex colors (no shorthand conversion)', () => {
    expect(out).toContain('#FF0000');
  });
});

describe('optimize(mono)', () => {
  const out = optimize({ svg: rawMono, variant: 'mono', prefix: 'test' });

  it('rewrites every fill to currentColor', () => {
    expect(out).toContain('currentColor');
    expect(/#[0-9a-fA-F]{3,6}/.test(out)).toBe(false);
  });

  it('preserves the 0 0 24 24 viewBox', () => {
    expect(out).toContain('viewBox="0 0 24 24"');
  });

  it('strips width and height from the root svg', () => {
    expect(/<svg[^>]*\bwidth=/.test(out)).toBe(false);
  });
});
