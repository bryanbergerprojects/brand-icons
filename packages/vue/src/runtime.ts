import type { ColorMode, IconBrandYearRender, Variant } from '@brand-icons/core';
import { type ComputedRef, computed } from 'vue';
import { resolveColorMode, type StyleMap } from './utils/color-mode';
import { parseBackground } from './utils/parse-bg';
import { parseSize } from './utils/parse-size';

/**
 * Variant of `BrandIconProps` widened to accept explicit `undefined`,
 * matching the shape Vue's `withDefaults(defineProps<T>(), …)` produces
 * for fields that have no default value.
 */
export type BrandIconRuntimeInput = {
  readonly size?: number | string | undefined;
  readonly color?: string | undefined;
  readonly variant?: Variant | undefined;
  readonly mode?: ColorMode | undefined;
  readonly background?: boolean | string | undefined;
  readonly title?: string | undefined;
  readonly className?: string | undefined;
};

const SVG_INNER = /<svg[^>]*>([\s\S]*)<\/svg>/;

const extractInner = (svgString: string): string => {
  const match = SVG_INNER.exec(svgString);
  return match?.[1] ?? '';
};

export type BrandIconRender = {
  svgInner: string;
  bgColor: string | undefined;
  style: StyleMap | undefined;
  dim: string;
};

/**
 * Compute every derived field for a Vue brand-icon SFC from its
 * `IconBrandYearRender` payload and the caller's reactive `BrandIconProps`.
 *
 * Returns a `ComputedRef` so consumers can spread its fields directly into
 * their template bindings — re-evaluation is automatic on prop change.
 *
 * @param data the per-year render payload from `@brand-icons/core`
 * @param props the SFC's reactive `BrandIconProps`
 */
export const useBrandIcon = (
  data: IconBrandYearRender,
  props: BrandIconRuntimeInput,
): ComputedRef<BrandIconRender> => {
  return computed<BrandIconRender>(() => {
    const { variant: activeVariant, style } = resolveColorMode({
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
      style,
      dim: parseSize(props.size),
    };
  });
};
