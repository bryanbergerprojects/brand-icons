#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compare as odiffCompare } from 'odiff-bin';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import Color from 'colorjs.io';

const HELP = `Icon visual diff — deterministic pixel + palette check.

Usage:
  node tools/icon-diff/diff.mjs --produced=<png> --reference=<png> --output-dir=<dir> [opts]

Required:
  --produced=<path>     Generated icon PNG (e.g. rendered color.svg)
  --reference=<path>    Source-of-truth PNG (e.g. fetcher preview.png)
  --output-dir=<path>   Where to write diff.png + verdict.json

Options:
  --variant=color|mono  Skip color ΔE check when mono (default: color)
  --threshold=<float>   odiff/pixelmatch per-pixel YIQ threshold 0..1 (default: 0.05)
  --delta-e=<float>     Max ΔE 2000 on top palette entries (default: 10)
  --silhouette-blocker=<float>  diff ratio > X = blocker (default: 0.10)
  --silhouette-warning=<float>  diff ratio > X = warning (default: 0.03)
  --quiet               Only emit verdict.json, no stdout JSON

Exit codes:
  0  pass     1  blocker     2  warning     3  tool error
`;

const parseArgs = (argv) => {
  const opts = {
    threshold: 0.05,
    variant: 'color',
    deltaE: 10,
    silhouetteBlocker: 0.10,
    silhouetteWarning: 0.03,
    paletteSize: 5,
    quiet: false,
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--quiet') {
      opts.quiet = true;
    } else if (arg.startsWith('--produced=')) {
      opts.produced = arg.slice('--produced='.length);
    } else if (arg.startsWith('--reference=')) {
      opts.reference = arg.slice('--reference='.length);
    } else if (arg.startsWith('--output-dir=')) {
      opts.outputDir = arg.slice('--output-dir='.length);
    } else if (arg.startsWith('--threshold=')) {
      opts.threshold = Number.parseFloat(arg.slice('--threshold='.length));
    } else if (arg.startsWith('--variant=')) {
      opts.variant = arg.slice('--variant='.length);
    } else if (arg.startsWith('--delta-e=')) {
      opts.deltaE = Number.parseFloat(arg.slice('--delta-e='.length));
    } else if (arg.startsWith('--silhouette-blocker=')) {
      opts.silhouetteBlocker = Number.parseFloat(arg.slice('--silhouette-blocker='.length));
    } else if (arg.startsWith('--silhouette-warning=')) {
      opts.silhouetteWarning = Number.parseFloat(arg.slice('--silhouette-warning='.length));
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  if (opts.help) return opts;
  if (!opts.produced || !opts.reference || !opts.outputDir) {
    throw new Error('Required: --produced=<path> --reference=<path> --output-dir=<dir>');
  }
  if (opts.variant !== 'color' && opts.variant !== 'mono') {
    throw new Error(`Invalid --variant: ${opts.variant} (expected color|mono)`);
  }
  return opts;
};

const loadPng = (path) => PNG.sync.read(readFileSync(path));

const padToSquare = (png, size) => {
  const out = new PNG({ width: size, height: size });
  out.data.fill(0);
  const offsetX = Math.floor((size - png.width) / 2);
  const offsetY = Math.floor((size - png.height) / 2);
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const srcIdx = (y * png.width + x) * 4;
      const dstX = x + offsetX;
      const dstY = y + offsetY;
      if (dstX < 0 || dstY < 0 || dstX >= size || dstY >= size) continue;
      const dstIdx = (dstY * size + dstX) * 4;
      out.data[dstIdx] = png.data[srcIdx];
      out.data[dstIdx + 1] = png.data[srcIdx + 1];
      out.data[dstIdx + 2] = png.data[srcIdx + 2];
      out.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return out;
};

const hex = (r, g, b) =>
  `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`;

const extractPalette = (png, maxEntries) => {
  const buckets = new Map();
  const total = png.width * png.height;
  let opaqueCount = 0;
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const a = png.data[idx + 3];
    if (a < 128) continue;
    opaqueCount++;
    const r = Math.round(png.data[idx] / 51) * 51;
    const g = Math.round(png.data[idx + 1] / 51) * 51;
    const b = Math.round(png.data[idx + 2] / 51) * 51;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const denom = opaqueCount > 0 ? opaqueCount : 1;
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxEntries)
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { hex: hex(r, g, b), weight: count / denom };
    });
};

