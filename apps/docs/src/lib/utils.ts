import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['mono', 'mono-xs', 'mono-sm', '13', 'brand', 'stat', 'h3', 'h2', 'h1', 'h1-xl', 'h1-2xl', 'canvas'] }],
    },
  },
});

/**
 * Merges Tailwind class names with conflict resolution.
 * @param inputs class values to combine
 * @returns merged class name string
 */
export const cn = (...inputs: ClassValue[]): string => customMerge(clsx(inputs));
