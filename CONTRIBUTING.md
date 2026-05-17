# Contributing

Thanks for your interest in contributing to Brand Icons!

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Adding a new icon

### Option A — Automated (recommended)

Use the [`icon-fetcher`](./.claude/agents/icon-fetcher.md) Claude Code subagent:

```
/agent icon-fetcher add linear
```

The agent will:

1. Search and download the official SVG (or convert a raster image).
2. Generate the `mono.svg` variant.
3. Create `meta.json` with brand metadata.
4. Validate against the build pipeline.
5. Create a branch and commit the changes.

### Option B — Manual

1. Create `icons/<slug>/` with kebab-case slug (e.g. `linear`).
2. Create at least one millésime subdir `icons/<slug>/<year>/` (e.g. `2024`) containing:
   - `color.svg` — official multi-color logo (24×24 viewBox).
   - `mono.svg` — monochrome version with `fill="currentColor"`.
3. Create `icons/<slug>/meta.json` (brand-level, year-aware):
   - `latest` pointing to one of `years[].year`.
   - `years[]` with `year`, `palette[]`, `source`, optional `notes`.
   - See full schema in [`.claude/rules/meta.md`](./.claude/rules/meta.md).
4. Add additional millésimes by repeating step 2 with new `<year>/` subdirs and pushing entries into `meta.years[]`.
5. Run `pnpm build:icons --icon=<slug>` to validate.
6. Open a PR targeting the `canary` branch and assign it to [@BryanBerger98](https://github.com/BryanBerger98).

## Icon design guidelines

- **viewBox**: `0 0 24 24` whenever possible.
- **`color.svg`**: faithful to brand guidelines, no background unless integral.
- **`mono.svg`**: use `fill="currentColor"`, flatten gradients, single-color.
- **Historic millésimes**: source from Wikimedia Commons, archive.org, brand history pages. Document the source URL per year in `meta.years[].source`.

## Commit conventions

Conventional Commits:

- `feat(icons): add <brand>` — new icon.
- `feat(<pkg>): ...` — feature in a package.
- `fix(<pkg>): ...` — bug fix.
- `docs: ...`, `chore: ...`, `refactor: ...`.

## Pull requests

- Target the `canary` branch.
- Assign the PR to [@BryanBerger98](https://github.com/BryanBerger98) for review.
