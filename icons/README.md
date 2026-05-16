# Icons — source of truth

One folder per brand. Folder name = `slug` (kebab-case ASCII). Each brand
is **year-aware** : SVGs live in `<year>/` subdirectories, metadata is
brand-level.

## Layout

```
icons/<slug>/
├── meta.json              # Brand-level — see .claude/rules/meta.md
└── <year>/                # One subdir per millésime (e.g. 1976, 1998, 2017)
    ├── color.svg          # Official multi-color
    └── mono.svg           # currentColor monochrome
```

## Required files

| File                       | Purpose                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `meta.json`                | Brand-level metadata with `years[]`, `palette[]`, `latest`. Validated by Zod.            |
| `<year>/color.svg`         | Official multi-color SVG. `viewBox="0 0 24 24"`. No editor metadata. Fills as-is.        |
| `<year>/mono.svg`          | Single-color variant. `fill="currentColor"`. Gradients flattened.                        |

Each entry in `meta.years[]` MUST have a matching `<year>/` directory
with both `color.svg` and `mono.svg`. `meta.latest` MUST equal one of
`meta.years[].year`.

## Rules

- Edit by hand only. Generated files in `packages/*/src/icons/` are never edited here.
- New brand = new top-level folder + ≥ 1 `<year>/` subdir. PR + Changeset required.
- New millésime of an existing brand = add `<year>/` subdir + push new entry into `meta.years[]`.
- Run `pnpm build:icons` after any change to regenerate framework packages.
- Validate against schema before commit — see [`.claude/rules/meta.md`](../.claude/rules/meta.md) and [`.claude/rules/svg.md`](../.claude/rules/svg.md).

## Adding via Claude Code

Invoke the agent:

```
Task: icon-fetcher  → produces meta.json + <year>/color.svg + <year>/mono.svg
```

Manual creation also fine — agent is convenience, not requirement.
