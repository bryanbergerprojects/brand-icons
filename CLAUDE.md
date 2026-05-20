# Brand Icons — Claude Code context

Multi-variant, multi-framework brand icons library. Monorepo pnpm + Turborepo.

## Stack

- **Monorepo**: pnpm 10 workspaces + Turborepo 2 + Changesets
- **Packages**: tsup (esbuild) + TypeScript strict + Vitest, all ESM-only
- **Lint/format**: Biome (single tool, no ESLint + Prettier)
- **Frameworks shipped**: React 19, Vue 3.5, Svelte 5, Web Components
- **Docs site** (`apps/docs`): Astro 5 (static output) + React 19 Islands + Tailwind v4 + shadcn/ui v4 + lucide-react + MDX (content collections) + Fuse.js + Shiki + `next-themes` swap (`@astrojs/react` + theme via class strategy)
- **Hosting docs**: Scaleway Instance (STARDUST1-S, region `fr-par-1`, **Docker InstantApp** image based on Ubuntu 22.04 — Docker + Compose plugin preinstalled by Scaleway) running a Docker Compose stack at `/srv/brand-icons` — `caddy:2-alpine` with `file_server` bind-mounted on `./www`. Let's Encrypt managed by Caddy for `brand-icons.com` (apex) and `www.brand-icons.com` (301 → apex). Provisioning script: `infra/cloud-init.yaml`. Deploys via `.github/workflows/deploy-docs.yml` — rsync over SSH into `/srv/brand-icons/www/` (no reload needed; Caddy picks up new files on the next request).
- **Node**: ≥ 22

## Repo layout

```
packages/
  core/                 # @brand-icons/core — SVG strings, manifest, types
  react/                # @brand-icons/react — generated React components
  vue/                  # @brand-icons/vue
  svelte/               # @brand-icons/svelte
  web-components/       # @brand-icons/wc
apps/
  docs/                 # Astro documentation + gallery + playground (React Islands)
icons/                  # Source of truth — one folder per brand, year-aware
  <slug>/
    meta.json           # Brand-level metadata: years[], palette[], latest (Zod-validated)
    <year>/             # One subdir per millésime (e.g. 1976, 1998, 2017)
      color.svg         # Official multi-color (hand-edited)
      mono.svg          # Monochrome with currentColor (hand-edited)
tools/
  build-icons/          # @brand-icons/build-icons — generates package sources
.claude/
  agents/               # icon-fetcher, icon-builder, icon-reviewer
  rules/                # Authoring rules (typescript, react, svg, meta, …)
  skills/               # add-icons (multi-brand orchestrator)
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
2. New brand → create `<slug>/meta.json` + at least one `<slug>/<year>/{color,mono}.svg`. `meta.latest` must point to one of `meta.years[].year`.
3. New millésime of existing brand → add `<year>/` subdir + push entry into `meta.years[]`.
4. Run `pnpm build:icons` to regenerate the package sources.
5. Run `pnpm typecheck && pnpm test` to validate.
6. `pnpm changeset` and pick the affected packages (typically all of them).

## Subagents

Three specialized agents form the icon-onboarding pipeline:

- **`.claude/agents/icon-fetcher.md`** — research only. Performs web
  discovery for one brand (current + historic millésimes), downloads
  raw assets, and writes `${SCRATCH_DIR}/brand-icons-fetch/<slug>.json` plus the
  raw files. Never writes inside `icons/` or `packages/`, never runs git.
- **`.claude/agents/icon-builder.md`** — consumes the fetcher's JSON in
  an isolated git worktree, materializes `icons/<slug>/meta.json` plus
  per-year `color.svg` + `mono.svg`, runs `pnpm build:icons`, adds a
  changeset, commits, pushes `feat/add-<slug>`, and opens the PR.
- **`.claude/agents/icon-reviewer.md`** — read-only verdict comparing
  builder output to fetcher truth. Returns a JSON pass/fail report
  with a precise issue list so a fix builder can be re-spawned.

Invoke any of them directly via the Agent tool with
`subagent_type: '<name>'`, or — for any multi-brand request — use the
`add-icons` skill (`.claude/skills/add-icons/SKILL.md`), which fans
them out in parallel (≤ 10 brands), runs the full
fetch → build → review → fix loop, and returns one PR per brand.

## Rules (`.claude/rules/`)

Path-scoped authoring rules — read them before editing matching files:

| File            | Applies to                                            |
| --------------- | ----------------------------------------------------- |
| `typescript.md` | `**/*.{ts,tsx}`                                       |
| `react.md`      | React components (`packages/react`, `apps/docs`)      |
| `astro.md`      | `apps/docs/**/*.{astro,ts,tsx,mdx}` — pages, islands, content collections |
| `components.md` | UI vs business split, shadcn restyle, scoping         |
| `hooks.md`      | `**/use-*.ts`, `**/use-*.tsx`                         |
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
- shadcn/ui components live in `apps/docs/src/components/ui/` — never restyle from call sites.
- Astro pages (`.astro`) stay zero-JS by default. React components hydrate only via `client:*` directives (`load` / `idle` / `visible` / `only`) — pick the lightest that works.

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
- Branch format: `{type}/{slug-or-scope}` — e.g. `feat/add-linear` (icon onboarding), `feat/playground-color-picker`, `fix/svgo-strip-style`. See `.claude/rules/commits.md` §2.1.
- One commit = one intention.
- Every user-visible change → `pnpm changeset`.
- Release happens through the `Release` GitHub Action when the version PR is merged.

## Documentation lookups

Use **context7** (`mcp__context7__resolve-library-id` +
`mcp__context7__query-docs`) for any library / framework / SDK doc lookup
(Astro 5, `@astrojs/react`, Tailwind v4, shadcn/ui v4, Turborepo, Changesets,
tsup, SVGO, Vitest…) — even when you think you know the answer. Training data
drifts.

## What this repo is not

- Not a generic icon set. Only brand marks of real organizations.
- Not a design system. UI primitives live in `shadcn/ui`, not here.
- Not server-side. No DB, no auth, no server endpoints. The docs site is
  Astro static — the manifest is imported at build time, never fetched at
  runtime.
- Not a CMS. Adding icons is a code change; PR + Changeset, no admin UI.
