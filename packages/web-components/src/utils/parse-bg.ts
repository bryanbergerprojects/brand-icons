type ParseBackgroundInput = {
  background: string | null;
  brandColor: string;
};

/**
 * Resolve the `background` attribute into a concrete CSS color string.
 *
 * `null` / absent → no background. The string `"true"` → brand color.
 * Any other string → used as-is (any CSS color).
 *
 * @returns the fill color to paint behind the icon, or `undefined` to skip
 */
export const parseBackground = (input: ParseBackgroundInput): string | undefined => {
  const { background, brandColor } = input;
  if (background === null) return undefined;
  if (background === '' || background === 'true') return brandColor;
  if (background === 'false') return undefined;
  return background;
};
