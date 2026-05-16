# Brand Icons — Claude Code context

Multi-variant, multi-framework brand icons library. Monorepo pnpm + Turborepo.

## Stack

- **Monorepo**: pnpm 10 workspaces + Turborepo 2 + Changesets
- **Packages**: tsup (esbuild) + TypeScript strict + Vitest, all ESM-only
- **Lint/format**: Biome (single tool, no ESLint + Prettier)
- **Frameworks shipped**: React 19, Vue 3.5, Svelte 5, Web Components
- **Docs site** (`apps/docs`): Next.js 15 App Router + Tailwind v4 + shadcn/ui v4 + lucide-react + MDX + Fuse.js + Shiki + next-themes
- **Hosting docs**: Scaleway Serverless Containers (region `fr-par`)
- **Node**: ≥ 20

## Repo layout

```
packages/
  core/                 # @brand-icons/core — SVG strings, manifest, types
  react/                # @brand-icons/react — generated React components
  vue/                  # @brand-icons/vue
  svelte/               # @brand-icons/svelte
  web-components/       # @brand-icons/wc
apps/
  docs/                 # Next.js documentation + gallery + playground
icons/                  # Source of truth — one folder per brand
  <slug>/
    color.svg           # Official multi-color (hand-edited)
    mono.svg            # Monochrome with currentColor (hand-edited)
    meta.json           # Brand metadata (validated by Zod)
tools/
  build-icons/          # @brand-icons/build-icons — generates package sources
.claude/
  agents/               # icon-fetcher
  rules/                # Authoring rules (typescript, react, svg, meta, …)
```

## Commands

```bash
pnpm install                            # install workspace deps
pnpm build                              # build everything (Turbo)
pnpm build:icons                        # run only the build-icons pipeline
pnpm dev                                # parallel dev (packages watch + docs dev)
pnpm lint                               # Biome check
pnpm lint:fix                           # Biome check --write
pnpm format                             # Biome format --write
pnpm typecheck                          # tsc --noEmit across workspace
pnpm test                               # Vitest run (snapshots + units)
pnpm test:watch                         # Vitest watch
pnpm changeset                          # create a changeset
pnpm version                            # consume changesets → bumps versions
pnpm release                            # build + changeset publish
pnpm clean                              # clean dist, .turbo, node_modules
```

Run a single package script: `pnpm --filter @brand-icons/react test`.

## Source of truth: `icons/<slug>/`

This is the **only** place icons are hand-edited. Everything in
`packages/*/src/icons/` is **generated** by `tools/build-icons` and must
never be edited manually. The `.gitignore` excludes the generated paths
from version control.

When adding or modifying an icon:

1. Edit files inside `icons/<slug>/` only.
2. Run `pnpm build:icons` to regenerate the package sources.
3. Run `pnpm typecheck && pnpm test` to validate.
4. `pnpm changeset` and pick the affected packages (typically all of them).

## Subagents

- **`.claude/agents/icon-fetcher.md`** — acquires the source of a new brand
  from the web (SVG or raster), generates `color.svg` + `mono.svg`, writes
  `meta.json`.

Invoke via the Task tool with `subagent_type: 'icon-fetcher'`.

## Rules (`.claude/rules/`)

Path-scoped authoring rules — read them before editing matching files:

| File            | Applies to                                            |
| --------------- | ----------------------------------------------------- |
| `typescript.md` | `**/*.{ts,tsx}`                                       |
| `react.md`      | React components (`packages/react`, `apps/docs`)      |
| `tests.md`      | `**/__tests__/**`, `**/*.test.ts`                     |
| `monorepo.md`   | workspace, generated files, scripts                   |
| `svg.md`        | `icons/**/*.svg`, generated `packages/*/src/icons/**` |
| `meta.md`       | `icons/**/meta.json`                                  |
| `commits.md`    | git commit messages                                   |

`§1 Must follow` sections are non-negotiable. `§2 Conventions` are
project style — follow unless justified.

## Code style highlights

- TypeScript strict, `verbatimModuleSyntax: true`, `noUncheckedIndexedAccess: true`.
- ESM only — no CJS dual builds. `"type": "module"` everywhere.
- Arrow functions, never `function` keyword (except generators).
- `type` over `interface`. `import type` for type-only imports.
- 2+ params → single named object. Zod validation at boundaries.
- No `any`, no `!` non-null assertion, no inline business types in UI.
- Tailwind v4 — CSS-first config (`@theme` in `globals.css`), no `tailwind.config.ts`.
- shadcn/ui components live in `apps/docs/components/ui/` — never restyle from call sites.

## Generated files (do not edit)

Listed in `.gitignore` and overwritten on every `pnpm build:icons`:

- `packages/core/src/manifest.ts`
- `packages/core/src/icons/**`
- `packages/react/src/icons/**`
- `packages/vue/src/icons/**`
- `packages/svelte/src/icons/**`
- `packages/web-components/src/icons/**`

If you need to change the shape of a generated file, edit the
templates in `tools/build-icons/templates/` instead.

## Git & releases

- Conventional commits, English, imperative mood, lowercase.
- Branch format: `{type}/{scope-or-slug}` — e.g. `add-icon/linear`, `feat/playground`, `fix/svgo-config`.
- One commit = one intention.
- Every user-visible change → `pnpm changeset`.
- Release happens through the `Release` GitHub Action when the version PR is merged.

## Documentation lookups

Use **context7** (`mcp__context7__resolve-library-id` +
`mcp__context7__query-docs`) for any library / framework / SDK doc lookup
(Next.js 15, Tailwind v4, shadcn/ui v4, Turborepo, Changesets, tsup, SVGO,
Vitest…) — even when you think you know the answer. Training data drifts.

## What this repo is not

- Not a generic icon set. Only brand marks of real organizations.
- Not a design system. UI primitives live in `shadcn/ui`, not here.
- Not server-side. No DB, no auth, no Server Actions. The docs site reads
  the manifest at build time only.
- Not a CMS. Adding icons is a code change; PR + Changeset, no admin UI.
