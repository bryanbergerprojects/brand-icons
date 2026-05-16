---
description: Monorepo rules — workspace deps, generated files, Turbo, Changesets, build order
paths:
  - 'package.json'
  - 'packages/**/package.json'
  - 'apps/**/package.json'
  - 'tools/**/package.json'
  - 'turbo.json'
  - 'pnpm-workspace.yaml'
  - '.changeset/**'
---

# Monorepo Rules

## §1 Must follow

### 1.1 Cross-package imports use `workspace:*`

Never depend on a sibling package by version range. Use the `workspace:` protocol so pnpm wires the dependency to the local source.

```json
// ❌ Bad
"dependencies": { "@brand-icons/core": "^0.1.0" }

// ✅ Good
"dependencies": { "@brand-icons/core": "workspace:*" }
```

### 1.2 Generated files are never edited by hand

The following paths are produced by `tools/build-icons` and are listed in `.gitignore`. Editing them is futile — they are overwritten on every build.

- `packages/core/src/manifest.ts`
- `packages/core/src/icons/**`
- `packages/react/src/icons/**`
- `packages/vue/src/icons/**`
- `packages/svelte/src/icons/**`
- `packages/web-components/src/icons/**`

To change the output shape, edit the template in
`tools/build-icons/templates/<framework>/` and re-run `pnpm build:icons`.

### 1.3 Public packages must declare `publishConfig`

Every package under `packages/*` that ships to NPM declares:

```json
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

And exposes only `dist/` in `files`. Never publish raw sources.

### 1.4 ESM exports map

Every public package uses an `exports` map with `types` first:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./icons/*": {
    "types": "./dist/icons/*.d.ts",
    "import": "./dist/icons/*.js"
  }
}
```

`main`/`module` are not declared — the resolver uses `exports`.

### 1.5 Changesets are required for every shipped change

Any modification under `packages/*` (including a new icon, since it
changes all packages' output) requires `pnpm changeset` before the PR.

- `apps/*` and `tools/*` are excluded from versioning via `.changeset/config.json` `ignore`.
- For a new icon, select **every** framework package + `@brand-icons/core` as patch bumps.
- For an API-breaking change, select major.

### 1.6 Turbo tasks declare correct inputs

When adding a script that should be Turbo-tracked, update `turbo.json`'s `tasks.<name>.inputs` to include all relevant source paths. Otherwise the cache will miss invalidations.

## §2 Conventions

### 2.1 Build order

`tools/build-icons` runs **first** in any build chain, before package builds. This is enforced via `dependsOn: ["^build"]` in `turbo.json` plus package-level `dependencies` on workspace packages.

### 2.2 Adding a new package

1. `packages/<name>/package.json` with `workspace:` deps.
2. `tsconfig.json` extending `../../tsconfig.base.json`.
3. `tsup.config.ts` with ESM-only build.
4. `vitest.config.ts` if tests exist.
5. Add to `pnpm-workspace.yaml` only if outside `packages/*` / `apps/*` / `tools/*` (already globbed).
6. Add scripts: `build`, `dev`, `typecheck`, `test`, `clean`.
7. `pnpm install` from the repo root to wire workspace links.

### 2.3 Running scoped commands

```bash
pnpm --filter @brand-icons/react test
pnpm --filter @brand-icons/core build
pnpm --filter docs dev
pnpm --filter './packages/*' typecheck
```

### 2.4 Lockfile discipline

`pnpm-lock.yaml` is committed. CI uses `--frozen-lockfile`. Never use `pnpm install --no-frozen-lockfile` outside intentional dep updates.

### 2.5 Node engine

`"engines": { "node": ">=20", "pnpm": ">=10" }` everywhere. CI uses `.nvmrc` (`20`).
