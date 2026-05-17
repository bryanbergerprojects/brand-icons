import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the monorepo root (resolved from this file). */
export const repoRoot = path.resolve(here, '..', '..', '..');

/** Absolute path to the `icons/` source-of-truth directory. */
export const iconsRoot = path.join(repoRoot, 'icons');

/** Absolute path to a single brand directory. */
export const brandDir = (slug: string): string => path.join(iconsRoot, slug);

/** Absolute path to a single year directory inside a brand. */
export const yearDir = (slug: string, year: string): string => path.join(iconsRoot, slug, year);

/** Absolute path to a brand's meta.json. */
export const metaFile = (slug: string): string => path.join(iconsRoot, slug, 'meta.json');

/** Absolute path to a generated package's source root. */
export const packageSrc = (pkg: string): string => path.join(repoRoot, 'packages', pkg, 'src');
