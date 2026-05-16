---
description: Git commit and branch rules — Conventional Commits, scopes, breaking changes
paths:
  - '.git/COMMIT_EDITMSG'
---

# Commit Rules

## §1 Must follow

### 1.1 Conventional Commits

`type(scope): description` — description in English, imperative mood, lowercase, no trailing period.

```
feat(icons): add linear
fix(core): handle missing brandColor in manifest
docs(plan): switch deploy target to scaleway
chore(release): version packages
```

### 1.2 Allowed types

| Type       | Use                                                       |
| ---------- | --------------------------------------------------------- |
| `feat`     | New feature or new icon                                   |
| `fix`      | Bug fix                                                   |
| `docs`     | Documentation only (PLAN, README, CONTRIBUTING, MDX)      |
| `refactor` | Internal rewrite, no behavior change                      |
| `perf`     | Measured performance improvement                          |
| `test`     | Tests added or adjusted                                   |
| `build`    | Tooling, deps, configs (`pnpm`, `turbo`, `tsup`, `biome`) |
| `ci`       | GitHub Actions workflow changes                           |
| `chore`    | Maintenance, release commits                              |
| `revert`   | Reverts a prior commit                                    |

### 1.3 Allowed scopes

Match a package, app, or area:

```
icons · core · react · vue · svelte · wc · docs · build-icons ·
agents · rules · ci · release · plan · readme · biome · turbo · changeset
```

When adding a new icon, scope is always `icons`:

```
feat(icons): add stripe
```

### 1.4 Breaking changes

Add `!` after the type and a `BREAKING CHANGE:` footer:

```
feat(react)!: rename `BackgroundColor` prop to `background`

BREAKING CHANGE: consumers passing `BackgroundColor` must rename to `background`.
```

### 1.5 One commit = one intention

Don't bundle a new icon and a refactor. Split commits, separate
PRs when reviewer load matters.

### 1.6 Vague messages are rejected

Banned:

```
fix bug · update · wip · stuff · misc · changes · fix tests · improve code
```

A reviewer must be able to understand the change from the title alone.

## §2 Conventions

### 2.1 Branch names

`{type}/{slug-or-scope}` — kebab-case.

```
add-icon/linear            ← icon-fetcher branches
feat/playground-color-picker
fix/svgo-strip-style
docs/sprint-3-plan
ci/scaleway-deploy
```

### 2.2 PR titles

Mirror the commit title. The Release workflow uses commit titles for the changelog.

### 2.3 Sign-off

Not required. Provenance is handled by GitHub Actions + NPM provenance, not commit signatures (unless the maintainer opts in to GPG signing locally).

### 2.4 Co-authors

When the change came from a Claude Code session, append:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

Only when the user has approved this footer for the specific commit.
