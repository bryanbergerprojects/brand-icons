import type { ColorMode, Variant } from '@brand-icons/core';

export type ColorModeResolution = {
  variant: Variant;
  styleString: string | undefined;
};

type ResolveColorModeInput = {
  mode: ColorMode;
  variant: Variant;
  color: string | null;
};

/**
 * Resolve the active ColorMode into the SVG variant to render plus the
 * inline `style` string to apply on the root `<svg>`. Returns a CSS-syntax
 * string so the custom element can set it via `svg.setAttribute('style', …)`.
 *
 * - `as-is` (default): no style, honors the caller's `variant`.
 * - `bw`: grayscale via CSS filter.
 * - `wb`: grayscale + inverted (white on black) via CSS filter.
 * - `mono`: forces the `mono` variant and sets `color` so every
 *   `fill="currentColor"` in the SVG adopts the target color.
 */
export const resolveColorMode = (input: ResolveColorModeInput): ColorModeResolution => {
  const { mode, variant, color } = input;

  switch (mode) {
    case 'bw':
      return { variant, styleString: 'filter: grayscale(1)' };
    case 'wb':
      return { variant, styleString: 'filter: grayscale(1) invert(1)' };
    case 'mono':
      return {
        variant: 'mono',
        styleString: `color: ${color ?? 'currentColor'}`,
      };
    default:
      return { variant, styleString: undefined };
  }
};
