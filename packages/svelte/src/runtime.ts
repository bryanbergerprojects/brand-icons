import type { ColorMode, IconBrandYearRender, Variant } from '@brand-icons/core';
import { resolveColorMode } from './utils/color-mode';
import { parseBackground } from './utils/parse-bg';
import { parseSize } from './utils/parse-size';

const SVG_INNER = /<svg[^>]*>([\s\S]*)<\/svg>/;

const extractInner = (svgString: string): string => {
  const match = SVG_INNER.exec(svgString);
  return match?.[1] ?? '';
};

export type BrandIconRender = {
  svgInner: string;
  bgColor: string | undefined;
  styleString: string | undefined;
  dim: string;
};

export type BrandIconRuntimeInput = {
  readonly size?: number | string | undefined;
  readonly color?: string | undefined;
  readonly variant?: Variant | undefined;
  readonly mode?: ColorMode | undefined;
  readonly background?: boolean | string | undefined;
  readonly title?: string | undefined;
  readonly className?: string | undefined;
};

type BuildBrandIconInput = {
  data: IconBrandYearRender;
  props: BrandIconRuntimeInput;
};

/**
 * Compute every derived field for a Svelte brand-icon SFC from its
 * `IconBrandYearRender` payload plus the caller's `BrandIconProps`.
 *
 * Pure synchronous function — Svelte 5 callers wrap the result in
 * `$derived(buildBrandIcon({ data, props }))` so it re-evaluates when
 * props change.
 */
export const buildBrandIcon = (input: BuildBrandIconInput): BrandIconRender => {
  const { data, props } = input;
  const { variant: activeVariant, styleString } = resolveColorMode({
    mode: props.mode ?? 'as-is',
    variant: props.variant ?? 'color',
    color: props.color,
  });
  const svgString = activeVariant === 'mono' ? data.mono : data.color;
  return {
    svgInner: extractInner(svgString),
    bgColor: parseBackground({
      background: props.background,
      brandColor: data.brandColor,
    }),
    styleString,
    dim: parseSize(props.size),
  };
};
