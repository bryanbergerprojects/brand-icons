import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

type FontCache = {
  readonly regular: Buffer;
  readonly bold: Buffer;
  readonly black: Buffer;
};

let cache: FontCache | null = null;

const resolveFontPath = (specifier: string): string => fileURLToPath(import.meta.resolve(specifier));

/**
 * Lazily loads the static (non-variable) Inter Tight `.woff` files Satori needs
 * to draw the OG card. The buffers are cached for the whole build so we only
 * touch the filesystem once even when 1k+ icon pages each ask for an OG image.
 *
 * @returns regular (400), bold (700), and black (800) Inter Tight latin buffers
 */
export const loadOgFonts = async (): Promise<FontCache> => {
  if (cache) return cache;
  const [regular, bold, black] = await Promise.all([
    readFile(resolveFontPath('@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff')),
    readFile(resolveFontPath('@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff')),
    readFile(resolveFontPath('@fontsource/inter-tight/files/inter-tight-latin-800-normal.woff')),
  ]);
  cache = { regular, bold, black };
  return cache;
};
