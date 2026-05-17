import { describe, expect, it } from 'vitest';
import { extractPalette, comparePalettes } from '../src/palette';

describe('extractPalette', () => {
  it('extracts 6 colors from horizontal stripes', () => {
    const svg = `<svg viewBox="0 0 24 24">
      <rect fill="#75BD21" x="0" y="0" width="24" height="4"/>
      <rect fill="#FFC728" x="0" y="4" width="24" height="4"/>
      <rect fill="#FF661C" x="0" y="8" width="24" height="4"/>
      <rect fill="#CF0F2B" x="0" y="12" width="24" height="4"/>
      <rect fill="#B01CAB" x="0" y="16" width="24" height="4"/>
      <rect fill="#00A1DE" x="0" y="20" width="24" height="4"/>
    </svg>`;
    const palette = extractPalette(svg);
    expect(palette).toHaveLength(6);
    expect(palette).toEqual(
      expect.arrayContaining([
        '#75BD21',
        '#FFC728',
        '#FF661C',
        '#CF0F2B',
        '#B01CAB',
        '#00A1DE',
      ]),
    );
  });

  it('extracts a single color', () => {
    const svg = `<svg viewBox="0 0 24 24"><path fill="#181717" d="M12 0L0 12l12 12 12-12z"/></svg>`;
    expect(extractPalette(svg)).toEqual(['#181717']);
  });

  it('propagates group fill to children with no own fill', () => {
    const svg = `<svg viewBox="0 0 24 24">
      <g fill="#FC6D26"><path d="M12 0L0 12h24z"/></g>
      <g fill="#E24329"><path d="M12 24L0 12h24z"/></g>
    </svg>`;
    const palette = extractPalette(svg);
    expect(palette).toEqual(expect.arrayContaining(['#FC6D26', '#E24329']));
  });

  it('resolves linearGradient references', () => {
    const svg = `<svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="g">
          <stop offset="0" stop-color="#FF0000"/>
          <stop offset="1" stop-color="#00FF00"/>
        </linearGradient>
      </defs>
      <rect fill="url(#g)" x="0" y="0" width="24" height="24"/>
    </svg>`;
    const palette = extractPalette(svg);
    expect(palette).toEqual(expect.arrayContaining(['#FF0000', '#00FF00']));
  });

  it('ignores none / transparent / currentColor', () => {
    const svg = `<svg viewBox="0 0 24 24">
      <rect fill="none" x="0" y="0" width="24" height="24"/>
      <rect fill="currentColor" x="0" y="0" width="12" height="12"/>
      <rect fill="#ABCDEF" x="12" y="12" width="12" height="12"/>
    </svg>`;
    expect(extractPalette(svg)).toEqual(['#ABCDEF']);
  });
});

describe('comparePalettes', () => {
  it('returns 0 divergence on identical sets', () => {
    const diff = comparePalettes(['#FF0000', '#00FF00'], ['#00FF00', '#FF0000']);
    expect(diff.divergence).toBe(0);
  });

  it('counts symmetric difference', () => {
    const diff = comparePalettes(['#FF0000'], ['#00FF00']);
    expect(diff.divergence).toBe(2);
    expect(diff.missingFromExtracted).toEqual(['#FF0000']);
    expect(diff.missingFromDeclared).toEqual(['#00FF00']);
  });
});
