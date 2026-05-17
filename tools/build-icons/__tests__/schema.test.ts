import { describe, expect, it } from 'vitest';
import {
  metaValidation,
  validateParents,
  iconInputValidation,
} from '../src/schema';
import type { IconMeta } from '../src/schema';

const baseMeta = {
  slug: 'apple',
  name: 'Apple',
  category: 'platforms',
  description: 'Apple is a technology company designing consumer electronics.',
  tags: ['hardware', 'macos', 'ios', 'consumer', 'cupertino'],
  brandColor: '#000000',
  url: 'https://apple.com',
  license: 'Trademark — usage for identification (fair use)',
  aliases: [],
  latest: '2017',
  years: [
    {
      year: '1976',
      palette: ['#75BD21'],
      source: 'https://example.com/apple-1976.svg',
    },
    {
      year: '2017',
      palette: ['#000000'],
      source: 'https://example.com/apple-2017.svg',
    },
  ],
  addedAt: '2026-05-16',
  updatedAt: '2026-05-16',
};

describe('metaValidation', () => {
  it('accepts a valid meta', () => {
    const result = metaValidation.safeParse(baseMeta);
    expect(result.success).toBe(true);
  });

  it('rejects when latest is not in years[]', () => {
    const result = metaValidation.safeParse({ ...baseMeta, latest: '1999' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('latest "1999"');
    }
  });

  it('rejects unsorted years', () => {
    const result = metaValidation.safeParse({
      ...baseMeta,
      years: [
        baseMeta.years[1],
        baseMeta.years[0],
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate years', () => {
    const result = metaValidation.safeParse({
      ...baseMeta,
      latest: '1976',
      years: [baseMeta.years[0], baseMeta.years[0]],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty palette', () => {
    const result = metaValidation.safeParse({
      ...baseMeta,
      years: [{ ...baseMeta.years[0], palette: [] }, baseMeta.years[1]],
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed brandColor', () => {
    expect(metaValidation.safeParse({ ...baseMeta, brandColor: '#abc' }).success).toBe(false);
    expect(metaValidation.safeParse({ ...baseMeta, brandColor: '#000fff' }).success).toBe(false);
    expect(metaValidation.safeParse({ ...baseMeta, brandColor: 'black' }).success).toBe(false);
  });

  it('rejects too-few tags', () => {
    const result = metaValidation.safeParse({ ...baseMeta, tags: ['a', 'b', 'c'] });
    expect(result.success).toBe(false);
  });

  it('rejects wrong license literal', () => {
    const result = metaValidation.safeParse({ ...baseMeta, license: 'MIT' });
    expect(result.success).toBe(false);
  });

  it('rejects description not ending with a period', () => {
    const result = metaValidation.safeParse({
      ...baseMeta,
      description: 'Apple is a technology company that designs hardware',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateParents', () => {
  const parsed = (raw: object): IconMeta => {
    const r = metaValidation.safeParse(raw);
    if (!r.success) throw new Error('fixture invalid');
    return r.data;
  };

  it('passes when no parent references', () => {
    const metas = new Map<string, IconMeta>([['apple', parsed(baseMeta)]]);
    expect(validateParents(metas)).toEqual([]);
  });

  it('passes when parent resolves', () => {
    const google = parsed({
      ...baseMeta,
      slug: 'google',
      name: 'Google',
      tags: ['search', 'web', 'ads', 'cloud', 'mobile'],
      url: 'https://google.com',
      brandColor: '#4285F4',
      description: 'Search engine and cloud provider operated by Alphabet.',
    });
    const meet = parsed({
      ...baseMeta,
      slug: 'google-meet',
      name: 'Google Meet',
      parent: 'google',
      tags: ['video', 'meeting', 'call', 'cloud', 'collab'],
      url: 'https://meet.google.com',
      brandColor: '#00897B',
      description: 'Video meeting product part of the Google Workspace suite.',
    });
    const metas = new Map<string, IconMeta>([
      ['google', google],
      ['google-meet', meet],
    ]);
    expect(validateParents(metas)).toEqual([]);
  });

  it('flags unresolved parent', () => {
    const orphan = parsed({
      ...baseMeta,
      slug: 'orphan',
      name: 'Orphan',
      parent: 'missing',
      tags: ['a', 'b', 'c', 'd', 'e'],
      description: 'Orphan brand with a parent that does not exist anywhere.',
    });
    const metas = new Map<string, IconMeta>([['orphan', orphan]]);
    const issues = validateParents(metas);
    expect(issues.length).toBe(1);
    expect(issues[0]?.message).toContain('does not resolve');
  });

  it('flags transitive parent (one level only)', () => {
    const a = parsed({
      ...baseMeta,
      slug: 'a-brand',
      name: 'A',
      tags: ['a1', 'a2', 'a3', 'a4', 'a5'],
      description: 'Grandparent brand at the top of the hierarchy here.',
    });
    const b = parsed({
      ...baseMeta,
      slug: 'b-brand',
      name: 'B',
      parent: 'a-brand',
      tags: ['b1', 'b2', 'b3', 'b4', 'b5'],
      description: 'Middle brand that itself has a parent named a-brand.',
    });
    const c = parsed({
      ...baseMeta,
      slug: 'c-brand',
      name: 'C',
      parent: 'b-brand',
      tags: ['c1', 'c2', 'c3', 'c4', 'c5'],
      description: 'Grandchild brand pointing at parent b-brand here too.',
    });
    const metas = new Map<string, IconMeta>([
      ['a-brand', a],
      ['b-brand', b],
      ['c-brand', c],
    ]);
    const issues = validateParents(metas);
    expect(issues.length).toBe(1);
    expect(issues[0]?.slug).toBe('c-brand');
  });
});

describe('iconInputValidation', () => {
  const meta = metaValidation.parse(baseMeta);

  it('passes when meta.years matches perYear', () => {
    const result = iconInputValidation.safeParse({
      slug: 'apple',
      meta,
      perYear: {
        '1976': { color: '<svg/>', mono: '<svg/>' },
        '2017': { color: '<svg/>', mono: '<svg/>' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('fails when a meta.years entry is missing on disk', () => {
    const result = iconInputValidation.safeParse({
      slug: 'apple',
      meta,
      perYear: {
        '1976': { color: '<svg/>', mono: '<svg/>' },
      },
    });
    expect(result.success).toBe(false);
  });

  it('fails when an extra year exists on disk', () => {
    const result = iconInputValidation.safeParse({
      slug: 'apple',
      meta,
      perYear: {
        '1976': { color: '<svg/>', mono: '<svg/>' },
        '2017': { color: '<svg/>', mono: '<svg/>' },
        '2099': { color: '<svg/>', mono: '<svg/>' },
      },
    });
    expect(result.success).toBe(false);
  });
});
