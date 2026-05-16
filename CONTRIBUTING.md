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
2. Generate `mono.svg` and `custom.svg` variants.
3. Create `meta.json` with brand metadata.
4. Validate against the build pipeline.
5. Create a branch, commit, and changeset.

### Option B — Manual

1. Create `icons/<slug>/` with kebab-case slug (e.g. `linear`).
2. Add the following files:
   - `color.svg` — official multi-color logo (24×24 viewBox).
   - `mono.svg` — monochrome version with `fill="currentColor"`.
   - `custom.svg` — Lucide-style stroke 1.5px reinterpretation.
   - `meta.json` — see schema in [PLAN.md §5.2](./PLAN.md).
3. Run `pnpm build:icons --icon=<slug>` to validate.
4. Run `pnpm changeset` and select the affected packages.
5. Open a PR.

## Icon design guidelines

- **viewBox**: `0 0 24 24` whenever possible.
- **`color.svg`**: faithful to brand guidelines, no background unless integral.
- **`mono.svg`**: use `fill="currentColor"`, flatten gradients, single-color.
- **`custom.svg`**: stroke `currentColor`, `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, no fill. Style consistent with Lucide.

## Commit conventions

Conventional Commits:

- `feat(icons): add <brand>` — new icon.
- `feat(<pkg>): ...` — feature in a package.
- `fix(<pkg>): ...` — bug fix.
- `docs: ...`, `chore: ...`, `refactor: ...`.

## Releases

We use [Changesets](https://github.com/changesets/changesets). Run `pnpm changeset`
after your change and follow the prompts.
