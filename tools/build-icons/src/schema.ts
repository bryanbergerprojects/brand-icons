import { z } from 'zod';
import { Category } from './category';

const hexValidation = z
  .string()
  .regex(/^#[0-9A-F]{6}$/, 'must be uppercase #RRGGBB hex');

const slugValidation = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case ASCII');

const isoDateValidation = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be ISO YYYY-MM-DD');

const yearStringValidation = z.string().regex(/^\d{4}$/, 'year must be 4 digits');

export const yearEntryValidation = z
  .object({
    year: yearStringValidation,
    palette: z.array(hexValidation).min(1).max(12),
    source: z.string().url(),
    notes: z.string().optional(),
  })
  .strict();

export type YearEntry = z.infer<typeof yearEntryValidation>;

const variantValidation = z.enum(['color', 'mono']);
export type Variant = z.infer<typeof variantValidation>;

const colorModeValidation = z.enum(['as-is', 'bw', 'wb', 'mono']);
export type ColorMode = z.infer<typeof colorModeValidation>;

const LICENSE_LITERAL = 'Trademark — usage for identification (fair use)';

export const metaValidation = z
  .object({
    slug: slugValidation,
    name: z.string().min(1),
    category: z.nativeEnum(Category),
    description: z
      .string()
      .min(20)
      .max(200)
      .regex(/\.$/, 'description must end with a period'),
    tags: z
      .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
      .min(5)
      .max(10),
    brandColor: hexValidation,
    url: z.string().url(),
    repository: z.string().url().optional(),
    license: z.literal(LICENSE_LITERAL),
    aliases: z.array(slugValidation).default([]),
    parent: slugValidation.optional(),
    latest: yearStringValidation,
    years: z.array(yearEntryValidation).min(1),
    addedAt: isoDateValidation,
    updatedAt: isoDateValidation,
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((meta, ctx) => {
    if (!meta.years.some((y) => y.year === meta.latest)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latest'],
        message: `latest "${meta.latest}" not found in years[]`,
      });
    }

    const seen = new Set<string>();
    let previous: string | undefined;
    for (const [index, entry] of meta.years.entries()) {
      if (seen.has(entry.year)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['years', index, 'year'],
          message: `duplicate year "${entry.year}"`,
        });
      }
      seen.add(entry.year);
      if (previous !== undefined && entry.year < previous) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['years', index, 'year'],
          message: `years must be sorted ascending (${entry.year} after ${previous})`,
        });
      }
      previous = entry.year;
    }

    if (meta.parent !== undefined && meta.parent === meta.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parent'],
        message: 'parent cannot equal slug',
      });
    }
  });

export type IconMeta = z.infer<typeof metaValidation>;

const variantSvgValidation = z
  .object({
    color: z.string(),
    mono: z.string(),
  })
  .strict();

export const iconInputValidation = z
  .object({
    slug: slugValidation,
    meta: metaValidation,
    perYear: z.record(yearStringValidation, variantSvgValidation),
  })
  .strict()
  .superRefine((input, ctx) => {
    const yearsInMeta = new Set(input.meta.years.map((y) => y.year));
    const yearsOnDisk = new Set(Object.keys(input.perYear));
    for (const year of yearsInMeta) {
      if (!yearsOnDisk.has(year)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['perYear', year],
          message: `meta.years lists "${year}" but icons/${input.slug}/${year}/ missing on disk`,
        });
      }
    }
    for (const year of yearsOnDisk) {
      if (!yearsInMeta.has(year)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['perYear', year],
          message: `icons/${input.slug}/${year}/ exists but not declared in meta.years`,
        });
      }
    }
  });

export type IconInput = z.infer<typeof iconInputValidation>;

export type ParentValidationIssue = {
  slug: string;
  message: string;
};

/**
 * Cross-manifest refinement for `meta.parent`. Run after every individual
 * meta has been validated; checks that each `parent` resolves to a known
 * slug in the batch and that the target itself has no `parent` (one level).
 *
 * @param metas all validated metas keyed by slug
 * @returns array of issues — empty when batch is consistent
 */
export const validateParents = (
  metas: ReadonlyMap<string, IconMeta>,
): ParentValidationIssue[] => {
  const issues: ParentValidationIssue[] = [];
  for (const [slug, meta] of metas) {
    if (meta.parent === undefined) continue;
    const target = metas.get(meta.parent);
    if (target === undefined) {
      issues.push({
        slug,
        message: `parent "${meta.parent}" does not resolve to a known brand`,
      });
      continue;
    }
    if (target.parent !== undefined) {
      issues.push({
        slug,
        message: `parent "${meta.parent}" itself has a parent — only one level allowed`,
      });
    }
  }
  return issues;
};
