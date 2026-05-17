import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Eta } from 'eta';
import { packageSrc } from '../paths';
import { slugToCamel } from '../naming';
import type { IconInput } from '../schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates', 'core');

const eta = new Eta({
  views: templatesRoot,
  autoEscape: false,
  autoTrim: false,
  cache: false,
});

export type CoreIconInput = IconInput & {
  perYearOptimized: Record<string, { color: string; mono: string; palette: string[] }>;
};

const json = (value: unknown): string => JSON.stringify(value);

const ensureWrite = async (file: string, content: string): Promise<void> => {
  await mkdir(path.dirname(file), { recursive: true });
  let prior = '';
  try {
    prior = await readFile(file, 'utf8');
  } catch {
    /* file doesn't exist yet */
  }
  if (prior !== content) {
    await writeFile(file, content, 'utf8');
  }
};

const renderIcon = (input: CoreIconInput): string => {
  const { slug, meta, perYearOptimized } = input;
  const constName = slugToCamel(slug);
  const years = meta.years.map((entry) => {
    const optimized = perYearOptimized[entry.year];
    if (!optimized) {
      throw new Error(`[${slug}/${entry.year}] optimized SVGs missing`);
    }
    return {
      year: entry.year,
      yearConstName: `${constName}${entry.year.replace(/[^a-zA-Z0-9]/g, '')}`,
      paletteJson: json(optimized.palette),
      sourceJson: json(entry.source),
      notesJson: entry.notes !== undefined ? json(entry.notes) : null,
      colorJson: json(optimized.color),
      monoJson: json(optimized.mono),
    };
  });

  const data = {
    slug,
    constName,
    json: {
      slug: json(meta.slug),
      name: json(meta.name),
      category: json(meta.category),
      description: json(meta.description),
      tags: json(meta.tags),
      brandColor: json(meta.brandColor),
      url: json(meta.url),
      repository: meta.repository !== undefined ? json(meta.repository) : null,
      license: json(meta.license),
      aliases: json(meta.aliases),
      parent: meta.parent !== undefined ? json(meta.parent) : null,
      latest: json(meta.latest),
      addedAt: json(meta.addedAt),
      updatedAt: json(meta.updatedAt),
      notes: meta.notes !== undefined ? json(meta.notes) : null,
    },
    years,
  };

  const rendered = eta.render('./icon', data);
  if (typeof rendered !== 'string') {
    throw new Error(`[${slug}] icon template returned non-string`);
  }
  return rendered;
};

const renderManifest = (inputs: readonly CoreIconInput[]): string => {
  const entries = inputs.map((input) => {
    const { meta } = input;
    const yearSummaries = meta.years.map((y) => ({
      year: y.year,
      palette: y.palette,
      source: y.source,
      ...(y.notes !== undefined ? { notes: y.notes } : {}),
    }));
    return {
      slug: json(meta.slug),
      name: json(meta.name),
      category: json(meta.category),
      description: json(meta.description),
      tags: json(meta.tags),
      brandColor: json(meta.brandColor),
      url: json(meta.url),
      repository: meta.repository !== undefined ? json(meta.repository) : null,
      license: json(meta.license),
      aliases: json(meta.aliases),
      parent: meta.parent !== undefined ? json(meta.parent) : null,
      latest: json(meta.latest),
      years: json(yearSummaries),
      addedAt: json(meta.addedAt),
      updatedAt: json(meta.updatedAt),
      notes: meta.notes !== undefined ? json(meta.notes) : null,
    };
  });
  const rendered = eta.render('./manifest', { entries });
  if (typeof rendered !== 'string') {
    throw new Error('manifest template returned non-string');
  }
  return rendered;
};

const renderBarrel = (slugs: readonly string[]): string => {
  const rendered = eta.render('./index', {
    slugs,
    constNameFor: slugToCamel,
  });
  if (typeof rendered !== 'string') {
    throw new Error('index template returned non-string');
  }
  return rendered;
};

/**
 * Generate every file under `packages/core/src/icons/` plus the
 * top-level `packages/core/src/manifest.ts`.
 *
 * @param inputs full set of icon inputs (one per brand) with optimized SVGs
 */
export const generateCore = async (inputs: readonly CoreIconInput[]): Promise<void> => {
  const coreSrc = packageSrc('core');
  const iconsDir = path.join(coreSrc, 'icons');
  await mkdir(iconsDir, { recursive: true });

  for (const input of inputs) {
    const file = path.join(iconsDir, `${input.slug}.ts`);
    await ensureWrite(file, renderIcon(input));
  }

  const slugs = inputs.map((i) => i.slug);
  await ensureWrite(path.join(iconsDir, 'index.ts'), renderBarrel(slugs));
  await ensureWrite(path.join(coreSrc, 'manifest.ts'), renderManifest(inputs));
};
