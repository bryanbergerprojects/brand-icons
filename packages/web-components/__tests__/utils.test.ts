import { describe, expect, it } from 'vitest';
import { resolveColorMode } from '../src/utils/color-mode';
import { parseBackground } from '../src/utils/parse-bg';
import { parseSize } from '../src/utils/parse-size';

describe('parseSize', () => {
  it('defaults to 1em when null', () => {
    expect(parseSize(null)).toBe('1em');
  });
  it('defaults to 1em when empty string', () => {
    expect(parseSize('')).toBe('1em');
  });
  it('passes a numeric string through', () => {
    expect(parseSize('32')).toBe('32');
  });
  it('passes a CSS length through', () => {
    expect(parseSize('2rem')).toBe('2rem');
  });
});

describe('parseBackground', () => {
  it('returns undefined for null', () => {
    expect(parseBackground({ background: null, brandColor: '#000' })).toBeUndefined();
  });
  it('returns brandColor for empty attr', () => {
    expect(parseBackground({ background: '', brandColor: '#abc' })).toBe('#abc');
  });
  it('returns brandColor for "true"', () => {
    expect(parseBackground({ background: 'true', brandColor: '#abc' })).toBe('#abc');
  });
  it('returns undefined for "false"', () => {
    expect(parseBackground({ background: 'false', brandColor: '#abc' })).toBeUndefined();
  });
  it('passes a literal color through', () => {
    expect(parseBackground({ background: '#fff', brandColor: '#000' })).toBe('#fff');
  });
});

describe('resolveColorMode', () => {
  it('as-is leaves variant and clears style', () => {
    const r = resolveColorMode({ mode: 'as-is', variant: 'color', color: null });
    expect(r.variant).toBe('color');
    expect(r.styleString).toBeUndefined();
  });
  it('bw applies grayscale filter', () => {
    const r = resolveColorMode({ mode: 'bw', variant: 'color', color: null });
    expect(r.styleString).toBe('filter: grayscale(1)');
  });
  it('wb applies grayscale + invert', () => {
    const r = resolveColorMode({ mode: 'wb', variant: 'color', color: null });
    expect(r.styleString).toBe('filter: grayscale(1) invert(1)');
  });
  it('mono forces mono variant + color', () => {
    const r = resolveColorMode({ mode: 'mono', variant: 'color', color: '#f80' });
    expect(r.variant).toBe('mono');
    expect(r.styleString).toBe('color: #f80');
  });
  it('mono falls back to currentColor', () => {
    const r = resolveColorMode({ mode: 'mono', variant: 'color', color: null });
    expect(r.styleString).toBe('color: currentColor');
  });
});
