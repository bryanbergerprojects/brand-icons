import { optimize as svgoOptimize } from 'svgo';
import type { Config } from 'svgo';
import type { Variant } from './schema';

const baseConfig = (variant: Variant): Config => ({
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          convertColors:
            variant === 'mono'
              ? { currentColor: true }
              : false,
        },
      },
    },
    'removeDimensions',
  ],
});

/**
 * Optimize a raw SVG string. Preserves the `0 0 24 24` viewBox; strips
 * width/height; for `color`, keeps official hex values; for `mono`, rewrites
 * every fill/stroke to `currentColor`.
 *
 * @param svg raw SVG markup
 * @param variant `'color'` or `'mono'`
 * @returns optimized SVG markup
 */
export const optimize = (svg: string, variant: Variant): string => {
  const result = svgoOptimize(svg, baseConfig(variant));
  if ('error' in result && result.error !== undefined) {
    throw new Error(`SVGO failed: ${result.error}`);
  }
  return result.data;
};
