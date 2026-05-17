import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Eta } from 'eta';
import { packageSrc } from '../paths';
import { slugToCamel } from '../naming';
import type { IconInput } from '../schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates', 'wc');

const eta = new Eta({
  views: templatesRoot,
  autoEscape: false,
  autoTrim: false,
  cache: false,
});

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

type BrandEntry = {
  year: string;
  constName: string;
};

type Brand = {
  slug: string;
  latest: string;
  entries: BrandEntry[];
  imports: string[];
};

/**
 * Generate `packages/web-components/src/icons/data.ts` — a single bundle
 * file that imports every per-year core export and exposes `lookupIcon` +
 * `resolveYear` for the `<brand-icon>` custom element runtime.
 */
export const generateWc = async (
  inputs: readonly IconInput[],
): Promise<void> => {
  const wcSrc = packageSrc('web-components');
  const iconsDir = path.join(wcSrc, 'icons');
  await mkdir(iconsDir, { recursive: true });

  const brands: Brand[] = inputs.map((input) => {
    const camel = slugToCamel(input.slug);
    const entries: BrandEntry[] = input.meta.years.map((y) => ({
      year: y.year,
      constName: `${camel}${y.year.replace(/[^a-zA-Z0-9]/g, '')}`,
    }));
    return {
      slug: input.slug,
      latest: input.meta.latest,
      entries,
      imports: entries.map((e) => e.constName),
    };
  });

  const sorted = [...brands].sort((a, b) => a.slug.localeCompare(b.slug));

  const rendered = eta.render('./data', { brands: sorted });
  if (typeof rendered !== 'string') {
    throw new Error('wc/data template returned non-string');
  }
  await ensureWrite(path.join(iconsDir, 'data.ts'), rendered);
};
