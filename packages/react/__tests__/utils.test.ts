import { describe, expect, it } from 'vitest';
import { parseSize } from '../src/utils/parse-size';
import { parseBackground } from '../src/utils/parse-bg';
import { resolveColorMode } from '../src/utils/color-mode';

describe('parseSize', () => {
  it('defaults to 1em when undefined', () => {
    expect(parseSize(undefined)).toBe('1em');
  });

  it('serializes a number as bare digits', () => {
    expect(parseSize(24)).toBe('24');
  });

  it('passes a CSS length string through', () => {
    expect(parseSize('2rem')).toBe('2rem');
  });
});

describe('parseBackground', () => {
  it('returns undefined when omitted', () => {
    expect(parseBackground({ background: undefined, brandColor: '#000' })).toBeUndefined();
  });

  it('returns undefined on false', () => {
    expect(parseBackground({ background: false, brandColor: '#000' })).toBeUndefined();
  });

  it('returns the brandColor when true', () => {
    expect(parseBackground({ background: true, brandColor: '#FF6900' })).toBe('#FF6900');
  });

  it('returns the explicit color when a string is passed', () => {
    expect(parseBackground({ background: '#abcdef', brandColor: '#000' })).toBe('#abcdef');
  });
});

describe('resolveColorMode', () => {
  it('passes through when as-is', () => {
    expect(
      resolveColorMode({ mode: 'as-is', variant: 'color', color: undefined }),
    ).toEqual({ variant: 'color', style: undefined });
  });

  it('applies grayscale for bw and keeps the requested variant', () => {
    expect(
      resolveColorMode({ mode: 'bw', variant: 'color', color: undefined }),
    ).toEqual({ variant: 'color', style: { filter: 'grayscale(1)' } });
  });

  it('applies grayscale + invert for wb', () => {
    expect(
      resolveColorMode({ mode: 'wb', variant: 'mono', color: undefined }),
    ).toEqual({ variant: 'mono', style: { filter: 'grayscale(1) invert(1)' } });
  });

  it('forces mono variant and emits style.color when mode=mono', () => {
    expect(
      resolveColorMode({ mode: 'mono', variant: 'color', color: '#ff0080' }),
    ).toEqual({ variant: 'mono', style: { color: '#ff0080' } });
  });

  it('falls back to currentColor when mode=mono and no color', () => {
    expect(
      resolveColorMode({ mode: 'mono', variant: 'mono', color: undefined }),
    ).toEqual({ variant: 'mono', style: { color: 'currentColor' } });
  });
});
