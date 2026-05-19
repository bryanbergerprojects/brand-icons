#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ColorMode,
  Hierarchical,
  PathSimplifyMode,
  vectorize,
} from '@neplex/vectorizer';

const HELP = `Raster → SVG vectorizer (VTracer via @neplex/vectorizer).

Usage:
  node tools/raster-to-svg/raster.mjs --input=<raster> --output=<svg> [opts]

Required:
  --input=<path>        Input raster (.png, .jpg, .webp, …)
  --output=<path>       Destination SVG

Options:
  --variant=color|mono  ColorMode (default: color). 'mono' uses Binary mode
                        + rewrites every fill to currentColor.
  --filter-speckle=<n>  Noise reduction threshold (default: 4)
  --color-precision=<n> Color quantization bits (default: 6 color / 2 mono)
  --corner-threshold=<n> Corner detection in degrees (default: 60)
  --layer-difference=<n> Layer separation tolerance (default: 5)
  --quiet               Suppress stdout summary

Output is post-processed to viewBox="0 0 24 24" (aspect-preserving fit).

Exit codes:
  0  success     1  bad input / vectorizer failure
`;

const parseArgs = (argv) => {
  const opts = {
    variant: 'color',
    filterSpeckle: 4,
    colorPrecision: undefined,
    cornerThreshold: 60,
    layerDifference: 5,
    quiet: false,
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--quiet') {
      opts.quiet = true;
    } else if (arg.startsWith('--input=')) {
      opts.input = arg.slice('--input='.length);
    } else if (arg.startsWith('--output=')) {
      opts.output = arg.slice('--output='.length);
    } else if (arg.startsWith('--variant=')) {
      opts.variant = arg.slice('--variant='.length);
    } else if (arg.startsWith('--filter-speckle=')) {
      opts.filterSpeckle = Number.parseInt(arg.slice('--filter-speckle='.length), 10);
    } else if (arg.startsWith('--color-precision=')) {
      opts.colorPrecision = Number.parseInt(arg.slice('--color-precision='.length), 10);
    } else if (arg.startsWith('--corner-threshold=')) {
      opts.cornerThreshold = Number.parseInt(arg.slice('--corner-threshold='.length), 10);
    } else if (arg.startsWith('--layer-difference=')) {
      opts.layerDifference = Number.parseInt(arg.slice('--layer-difference='.length), 10);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  if (opts.help) return opts;
  if (!opts.input || !opts.output) {
    throw new Error('Required: --input=<raster> --output=<svg>');
  }
  if (opts.variant !== 'color' && opts.variant !== 'mono') {
    throw new Error(`Invalid --variant: ${opts.variant} (expected color|mono)`);
  }
  return opts;
};

const SVG_OPEN = /<svg\b([^>]*)>/;
const VIEWBOX_ATTR = /\bviewBox\s*=\s*"([^"]*)"/;
const WIDTH_ATTR = /\bwidth\s*=\s*"([^"]*)"/;
const HEIGHT_ATTR = /\bheight\s*=\s*"([^"]*)"/;
const FILL_HEX_ATTR = /\bfill\s*=\s*"#[0-9A-Fa-f]{3,8}"/g;
const STROKE_HEX_ATTR = /\bstroke\s*=\s*"#[0-9A-Fa-f]{3,8}"/g;

const parseDim = (raw) => {
  if (raw === undefined) return undefined;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const extractSourceBox = (svg) => {
  const openMatch = SVG_OPEN.exec(svg);
  if (openMatch === null) throw new Error('vectorizer returned no <svg> root');
  const attrs = openMatch[1] ?? '';
  const inner = svg.slice(openMatch.index + openMatch[0].length, svg.lastIndexOf('</svg>'));
  const vbMatch = VIEWBOX_ATTR.exec(attrs);
  if (vbMatch?.[1]) {
    const parts = vbMatch[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const [x, y, w, h] = parts;
      if (w > 0 && h > 0) return { x, y, w, h, inner };
    }
  }
  const w = parseDim(WIDTH_ATTR.exec(attrs)?.[1]);
  const h = parseDim(HEIGHT_ATTR.exec(attrs)?.[1]);
  if (w !== undefined && h !== undefined) return { x: 0, y: 0, w, h, inner };
  throw new Error('vectorizer SVG has no usable viewBox/width/height');
};

const fitTo24 = (box) => {
  const scale = 24 / Math.max(box.w, box.h);
  const fitW = box.w * scale;
  const fitH = box.h * scale;
  const tx = (24 - fitW) / 2 - box.x * scale;
  const ty = (24 - fitH) / 2 - box.y * scale;
  const fmt = (n) => Number.parseFloat(n.toFixed(4)).toString();
  return `translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(scale)})`;
};

const rewriteToCurrentColor = (svg) =>
  svg.replace(FILL_HEX_ATTR, 'fill="currentColor"').replace(STROKE_HEX_ATTR, 'stroke="currentColor"');

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }
  const inputPath = resolve(opts.input);
  const outputPath = resolve(opts.output);
  const raster = await readFile(inputPath);

  const colorPrecision = opts.colorPrecision ?? (opts.variant === 'mono' ? 2 : 6);
  const colorMode = opts.variant === 'mono' ? ColorMode.Binary : ColorMode.Color;

  const rawSvg = await vectorize(raster, {
    colorMode,
    colorPrecision,
    filterSpeckle: opts.filterSpeckle,
    spliceThreshold: 45,
    cornerThreshold: opts.cornerThreshold,
    hierarchical: Hierarchical.Stacked,
    mode: PathSimplifyMode.Spline,
    layerDifference: opts.layerDifference,
    lengthThreshold: 5,
    maxIterations: 2,
    pathPrecision: 5,
  });

  const box = extractSourceBox(rawSvg);
  const transform = fitTo24(box);
  const body = opts.variant === 'mono' ? rewriteToCurrentColor(box.inner) : box.inner;
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="${transform}">${body}</g></svg>\n`;

  await writeFile(outputPath, out, 'utf8');
  if (!opts.quiet) {
    process.stdout.write(
      `${outputPath} — ${opts.variant} variant, source ${box.w}×${box.h} → fit ${transform}\n`,
    );
  }
  return 0;
};

try {
  const code = await main();
  process.exit(typeof code === 'number' ? code : 0);
} catch (err) {
  process.stderr.write(`raster-to-svg: ${err.message}\n`);
  process.exit(1);
}
