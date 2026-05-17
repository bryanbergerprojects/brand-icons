/**
 * Convert a kebab-case slug to camelCase — used for `@brand-icons/core`
 * export names (e.g. `google-meet` → `googleMeet`).
 */
export const slugToCamel = (slug: string): string => slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * Convert a kebab-case slug to PascalCase — used for framework component
 * names (e.g. `google-meet` → `GoogleMeet`).
 */
export const slugToPascal = (slug: string): string => {
  const camel = slugToCamel(slug);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/**
 * Convert a human brand name to a PascalCase identifier — preserves
 * existing capitalization (so `VS Code` → `VSCode`, `GitHub` → `GitHub`,
 * `OpenAI` → `OpenAI`) and strips every non-alphanumeric character.
 */
export const nameToPascal = (name: string): string =>
  name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

/**
 * Build the canonical React component identifier for a given brand + year
 * (e.g. `Apple` + `1976` → `Apple1976Icon`). Year is sanitized to keep the
 * identifier valid even if a future `meta.years` entry uses punctuation.
 */
export const brandYearComponent = (input: { name: string; year: string }): string => {
  const pascal = nameToPascal(input.name);
  const yearSegment = input.year.replace(/[^a-zA-Z0-9]/g, '');
  return `${pascal}${yearSegment}Icon`;
};

/**
 * Build the canonical filename (without extension) for a brand + year.
 */
export const brandYearFile = (input: { name: string; year: string }): string => {
  const pascal = nameToPascal(input.name);
  const yearSegment = input.year.replace(/[^a-zA-Z0-9]/g, '');
  return `${pascal}${yearSegment}`;
};
