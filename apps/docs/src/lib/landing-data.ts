export type PlaygroundYear = {
  readonly year: number;
  readonly label: string;
  readonly sw: number;
  readonly scale: number;
};

export const PG_YEARS: readonly PlaygroundYear[] = [
  { year: 1977, label: 'Sketch', sw: 3.0, scale: 1.05 },
  { year: 1998, label: 'Outline', sw: 2.2, scale: 1 },
  { year: 2015, label: 'Signal', sw: 1.5, scale: 0.96 },
];

export type PlaygroundPaletteEntry = {
  readonly id: string;
  readonly hex: string;
  readonly varName: string;
};

export const PALETTE: readonly PlaygroundPaletteEntry[] = [
  { id: 'ink', hex: '#111111', varName: '--color-pal-ink' },
  { id: 'red', hex: '#D7361A', varName: '--color-pal-red' },
  { id: 'blue', hex: '#1F6FEB', varName: '--color-pal-blue' },
  { id: 'green', hex: '#0E8A4F', varName: '--color-pal-green' },
  { id: 'gray', hex: '#7A7768', varName: '--color-pal-gray' },
];

export const PG_SIZES: readonly number[] = [16, 24, 32, 48];

export type TimelineEra = {
  readonly year: number;
  readonly label: string;
  readonly sw: number;
  readonly fill: string;
  readonly dash: string;
};

export const TLN_ERAS: readonly TimelineEra[] = [
  { year: 2003, label: 'Sketch', sw: 2.4, fill: 'none', dash: '3 4' },
  { year: 2005, label: 'Outline', sw: 1.8, fill: 'none', dash: '' },
  { year: 2009, label: 'Tone', sw: 1.4, fill: 'rgba(0,0,0,0.08)', dash: '' },
  { year: 2013, label: 'Flat', sw: 0, fill: 'var(--color-ink)', dash: '' },
  { year: 2019, label: 'Signal', sw: 0, fill: 'var(--color-accent)', dash: '' },
];

export const TIMELINE_YEARS: readonly number[] = [1977, 1985, 1998, 2008, 2015, 2026];

export type DocShortcut = { readonly title: string; readonly href: string };
