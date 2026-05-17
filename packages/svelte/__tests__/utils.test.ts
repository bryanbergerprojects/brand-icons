import { describe, expect, it } from 'vitest';
import { resolveColorMode } from '../src/utils/color-mode';
import { parseBackground } from '../src/utils/parse-bg';
import { parseSize } from '../src/utils/parse-size';

describe('parseSize', () => {
  it('defaults to 1em', () => {
    expect(parseSize(undefined)).toBe('1em');
  });
  it('serializes a number', () => {
    expect(parseSize(24)).toBe('24');
  });
  it('passes a string through', () => {
    expect(parseSize('2rem')).toBe('2rem');
  });
});

describe('parseBackground', () => {
  it('returns undefined for false', () => {
    expect(parseBackground({ background: false, brandColor: '#000' })).toBeUndefined();
  });
  it('returns undefined for undefined', () => {
    expect(parseBackground({ background: undefined, brandColor: '#000' })).toBeUndefined();
  });
  it('returns brandColor for true', () => {
    expect(parseBackground({ background: true, brandColor: '#abc123' })).toBe('#abc123');
  });
  it('passes a string through', () => {
    expect(parseBackground({ background: '#fff', brandColor: '#000' })).toBe('#fff');
  });
});

describe('resolveColorMode', () => {
  it('as-is leaves variant and clears style', () => {
    const r = resolveColorMode({ mode: 'as-is', variant: 'color', color: undefined });
    expect(r.variant).toBe('color');
    expect(r.styleString).toBeUndefined();
  });
  it('bw applies grayscale filter', () => {
    const r = resolveColorMode({ mode: 'bw', variant: 'color', color: undefined });
    expect(r.styleString).toBe('filter: grayscale(1)');
  });
  it('wb applies grayscale+invert', () => {
    const r = resolveColorMode({ mode: 'wb', variant: 'color', color: undefined });
    expect(r.styleString).toBe('filter: grayscale(1) invert(1)');
  });
  it('mono forces mono variant + color', () => {
    const r = resolveColorMode({ mode: 'mono', variant: 'color', color: '#f80' });
    expect(r.variant).toBe('mono');
    expect(r.styleString).toBe('color: #f80');
  });
  it('mono falls back to currentColor', () => {
    const r = resolveColorMode({ mode: 'mono', variant: 'color', color: undefined });
    expect(r.styleString).toBe('color: currentColor');
  });
});
