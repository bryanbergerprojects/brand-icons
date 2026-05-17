import type { CSSProperties } from 'react';
import type { ColorMode, Variant } from '@brand-icons/core';

export type ColorModeResolution = {
  variant: Variant;
  style: CSSProperties | undefined;
};

type ResolveColorModeInput = {
  mode: ColorMode;
  variant: Variant;
  color: string | undefined;
};

/**
 * Resolve the active ColorMode into the SVG variant to render plus the
 * inline `style` to apply on the root `<svg>`.
 *
 * - `as-is` (default): no style, honors the caller's `variant`.
 * - `bw`: grayscale via CSS filter.
 * - `wb`: grayscale + inverted (white on black) via CSS filter.
 * - `mono`: forces the `mono` variant and sets `style.color` so every
 *   `fill="currentColor"` in the SVG adopts the target color.
 */
export const resolveColorMode = (
  input: ResolveColorModeInput,
): ColorModeResolution => {
  const { mode, variant, color } = input;

  switch (mode) {
    case 'bw':
      return { variant, style: { filter: 'grayscale(1)' } };
    case 'wb':
      return { variant, style: { filter: 'grayscale(1) invert(1)' } };
    case 'mono':
      return {
        variant: 'mono',
        style: { color: color ?? 'currentColor' },
      };
    case 'as-is':
    default:
      return { variant, style: undefined };
  }
};
