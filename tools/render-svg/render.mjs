#!/usr/bin/env node
import { copyFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const parseArgs = (argv) => {
  const out = { width: 256, positional: [] };
  for (const arg of argv) {
    if (arg.startsWith('--width=')) {
      out.width = Number.parseInt(arg.slice('--width='.length), 10);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      out.positional.push(arg);
    }
  }
  if (out.positional.length !== 2) {
    throw new Error('Usage: render-svg <input.svg|raster> <output.png> [--width=256]');
  }
  if (!Number.isFinite(out.width) || out.width <= 0) {
    throw new Error(`Invalid --width: ${out.width}`);
  }
  return out;
};

const main = () => {
  const { width, positional } = parseArgs(process.argv.slice(2));
  const [inputArg, outputArg] = positional;
  const input = resolve(inputArg);
  const output = resolve(outputArg);

  if (!statSync(input, { throwIfNoEntry: false })) {
    throw new Error(`Input not found: ${input}`);
  }

  const ext = extname(input).toLowerCase();

  if (RASTER_EXT.has(ext)) {
    copyFileSync(input, output);
    process.stdout.write(`${output} (raster copy, ${ext})\n`);
    return;
  }

  if (ext !== '.svg') {
    throw new Error(`Unsupported extension: ${ext}`);
  }

  const svg = readFileSync(input, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
  });
  const png = resvg.render().asPng();
  writeFileSync(output, png);
  process.stdout.write(`${output} (${width}px)\n`);
};

try {
  main();
} catch (err) {
  process.stderr.write(`render-svg: ${err.message}\n`);
  process.exit(1);
}