const maxDeltaE2000 = (paletteA, paletteB) => {
  const cap = Math.min(paletteA.length, paletteB.length, 3);
  if (cap === 0) return 0;
  let max = 0;
  for (let i = 0; i < cap; i++) {
    const ca = new Color(paletteA[i].hex);
    const cb = new Color(paletteB[i].hex);
    const dE = ca.deltaE(cb, '2000');
    if (dE > max) max = dE;
  }
  return max;
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const producedPath = resolve(opts.produced);
  const referencePath = resolve(opts.reference);
  const outputDir = resolve(opts.outputDir);
  mkdirSync(outputDir, { recursive: true });

  const producedPng = loadPng(producedPath);
  const referencePng = loadPng(referencePath);

  const targetSize = Math.max(
    producedPng.width,
    producedPng.height,
    referencePng.width,
    referencePng.height,
    256,
  );
  const producedSquare = padToSquare(producedPng, targetSize);
  const referenceSquare = padToSquare(referencePng, targetSize);

  const producedSquarePath = join(outputDir, 'produced.square.png');
  const referenceSquarePath = join(outputDir, 'reference.square.png');
  const diffPath = join(outputDir, 'diff.png');
  writeFileSync(producedSquarePath, PNG.sync.write(producedSquare));
  writeFileSync(referenceSquarePath, PNG.sync.write(referenceSquare));

  const odiffResult = await odiffCompare(producedSquarePath, referenceSquarePath, diffPath, {
    threshold: opts.threshold,
    antialiasing: true,
  });

  const totalPixels = targetSize * targetSize;
  const diffBuf = new PNG({ width: targetSize, height: targetSize });
  const diffCount = pixelmatch(
    producedSquare.data,
    referenceSquare.data,
    diffBuf.data,
    targetSize,
    targetSize,
    { threshold: opts.threshold, alpha: 0.3, includeAA: false },
  );
  const diffRatio = diffCount / totalPixels;

  const producedPalette = extractPalette(producedSquare, opts.paletteSize);
  const referencePalette = extractPalette(referenceSquare, opts.paletteSize);
  const dE = maxDeltaE2000(producedPalette, referencePalette);

  const issues = [];

  if (diffRatio > opts.silhouetteBlocker) {
    issues.push({
      severity: 'blocker',
      code: 'silhouette_diff',
      message: `Pixel diff ratio ${(diffRatio * 100).toFixed(2)}% exceeds ${(opts.silhouetteBlocker * 100).toFixed(1)}% — likely missing element / mirror / deformation.`,
    });
  } else if (diffRatio > opts.silhouetteWarning) {
    issues.push({
      severity: 'warning',
      code: 'silhouette_drift',
      message: `Pixel diff ratio ${(diffRatio * 100).toFixed(2)}% above ${(opts.silhouetteWarning * 100).toFixed(1)}% — sub-pixel drift or minor shape variance.`,
    });
  }

  if (opts.variant === 'color') {
    if (dE > opts.deltaE) {
      issues.push({
        severity: 'blocker',
        code: 'hue_mismatch',
        message: `Max ΔE2000 on top palette entries = ${dE.toFixed(2)} exceeds ${opts.deltaE} — wrong brand color.`,
      });
    } else if (dE > 5) {
      issues.push({
        severity: 'warning',
        code: 'hue_drift',
        message: `Max ΔE2000 = ${dE.toFixed(2)} — color drift, verify against brand guidelines.`,
      });
    }
  }

  const blocker = issues.some((i) => i.severity === 'blocker');
  const warning = issues.some((i) => i.severity === 'warning');
  const severity = blocker ? 'blocker' : warning ? 'warning' : 'pass';

  const verdict = {
    pass: !blocker,
    severity,
    variant: opts.variant,
    thresholds: {
      pixelmatch: opts.threshold,
      deltaE2000: opts.deltaE,
      silhouetteBlocker: opts.silhouetteBlocker,
      silhouetteWarning: opts.silhouetteWarning,
    },
    checks: {
      odiff: {
        match: odiffResult.match === true,
        reason: odiffResult.match === true ? null : (odiffResult.reason ?? null),
        diffPercentage:
          typeof odiffResult.diffPercentage === 'number' ? odiffResult.diffPercentage : null,
        diffCount: typeof odiffResult.diffCount === 'number' ? odiffResult.diffCount : null,
      },
      pixelmatch: {
        diffPixels: diffCount,
        totalPixels,
        ratio: diffRatio,
      },
      palette: {
        produced: producedPalette,
        reference: referencePalette,
        maxDeltaE2000: dE,
      },
    },
    artifacts: {
      diff: diffPath,
      producedSquare: producedSquarePath,
      referenceSquare: referenceSquarePath,
    },
    issues,
  };

  writeFileSync(join(outputDir, 'verdict.json'), JSON.stringify(verdict, null, 2));
  if (!opts.quiet) {
    process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
  }

  return blocker ? 1 : warning ? 2 : 0;
};

try {
  const code = await main();
  process.exit(typeof code === 'number' ? code : 0);
} catch (err) {
  process.stderr.write(`icon-diff: ${err.message}\n`);
  process.exit(3);
}
