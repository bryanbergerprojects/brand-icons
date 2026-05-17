import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { iconsRoot, brandDir, yearDir, metaFile } from './paths';
import { iconInputValidation, metaValidation } from './schema';
import type { IconInput, IconMeta } from './schema';

const isDir = async (p: string): Promise<boolean> => {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
};

const isFile = async (p: string): Promise<boolean> => {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
};

/**
 * List every brand slug present under `icons/`. Filters out files (e.g.
 * `.DS_Store`) and ensures the directory carries a `meta.json`.
 *
 * @returns brand slugs sorted alphabetically
 */
export const listIconSlugs = async (): Promise<string[]> => {
  const entries = await readdir(iconsRoot, { withFileTypes: true });
  const slugs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const meta = metaFile(entry.name);
    if (await isFile(meta)) slugs.push(entry.name);
  }
  return slugs.sort();
};

/**
 * Parse and validate `icons/<slug>/meta.json`.
 *
 * @param slug brand slug — must match parent directory name
 * @returns validated brand-level metadata
 * @throws when JSON is malformed or fails Zod validation
 */
export const readMeta = async (slug: string): Promise<IconMeta> => {
  const file = metaFile(slug);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[${slug}] cannot read ${file}: ${message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[${slug}] invalid JSON in ${file}: ${message}`);
  }
  const result = metaValidation.safeParse(parsed);
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  • ${i.path.join('.')}: ${i.message}`,
    );
    throw new Error(`[${slug}] meta.json validation failed:\n${lines.join('\n')}`);
  }
  if (result.data.slug !== slug) {
    throw new Error(
      `[${slug}] meta.slug "${result.data.slug}" does not match directory name`,
    );
  }
  return result.data;
};

/**
 * Read every year directory of a brand, returning the color+mono SVG strings.
 * Fails loudly when a year subdir or one of the two variants is missing.
 *
 * @param slug brand slug
 * @param meta already-validated meta describing the years to read
 * @returns map from year to `{ color, mono }` raw SVG strings
 */
const readPerYear = async (
  slug: string,
  meta: IconMeta,
): Promise<Record<string, { color: string; mono: string }>> => {
  const perYear: Record<string, { color: string; mono: string }> = {};
  for (const entry of meta.years) {
    const dir = yearDir(slug, entry.year);
    if (!(await isDir(dir))) {
      throw new Error(`[${slug}/${entry.year}] missing directory ${dir}`);
    }
    const colorPath = path.join(dir, 'color.svg');
    const monoPath = path.join(dir, 'mono.svg');
    if (!(await isFile(colorPath))) {
      throw new Error(`[${slug}/${entry.year}] missing ${colorPath}`);
    }
    if (!(await isFile(monoPath))) {
      throw new Error(`[${slug}/${entry.year}] missing ${monoPath}`);
    }
    const [color, mono] = await Promise.all([
      readFile(colorPath, 'utf8'),
      readFile(monoPath, 'utf8'),
    ]);
    perYear[entry.year] = { color, mono };
  }
  return perYear;
};

/**
 * Read a full brand directory: meta + every year's color+mono SVG.
 * Cross-checks meta.years[] against the disk contents.
 *
 * @param slug brand slug
 * @returns validated `IconInput` ready to feed the pipeline
 */
export const readIconDir = async (slug: string): Promise<IconInput> => {
  const dir = brandDir(slug);
  if (!(await isDir(dir))) {
    throw new Error(`[${slug}] icons/${slug}/ does not exist`);
  }
  const meta = await readMeta(slug);
  const perYear = await readPerYear(slug, meta);
  const result = iconInputValidation.safeParse({ slug, meta, perYear });
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  • ${i.path.join('.')}: ${i.message}`,
    );
    throw new Error(`[${slug}] icon input validation failed:\n${lines.join('\n')}`);
  }
  return result.data;
};
