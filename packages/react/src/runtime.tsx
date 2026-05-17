import type { BrandIconProps, IconBrandYearRender } from '@brand-icons/core';
import type { ReactElement } from 'react';
import { resolveColorMode } from './utils/color-mode';
import { parseBackground } from './utils/parse-bg';
import { parseSize } from './utils/parse-size';

type RenderIconInput = {
  data: IconBrandYearRender;
  props: BrandIconProps;
};

const SVG_INNER = /<svg[^>]*>([\s\S]*)<\/svg>/;

const extractInner = (svgString: string): string => {
  const match = SVG_INNER.exec(svgString);
  return match?.[1] ?? '';
};

/**
 * Render a single brand-year icon as a React element.
 *
 * Combines the raw SVG strings stored in `@brand-icons/core` (one
 * `IconBrandYearRender` per millésime) with the caller's
 * `BrandIconProps` (size, color, variant, mode, background, title,
 * className). The generated `<Brand><Year>Icon` components in
 * `src/icons/<Brand><Year>.tsx` are thin wrappers around this function.
 * @param input year-specific render data plus caller props
 * @returns memo-friendly React element ready for the icon tree
 */
export const renderIcon = (input: RenderIconInput): ReactElement => {
  const { data, props } = input;
  const { size, color, variant = 'color', mode = 'as-is', background, title, className } = props;

  const { variant: activeVariant, style } = resolveColorMode({
    mode,
    variant,
    color,
  });

  const svgString = activeVariant === 'mono' ? data.mono : data.color;
  const inner = extractInner(svgString);
  const dimension = parseSize(size);
  const bgFill = parseBackground({
    background,
    brandColor: data.brandColor,
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      role={title !== undefined ? 'img' : undefined}
      aria-label={title}
      className={className}
      style={style}
    >
      {title !== undefined ? <title>{title}</title> : null}
      {bgFill !== undefined ? <rect fill={bgFill} x="0" y="0" width="24" height="24" /> : null}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inner SVG comes from build-time bundled icon sources, never user input */}
      <g dangerouslySetInnerHTML={{ __html: inner }} />
    </svg>
  );
};
