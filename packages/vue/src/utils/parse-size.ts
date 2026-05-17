/**
 * Normalize a `size` prop to a CSS dimension string for `width`/`height`.
 *
 * @param size number (treated as pixels) or string (any CSS length); `undefined` falls back to `1em`
 * @returns CSS length string consumable by the `width` / `height` SVG attributes
 */
export const parseSize = (size: number | string | undefined): string => {
  if (size === undefined) return '1em';
  if (typeof size === 'number') return `${size}`;
  return size;
};
