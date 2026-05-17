/**
 * Normalize a `size` attribute string to a CSS dimension for `width`/`height`.
 *
 * Numeric strings (e.g. `"32"`) pass through (treated as pixels by the
 * SVG attribute). Any CSS length string (`"2rem"`, `"1em"`) is preserved.
 * `null` / empty → `"1em"`.
 *
 * @returns CSS length string consumable by the `width` / `height` SVG attributes
 */
export const parseSize = (size: string | null): string => {
  if (size === null || size === '') return '1em';
  return size;
};
