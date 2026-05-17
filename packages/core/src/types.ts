/**
 * Shared types for `@brand-icons/core` and every framework package.
 * Hand-written — never edited by the build pipeline.
 */

export const CATEGORIES = [
  'ai',
  'dev-tools',
  'platforms',
  'productivity',
  'social',
  'communication',
  'design',
  'payments',
  'analytics',
  'e-commerce',
  'search-web',
  'storage-cloud',
  'media',
  'gaming',
  'finance',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Variant = 'color' | 'mono';

export type ColorMode = 'as-is' | 'bw' | 'wb' | 'mono';

export type IconBrandYear = {
  readonly palette: readonly string[];
  readonly source: string;
  readonly notes?: string;
  readonly color: string;
  readonly mono: string;
};

/**
 * Per-year render data — the standalone shape exposed as a named export
 * (e.g. `apple1976`) so a single React component can import only the SVG
 * bytes it needs and the bundler tree-shakes every other millésime.
 *
 * Carries the brand-level fields that the framework runtime needs at
 * render time (`brandColor` for the `background` prop, `slug` for error
 * messages) so it doesn't have to reach into the full brand object.
 */
export type IconBrandYearRender = {
  readonly slug: string;
  readonly name: string;
  readonly brandColor: string;
  readonly year: string;
  readonly palette: readonly string[];
  readonly source: string;
  readonly notes?: string;
  readonly color: string;
  readonly mono: string;
};

export type IconBrand = {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly description: string;
  readonly tags: readonly string[];
  readonly brandColor: string;
  readonly url: string;
  readonly repository?: string;
  readonly license: string;
  readonly aliases: readonly string[];
  readonly parent?: string;
  readonly latest: string;
  readonly addedAt: string;
  readonly updatedAt: string;
  readonly notes?: string;
  readonly years: Readonly<Record<string, IconBrandYear>>;
};

export type ManifestYearSummary = {
  readonly year: string;
  readonly palette: readonly string[];
  readonly source: string;
  readonly notes?: string;
};

export type ManifestEntry = {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly description: string;
  readonly tags: readonly string[];
  readonly brandColor: string;
  readonly url: string;
  readonly repository?: string;
  readonly license: string;
  readonly aliases: readonly string[];
  readonly parent?: string;
  readonly latest: string;
  readonly years: readonly ManifestYearSummary[];
  readonly addedAt: string;
  readonly updatedAt: string;
  readonly notes?: string;
};

export type BrandIconProps = {
  readonly size?: number | string;
  readonly color?: string;
  readonly variant?: Variant;
  readonly mode?: ColorMode;
  readonly background?: boolean | string;
  readonly title?: string;
  readonly className?: string;
};
