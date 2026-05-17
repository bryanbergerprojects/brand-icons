import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Eta } from 'eta';
import { brandYearComponent, brandYearFile, slugToCamel } from '../naming';
import { packageSrc } from '../paths';
import type { IconInput } from '../schema';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(here, '..', 'templates', 'react');

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

type ComponentSpec = {
  componentName: string;
  fileName: string;
};

const brandPascal = (name: string): string => brandYearFile({ name, year: '' });

const aliasComponent = (name: string): string => `${brandPascal(name)}LatestIcon`;
const aliasFile = (name: string): string => `${brandPascal(name)}Latest`;

const renderYearComponent = (
  input: IconInput,
  year: string,
): { content: string; spec: ComponentSpec } => {
  const componentName = brandYearComponent({ name: input.meta.name, year });
  const fileName = brandYearFile({ name: input.meta.name, year });
  const yearSegment = year.replace(/[^a-zA-Z0-9]/g, '');
  const data = {
    slug: input.slug,
    year,
    componentName,
    coreYearConstName: `${slugToCamel(input.slug)}${yearSegment}`,
  };
  const rendered = eta.render('./icon-year', data);
  if (typeof rendered !== 'string') {
    throw new Error(`[${input.slug}/${year}] icon-year template returned non-string`);
  }
  return { content: rendered, spec: { componentName, fileName } };
};

const renderLatestAlias = (input: IconInput): { content: string; spec: ComponentSpec } => {
  const targetComponent = brandYearComponent({
    name: input.meta.name,
    year: input.meta.latest,
  });
  const targetFile = brandYearFile({
    name: input.meta.name,
    year: input.meta.latest,
  });
  const alias = aliasComponent(input.meta.name);
  const file = aliasFile(input.meta.name);
  const data = {
    slug: input.slug,
    latestYear: input.meta.latest,
    targetComponent,
    targetFile,
    aliasComponent: alias,
  };
  const rendered = eta.render('./icon-latest', data);
  if (typeof rendered !== 'string') {
    throw new Error(`[${input.slug}] icon-latest template returned non-string`);
  }
  return { content: rendered, spec: { componentName: alias, fileName: file } };
};

const renderBarrel = (entries: readonly ComponentSpec[]): string => {
  const sorted = [...entries].sort((a, b) => a.fileName.localeCompare(b.fileName));
  const files = sorted.map((entry) => ({
    exportName: entry.componentName,
    from: entry.fileName,
  }));
  const rendered = eta.render('./index', { files });
  if (typeof rendered !== 'string') {
    throw new Error('react/index template returned non-string');
  }
  return rendered;
};

/**
 * Sweep generated icon files that no longer correspond to any brand/year
 * — keeps `src/icons/` in sync after an icon is renamed or removed.
 */
const pruneStaleFiles = async (iconsDir: string, keep: ReadonlySet<string>): Promise<void> => {
  let entries: string[];
  try {
    entries = await readdir(iconsDir);
  } catch {
    return;
  }
  for (const file of entries) {
    if (!file.endsWith('.tsx')) continue;
    const name = file.replace(/\.tsx$/, '');
    if (keep.has(name)) continue;
    await unlink(path.join(iconsDir, file));
  }
};

/**
 * Generate every file under `packages/react/src/icons/`: one .tsx per
 * brand-year (`<Brand><Year>.tsx`), one alias per brand (`<Brand>Latest.tsx`),
 * plus the barrel `index.ts`.
 */
export const generateReact = async (inputs: readonly IconInput[]): Promise<void> => {
  const reactSrc = packageSrc('react');
  const iconsDir = path.join(reactSrc, 'icons');
  await mkdir(iconsDir, { recursive: true });

  const specs: ComponentSpec[] = [];
  const keepFiles = new Set<string>();

  for (const input of inputs) {
    for (const entry of input.meta.years) {
      const { content, spec } = renderYearComponent(input, entry.year);
      await ensureWrite(path.join(iconsDir, `${spec.fileName}.tsx`), content);
      specs.push(spec);
      keepFiles.add(spec.fileName);
    }
    const latest = renderLatestAlias(input);
    await ensureWrite(path.join(iconsDir, `${latest.spec.fileName}.tsx`), latest.content);
    specs.push(latest.spec);
    keepFiles.add(latest.spec.fileName);
  }

  await ensureWrite(path.join(iconsDir, 'index.ts'), renderBarrel(specs));
  keepFiles.add('index');

  await pruneStaleFiles(iconsDir, keepFiles);
};
