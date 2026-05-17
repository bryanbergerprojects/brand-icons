type ParseBackgroundInput = {
  background: boolean | string | undefined;
  brandColor: string;
};

/**
 * Resolve the `background` prop into a concrete CSS color string.
 *
 * `false` / `undefined` → no background. `true` → the brand's official color.
 * A string → used as-is (any CSS color).
 *
 * @returns the fill color to paint behind the icon, or `undefined` to skip
 */
export const parseBackground = (input: ParseBackgroundInput): string | undefined => {
  const { background, brandColor } = input;
  if (background === undefined || background === false) return undefined;
  if (background === true) return brandColor;
  return background;
};
