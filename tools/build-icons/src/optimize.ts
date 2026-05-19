import type { Config } from 'svgo';
import { optimize as svgoOptimize } from 'svgo';
import type { Variant } from './schema';

type OptimizeInput = {
  svg: string;
  variant: Variant;
  prefix: string;
};

const ROOT_SVG_OPEN = /<svg\b([^>]*)>/;
const ROOT_FILL_ATTR = /\bfill\s*=\s*"([^"]*)"/;

const baseConfig = (input: OptimizeInput): Config => ({
  // multipass amplifies risk of silent shape loss when fidelity-critical
  // plugins are disabled — single pass is enough for brand logos.
  multipass: false,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          convertColors: input.variant === 'mono' ? { currentColor: true } : false,
          // Brand-fidelity guard rails. SVGO's default preset can silently
          // alter path topology on hand-crafted logos. Disable the plugins
          // that rewrite coordinates, merge paths, or drop visually
          // significant elements. `convertShapeToPath` stays enabled —
          // geometry is exact, only the element name changes.
          convertPathData: false,
          mergePaths: false,
          removeHiddenElems: false,
          collapseGroups: false,
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
        },
      },
    },
    {
      name: 'prefixIds',
      params: {
        prefix: input.prefix,
        prefixIds: true,
        prefixClassNames: false,
      },
    },
    'removeDimensions',
  ],
});

const readRootFill = (svg: string): string | undefined => {
  const openMatch = ROOT_SVG_OPEN.exec(svg);
  if (openMatch === null) return undefined;
  const fillMatch = ROOT_FILL_ATTR.exec(openMatch[1] ?? '');
  return fillMatch?.[1];
};

const ensureRootFill = (optimized: string, sourceFill: string): string => {
  const openMatch = ROOT_SVG_OPEN.exec(optimized);
  if (openMatch === null) return optimized;
  if (ROOT_FILL_ATTR.test(openMatch[1] ?? '')) return optimized;
  const replacement = `<svg${openMatch[1] ?? ''} fill="${sourceFill}">`;
  return optimized.replace(openMatch[0], replacement);
};

/**
 * Optimize a raw SVG string. Preserves the `0 0 24 24` viewBox; strips
 * width/height; namespaces every internal id/url reference under `prefix`
 * so gradients don't collide when multiple icons are inlined in the same
 * DOM; for `color`, keeps official hex values; for `mono`, rewrites every
 * fill/stroke to `currentColor`.
 *
 * @param input svg markup, variant, and per-icon id prefix
 * @returns optimized SVG markup
 */
export const optimize = (input: OptimizeInput): string => {
  const result = svgoOptimize(input.svg, baseConfig(input));
  if ('error' in result && result.error !== undefined) {
    throw new Error(`SVGO failed: ${result.error}`);
  }
  const sourceFill = readRootFill(input.svg);
  if (sourceFill === undefined) return result.data;
  return ensureRootFill(result.data, sourceFill);
};
