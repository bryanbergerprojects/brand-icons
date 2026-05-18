import type { ColorMode, IconBrandYearRender, Variant } from '@brand-icons/core';
import { resolveColorMode } from './utils/color-mode';
import { parseBackground } from './utils/parse-bg';
import { parseSize } from './utils/parse-size';

const SVG_OPEN = /<svg([^>]*)>([\s\S]*)<\/svg>/;
const ROOT_FILL = /\bfill\s*=\s*"([^"]*)"/;

type ExtractedSvg = {
  inner: string;
  rootFill: string | undefined;
};

const extractSvg = (svgString: string): ExtractedSvg => {
  const match = SVG_OPEN.exec(svgString);
  if (match === null) return { inner: '', rootFill: undefined };
  const fillMatch = ROOT_FILL.exec(match[1] ?? '');
  return { inner: match[2] ?? '', rootFill: fillMatch?.[1] };
};

export type BrandIconRender = {
  svgInner: string;
  rootFill: string | undefined;
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
  const { inner, rootFill } = extractSvg(svgString);
  return {
    svgInner: inner,
    rootFill,
    bgColor: parseBackground({
      background: props.background,
      brandColor: data.brandColor,
    }),
    styleString,
    dim: parseSize(props.size),
  };
};
