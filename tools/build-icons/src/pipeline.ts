import { watch } from 'node:fs';
import { listIconSlugs, readIconDir } from './fs';
import type { CoreIconInput } from './generators/core';
import { generateCore } from './generators/core';
import { generateReact } from './generators/react';
import { generateSvelte } from './generators/svelte';
import { generateVue } from './generators/vue';
import { generateWc } from './generators/wc';
import { optimize } from './optimize';
import { comparePalettes, extractPalette } from './palette';
import { iconsRoot } from './paths';
import type { IconInput, IconMeta } from './schema';
import { validateParents } from './schema';

export type PipelineOptions = {
  iconFilter: string | undefined;
  yearFilter: string | undefined;
  watch: boolean;
};

const buildCoreInput = (input: IconInput, yearFilter: string | undefined): CoreIconInput => {
  if (yearFilter !== undefined && !input.meta.years.some((y) => y.year === yearFilter)) {
    throw new Error(
      `[${input.slug}] --year=${yearFilter} not in meta.years (` +
        `${input.meta.years.map((y) => y.year).join(', ')})`,
    );
  }

  const perYearOptimized: Record<string, { color: string; mono: string; palette: string[] }> = {};
  for (const entry of input.meta.years) {
    const raw = input.perYear[entry.year];
    if (!raw) {
      throw new Error(`[${input.slug}/${entry.year}] raw SVGs missing`);
    }
    const color = optimize(raw.color, 'color');
    const mono = optimize(raw.mono, 'mono');
    const extracted = extractPalette(color);
    const palette = extracted.length > 0 ? extracted : [...entry.palette];
    const diff = comparePalettes(entry.palette, extracted);
    const focused = yearFilter === undefined || yearFilter === entry.year;
    if (focused && diff.divergence > 1) {
      process.stderr.write(
        `[${input.slug}/${entry.year}] palette divergence ${diff.divergence}: ` +
          `declared=[${diff.declared.join(', ')}] extracted=[${diff.extracted.join(', ')}]\n`,
      );
    }
    perYearOptimized[entry.year] = { color, mono, palette };
  }
  return { ...input, perYearOptimized };
};

const runOnce = async (options: PipelineOptions): Promise<void> => {
  const { iconFilter, yearFilter } = options;

  if (yearFilter !== undefined && iconFilter === undefined) {
    throw new Error('--year requires --icon');
  }

  const allSlugs = await listIconSlugs();
  const slugs = iconFilter !== undefined ? allSlugs.filter((s) => s === iconFilter) : allSlugs;
  if (iconFilter !== undefined && slugs.length === 0) {
    throw new Error(`unknown icon "${iconFilter}"`);
  }

  const inputs: IconInput[] = [];
  for (const slug of slugs) {
    inputs.push(await readIconDir(slug));
  }

  const metas = new Map<string, IconMeta>(inputs.map((i) => [i.slug, i.meta]));
  const parentIssues = validateParents(metas);
  if (parentIssues.length > 0) {
    const lines = parentIssues.map((p) => `  • [${p.slug}] ${p.message}`);
    throw new Error(`parent refinement failed:\n${lines.join('\n')}`);
  }

  const coreInputs = inputs.map((i) => buildCoreInput(i, yearFilter));

  process.stdout.write(`build-icons: optimizing ${coreInputs.length} brand(s)…\n`);
  await generateCore(coreInputs);
  process.stdout.write(
    `build-icons: generated packages/core/src/icons/*.ts + manifest.ts (${coreInputs.length} brand(s))\n`,
  );
  await generateReact(inputs);
  process.stdout.write(
    `build-icons: generated packages/react/src/icons/*.tsx (${coreInputs.length} brand(s))\n`,
  );
  await generateVue(inputs);
  process.stdout.write(
    `build-icons: generated packages/vue/src/icons/*.vue (${coreInputs.length} brand(s))\n`,
  );
  await generateSvelte(inputs);
  process.stdout.write(
    `build-icons: generated packages/svelte/src/icons/*.svelte (${coreInputs.length} brand(s))\n`,
  );
  await generateWc(inputs);
  process.stdout.write(
    `build-icons: generated packages/web-components/src/icons/data.ts (${coreInputs.length} brand(s))\n`,
  );
};

const watchPipeline = async (options: PipelineOptions): Promise<void> => {
  await runOnce(options);
  process.stdout.write(`build-icons: watching ${iconsRoot}…\n`);

  let pending = false;
  let inFlight: Promise<void> = Promise.resolve();
  const trigger = (): void => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      inFlight = inFlight
        .then(() => runOnce(options))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          process.stderr.write(`build-icons: ${message}\n`);
        });
    }, 150);
  };

  const watcher = watch(iconsRoot, { recursive: true }, () => trigger());

  await new Promise<void>((resolve) => {
    process.once('SIGINT', () => {
      watcher.close();
      resolve();
    });
    process.once('SIGTERM', () => {
      watcher.close();
      resolve();
    });
  });
};

/**
 * Orchestrates the full build pipeline: read icons/, validate meta, optimize
 * SVGs, extract palette, render templates, write generated package sources.
 */
export const runPipeline = async (options: PipelineOptions): Promise<void> => {
  if (options.watch) {
    await watchPipeline(options);
    return;
  }
  await runOnce(options);
};
