import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Eta } from 'eta';
import { brandYearFile, slugToCamel } from '../naming';
import { packageSrc } from '../paths';
import type { IconInput } from '../schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates', 'svelte');

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

type BarrelEntry = {
  exportName: string;
  from: string;
};

const brandPascal = (name: string): string => brandYearFile({ name, year: '' });

const renderYearSfc = (input: IconInput, year: string): { content: string; file: string } => {
  const fileName = brandYearFile({ name: input.meta.name, year });
  const yearSegment = year.replace(/[^a-zA-Z0-9]/g, '');
  const data = {
    slug: input.slug,
    year,
    coreYearConstName: `${slugToCamel(input.slug)}${yearSegment}`,
  };
  const rendered = eta.render('./icon-year', data);
  if (typeof rendered !== 'string') {
    throw new Error(`[${input.slug}/${year}] svelte icon-year template returned non-string`);
  }
  return { content: rendered, file: fileName };
};

const renderBarrel = (entries: readonly BarrelEntry[]): string => {
  const sorted = [...entries].sort((a, b) => a.exportName.localeCompare(b.exportName));
  const rendered = eta.render('./index', { files: sorted });
  if (typeof rendered !== 'string') {
    throw new Error('svelte/index template returned non-string');
  }
  return rendered;
};

const pruneStaleFiles = async (iconsDir: string, keep: ReadonlySet<string>): Promise<void> => {
  let entries: string[];
  try {
    entries = await readdir(iconsDir);
  } catch {
    return;
  }
  for (const file of entries) {
    if (!file.endsWith('.svelte')) continue;
    const name = file.replace(/\.svelte$/, '');
    if (keep.has(name)) continue;
    await unlink(path.join(iconsDir, file));
  }
};

/**
 * Generate every file under `packages/svelte/src/icons/`: one `.svelte` SFC
 * per brand-year plus the barrel `index.ts` which re-exports `<Brand>Latest`
 * aliases pointing at `meta.latest`.
 */
export const generateSvelte = async (inputs: readonly IconInput[]): Promise<void> => {
  const svelteSrc = packageSrc('svelte');
  const iconsDir = path.join(svelteSrc, 'icons');
  await mkdir(iconsDir, { recursive: true });

  const barrel: BarrelEntry[] = [];
  const keepFiles = new Set<string>();

  for (const input of inputs) {
    for (const entry of input.meta.years) {
      const { content, file } = renderYearSfc(input, entry.year);
      await ensureWrite(path.join(iconsDir, `${file}.svelte`), content);
      keepFiles.add(file);
      barrel.push({ exportName: `${file}Icon`, from: file });
    }
    const latestFile = brandYearFile({
      name: input.meta.name,
      year: input.meta.latest,
    });
    barrel.push({
      exportName: `${brandPascal(input.meta.name)}LatestIcon`,
      from: latestFile,
    });
  }

  await ensureWrite(path.join(iconsDir, 'index.ts'), renderBarrel(barrel));
  await pruneStaleFiles(iconsDir, keepFiles);
};
