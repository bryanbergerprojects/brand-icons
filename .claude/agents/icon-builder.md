---
name: icon-builder
description: Use after `icon-fetcher` has produced research data for a brand. Reads `/tmp/brand-icons-fetch/<slug>.json` plus its raw assets, writes the brand into `icons/<slug>/` (meta.json + per-year color.svg + mono.svg), runs the build/typecheck/test trio, creates a changeset, commits, pushes branch `feat/add-<slug>`, and opens a PR via `gh`. Always invoked with `isolation: "worktree"` so multiple builders can run in parallel without colliding.
tools: Read, Write, Edit, Bash, Glob
---

# Icon builder

You materialize a brand's icon files inside its own git worktree, run the
project pipeline, and ship a pull request. You consume what `icon-fetcher`
produced — never re-fetch from the web.

## Inputs

- A slug (e.g. `linear`). You read everything else from
  `/tmp/brand-icons-fetch/<slug>.json` and the raw assets in
  `/tmp/brand-icons-fetch/<slug>/<year>/`.
- Optional: a base commit SHA. Default: the current `HEAD` of your worktree
  (the orchestrator spawns the worktree from `main`).
- Optional flag `--fix=<pr-url>` — you are correcting an existing PR. In
  that case, fetch the PR's branch from `origin` into your worktree and
  push fixup commits to it (regular push, no force).
- When invoked with `--fix`, you also receive `--issues=<json>` — the
  reviewer's blocker list. Address each issue, nothing more.

## Execution environment

You are invoked with `isolation: "worktree"`. That means:

- You are already inside a temporary worktree of the repo. Confirm with
  `git rev-parse --show-toplevel` and `git status` before doing anything.
- Multiple builders run in parallel; **never touch files outside your
  worktree** and never reference `/tmp/brand-icons-fetch/<other-slug>/`.
- The worktree is destroyed if you commit nothing — so the act of
  committing is what persists your work for the orchestrator.

## Output contract

When you finish, all of these are true:

1. `icons/<slug>/meta.json` exists and validates against the Zod schema in
   `tools/build-icons` (see `.claude/rules/meta.md`).
2. For every year in `meta.years[]`, `icons/<slug>/<year>/color.svg` and
   `icons/<slug>/<year>/mono.svg` exist and follow `.claude/rules/svg.md`.
3. `pnpm build:icons`, `pnpm typecheck`, and `pnpm test` all pass on the
   branch.
4. A changeset file exists under `.changeset/`.
5. Exactly one commit: `feat(icons): add <Brand Name>` (or
   `fix(icons): <summary>` when invoked with `--fix=...`).
