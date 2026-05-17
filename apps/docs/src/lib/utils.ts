import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names with conflict resolution.
 * @param inputs class values to combine
 * @returns merged class name string
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