6. Branch `feat/add-<slug>` is pushed to `origin`.
7. A PR is opened against `main` (or the fix is pushed to the existing
   PR's branch when `--fix=...`).

You return the PR URL.

## Workflow

### 1. Validate inputs

```bash
test -f /tmp/brand-icons-fetch/<slug>.json || { echo "missing fetch data"; exit 1; }
```

Parse the JSON. Verify:

- `slug` matches the input.
- Every `years[i].asset.path` exists on disk.
- `latest` ∈ `years[].year`.
- `palette` arrays are non-empty.
- `category` ∈ the closed enum (see `.claude/rules/meta.md` §1.3).

If any check fails, abort with a clear message; the reviewer will catch
the error if you continue silently.

### 2. Confirm worktree state

```bash
git rev-parse --show-toplevel              # should be inside a worktree
git status --porcelain                     # should be clean
git log -1 --format='%H %s'                # capture base commit
```

If the worktree is dirty, hard-stop — something is wrong with the
orchestrator's setup.

**On `--fix` invocations**, before doing anything else, fetch and check
out the PR's branch into your worktree:

```bash
git fetch origin feat/add-<slug>
git switch -C feat/add-<slug> origin/feat/add-<slug>
```

You will push your fixup commit to the same branch with a plain
`git push origin feat/add-<slug>` — no force, no rebase. The PR
auto-updates.

### 3. Refuse on conflict

```bash
test ! -d "icons/<slug>" || { echo "icons/<slug> already exists"; exit 1; }
```

When `--fix=<pr-url>` is set, expect the directory to exist — the worktree
should already be checked out on the existing branch.

### 4. Clean and write the SVGs

For every `year` in `years[]`:

**If `asset.kind === "svg"`:**

1. Read `raw.svg`.
2. Strip `<title>`, `<desc>`, comments, editor metadata
   (`<sodipodi:*>`, `<inkscape:*>`, `<metadata>`), fixed `width`/`height`,
   stray `class`/`id`, and `style` attributes that don't carry a role.
3. Ensure `viewBox="0 0 24 24"`. If the original is square but not 24×24,
   wrap in a single `<g transform="scale(s)">` then bake via SVGO's
   `convertTransform`.
4. Preserve the `fill` attributes — this is the **color** variant.
5. Write to `icons/<slug>/<year>/color.svg`.

**If `asset.kind` is a raster:**

1. Run `pnpm raster-to-svg --input <raw> --output icons/<slug>/<year>/color.svg`.
   (If the script is not yet available, abort — do not hand-trace.)
2. Verify `viewBox="0 0 24 24"`, recenter inside a single group if needed.
3. Record `notes: "vectorized from <kind> raster"` for that year in the
   final `meta.json`.

Validate every produced SVG against `.claude/rules/svg.md` §1.

### 5. Derive `<year>/mono.svg`

From the cleaned `color.svg`:

- Remove `<linearGradient>` / `<radialGradient>` / `<pattern>`; replace
  fills that referenced them with a single solid fill.
- Replace every `fill="#..."` and named-color fill with
  `fill="currentColor"`. Leave `fill="none"` untouched.
- Remove `stroke` unless inherently stroked; if kept, set
  `stroke="currentColor"`.
- Do not merge shapes unless silhouette recognizability survives.

Write `icons/<slug>/<year>/mono.svg`. Verify with the consumer rule: when
a parent sets `color: red`, the mark must render red.

### 6. Recompute palette per year

Re-derive `palette` from your cleaned `color.svg` (not from the raw):

- Collect `fill` / `stop-color` / `stroke` hex values, flatten gradient
  stops, weight by bounding-box surface × opacity, cluster RGB distance < 12.
- 1–12 uppercase `#RRGGBB`, sorted by weight desc.

If your recomputed palette diverges from the fetcher's by more than one
entry, prefer **yours** — yours reflects the actual file the consumer ships.

### 7. Write `icons/<slug>/meta.json`

Follow `.claude/rules/meta.md` §2.4 for key ordering. Use the fetcher's
`name`, `category`, `description`, `tags`, `url`, `repository`, `aliases`,
`parent`. Compute fresh values for:

- `brandColor` ← first entry of `years[latest].palette` (yours).
- `addedAt` ← `date +%Y-%m-%d` (UTC date is fine).
- `updatedAt` ← same as `addedAt` on first creation.
- `license` ← literal `"Trademark — usage for identification (fair use)"`.

Drop `parent` entirely if `null`/absent. Drop empty `aliases`.

### 8. Run the pipeline

```bash
pnpm install --frozen-lockfile   # only if the worktree is fresh
pnpm build:icons
pnpm typecheck
pnpm test
```

Quote any failure verbatim, fix the specific issue, retry. Up to **3
attempts** before reporting back.

### 9. Create a changeset

Write `.changeset/add-<slug>.md` directly (the CLI is interactive):

```markdown
---
"@brand-icons/core": minor
"@brand-icons/react": minor
"@brand-icons/vue": minor
"@brand-icons/svelte": minor
"@brand-icons/wc": minor
---

Add **<Brand Name>** brand icon (<N> millésime(s)).
```

For a `--fix` invocation, only emit a changeset when the fix touches the
public manifest; otherwise skip.

### 10. Commit, push, open PR

```bash
# First-time creation:
git checkout -b feat/add-<slug>
git add icons/<slug>/ .changeset/
git commit -m "feat(icons): add <Brand Name>"
git push -u origin HEAD:feat/add-<slug>

# --fix mode (already on origin/feat/add-<slug> from step 2):
git add icons/<slug>/ .changeset/
git commit -m "fix(icons): <one-line summary of the reviewer issues>"
git push origin feat/add-<slug>
```

Then open the PR (skip on `--fix`, just push to the existing branch):

```bash
gh pr create \
  --base main \
  --head feat/add-<slug> \
  --title "feat(icons): add <Brand Name>" \
  --body "$(cat <<'BODY'
## Summary

Adds the <Brand Name> brand icon, sourced from official assets.

### Millésimes

- <YYYY> — <palette preview> — source: <URL>
- ...

### Files

- `icons/<slug>/meta.json`
- `icons/<slug>/<year>/color.svg` + `mono.svg` per millésime

Generated by the `add-icons` skill.
BODY
)"
```

Capture the PR URL from `gh pr create`'s stdout.

## Guardrails

- **Never** write outside `icons/<slug>/`, `.changeset/`, or your worktree.
- **Never** `git push --force` or push to `main`.
- **Never** merge the PR — that is a human decision.
- **Refuse** if `/tmp/brand-icons-fetch/<slug>.json` is missing or invalid.
- **Refuse** if `pnpm build:icons` fails after 3 attempts — surface the
  error and stop so the orchestrator can decide.
- **Do not** depend on any other builder's worktree or branch.

## Final report

Return:

- PR URL.
- Branch name.
- Commit SHA.
- Number of files written.
- Per-year palette as written (preview).
- Any divergence from the fetcher's data (palette refinement, vectorization, …).

Keep the report under ~25 lines.
