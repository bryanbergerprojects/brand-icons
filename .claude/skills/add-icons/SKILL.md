---
name: add-icons
description: Multi-brand icon onboarding orchestrator. Use whenever the user asks to "add", "import", "fetch", "pull", "onboard", or "create" one or more brand icons in this repo — including phrasings like "ajoute l'icône de Linear", "ajoute les icônes des marques suivantes", "import the Notion icon", or "fetch icons for Discord, Brave, and Figma". Fans out parallel research, build, and review agents (up to 10 brands at once), opens one PR per brand, and returns the PR list. Always prefer this skill over invoking `icon-fetcher` directly when more than one brand is requested, and prefer it for a single brand too because it handles the full fetch → build → review → fix → PR loop.
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, AskUserQuestion
---

# Add icons — multi-agent orchestrator

You are the orchestrator of a four-phase pipeline that onboards one or
more brand icons into this monorepo. Each phase fans out one
specialized sub-agent **per brand, in parallel**, capped at 10 brands.

The pipeline mirrors the three agents in `.claude/agents/`:

1. **`icon-fetcher`** — web research only. Produces
   `/tmp/brand-icons-fetch/<slug>.json` + raw assets.
2. **`icon-builder`** — runs in a git worktree, writes files, opens
   the PR.
3. **`icon-reviewer`** — read-only verdict comparing builder output
   against fetcher truth.
4. **`icon-builder --fix`** — only if the reviewer found blockers,
   spawned again to push a correction to the existing PR.

## When to trigger

User intent keywords (English and French):

- "ajoute l'icône de <brand>", "ajoute les icônes de <liste>"
- "add the <brand> icon", "add brand icons for <list>"
- "import / fetch / pull / onboard <brand>"
- "create an icon for <brand>"

If the user pastes a numbered or bulleted list, treat each item as one
brand. If they mention a single brand, run the full pipeline anyway —
the agents are cheap and the review safety-net is worth it.

## Inputs

Parse the user's request into a list of brand names. Cap at 10 — if
they ask for more, ask which 10 to prioritize.

For each brand:

- **Brand name** as the user wrote it (you derive the slug).
- Optional **direct URL** if the user pasted one.
- Optional **slug override** if the user specified one.

If the user's intent is ambiguous (e.g. "Meta" — Facebook's parent or
the prefix?), ask one clarifying question via `AskUserQuestion` before
spawning anything. Do not stop in the middle of the pipeline to ask.

## Pre-flight checks (run once, sequentially)

```bash
git rev-parse --abbrev-ref HEAD                    # confirm we know the base branch
gh auth status                                     # need gh for PR creation
test -d .changeset                                 # need changesets configured
git fetch origin canary --no-tags                  # refresh the authoritative base tip
git rev-parse origin/canary                        # must resolve — builders branch from here
```

If any pre-flight fails, surface it and stop — the builders will not
recover.

`git fetch origin canary` is mandatory. Every builder worktree resets
to `origin/canary` before creating its `feat/add-<slug>` branch — if
the local copy of `origin/canary` is stale, every PR will diverge from
the remote tip. Refresh it here, once, before fanning out.

Also Glob `icons/<slug>/` for every requested brand. If any already
exists, ask the user up-front: skip / `--update` / cancel. Do not let
that decision propagate into the parallel phase.

## Phase 1 — Fetch (parallel, ≤ 10)

Spawn **one `icon-fetcher` Agent per brand in a single message** — that
is the mechanism that makes them run concurrently. Do not chain them.

Each Agent call:

- `subagent_type: "icon-fetcher"`.
- `description`: `"Fetch <Brand>"`.
- `prompt`: a self-contained brief — the brand name, any URL the user
  provided, the slug if overridden, and the explicit reminder that the
  agent must write `/tmp/brand-icons-fetch/<slug>.json` and exit.
- **No `isolation`** — fetchers only touch `/tmp/`, so they share the
  main checkout safely.

When all fetchers have returned, consolidate:

- Verify every `/tmp/brand-icons-fetch/<slug>.json` exists.
- If any fetcher failed (no JSON, source not found, raster too small),
  collect those brands into a `failed_fetch` list and surface them at
  the end — do not block the others.

If a fetcher reports an ambiguous category or an unverified `latest`
across multiple millésimes, ask the user once (batched across all
ambiguous brands via a single `AskUserQuestion` with multiple
questions) and patch the JSON files in-place before phase 2.

## Phase 2 — Build (parallel, ≤ 10, isolated worktrees)

For every slug that has valid fetcher data, spawn **one `icon-builder`
Agent per brand in a single message**. Each call:

- `subagent_type: "icon-builder"`.
- `description`: `"Build <Brand> PR"`.
- `isolation: "worktree"` — **mandatory**. Without it, parallel
  builders will collide on the same checkout. Each worktree gets its
  own branch and working directory.
- `prompt`: tells the builder its slug and the absolute path to the
  fetcher JSON. Remind it that the JSON references raw assets under
  `/tmp/brand-icons-fetch/<slug>/<year>/` which are accessible from
  inside the worktree (they live outside the repo). **Explicitly
  instruct the builder to base its branch on `origin/canary`** — the
  harness spawns the worktree from local HEAD (which may be stale), so
  the builder must `git fetch origin canary --no-tags` then
  `git switch -C feat/add-<slug> origin/canary` before any file write.
  PRs target `canary`, not `main`.

Capture from each builder's result:

- The PR URL it printed.
- The worktree path (returned automatically when `isolation: "worktree"`
  produces commits).
- The branch name (`feat/add-<slug>`).

If a builder failed before pushing, mark the slug as `failed_build`
and continue — the others should still ship.

If a builder reported `visual_mismatch` on one or more years (its
self-check could not converge in 3 attempts), it will not have opened a
PR. Mark the slug as `needs_human` with the list of mismatched years
and continue. Do not auto-spawn another builder for that brand — the
fetcher's source asset is likely the root cause and a fresh build will
keep failing the same way.

## Phase 3 — Review (parallel, ≤ 10, isolated worktrees)

For every successfully built PR, spawn **one `icon-reviewer` Agent per
brand in a single message**:

- `subagent_type: "icon-reviewer"`.
- `description`: `"Review <Brand> PR"`.
- `isolation: "worktree"` — **mandatory**. The reviewer must work in
  its own worktree and fetch the PR's branch from `origin` so it
  reviews the artifact that is actually on the PR, not a local
  directory that may already be cleaned up.
- `prompt`: includes the slug, `--pr=<url>`, and
  `--branch=feat/add-<slug>`. Do **not** pass `--worktree=<path>` —
  that flag is deprecated; the reviewer fetches `origin/<branch>` into
  its own worktree.

Capture the reviewer's worktree path from the Agent result so Phase 5
can clean it up.

Collect each reviewer's JSON verdict.

- `status: "pass"` → PR is good as-is.
- `status: "fail"` with at least one `blocker` issue → queue for
  Phase 4 with the issue list.
- `warning` issues → keep the PR, surface the warnings in the final
  report.

## Phase 4 — Fix (conditional, parallel, ≤ 10)

For every brand the reviewer rejected, spawn **one `icon-builder` Agent
with `--fix`**. Each call:

- `subagent_type: "icon-builder"`.
- `description`: `"Fix <Brand> PR"`.
- `isolation: "worktree"` — gives the fix builder a fresh worktree.
  The agent fetches `origin/feat/add-<slug>` into that worktree itself
  (the original builder's worktree is not reused — that path is opaque
  to the harness).
- `prompt`: includes the slug, `--fix=<pr-url>`, and the reviewer's
  JSON `issues` array verbatim. The builder addresses only those
  issues, commits, and pushes to the existing branch — no new PR.

After fix builders return, run **one more round** of `icon-reviewer`
for the fixed PRs only. If a PR fails twice, stop fixing — surface it
as a `needs_human` item in the final report. A third spawn would burn
tokens with diminishing returns.

A `visual_fidelity` blocker that survives the fix round always graduates
to `needs_human` — never spawn a third builder for it. Visual drift
that the model cannot self-correct in two passes signals either a bad
source asset (fetcher) or a brand that requires hand crafting.

## Phase 5 — Cleanup (always, before the final report)

Once every PR exists on `origin`, remove every worktree spawned during
the run — builders (Phase 2 + Phase 4) **and** reviewers (Phase 3 +
post-fix review). The PR carries the work; every worktree is
disposable.

For each worktree path collected from Phase 2, Phase 3, Phase 4, and
the post-fix review, run:

```bash
git worktree unlock <path> 2>/dev/null || true
git worktree remove <path> --force
```

Notes:

- The Agent tool's `isolation: "worktree"` locks the worktree, so
  `unlock` is required before `remove` — the `|| true` covers the
  rare case where it was not locked.
- Use `--force` because the worktree's committed branch (e.g.
  `worktree-agent-<id>`) is intentionally not merged into `main` —
  the real branch is `feat/add-<slug>`, already on `origin`.
- Do **not** delete `feat/add-<slug>` locally or on `origin`. The PR
  needs it.
- If `git worktree remove` fails, surface the error in the report
  under a `Cleanup` line — do not retry destructively.
- Skip cleanup only if the user explicitly asked to keep the
  worktrees (e.g. for manual inspection of a failed build).

Run all `git worktree remove` calls in a single Bash invocation
(chained with `&&` or separated by `;`) — they are fast and serial
keeps output tidy.

## Final report

Print a single markdown block to the user:

```markdown
## Icon onboarding — <N> brand(s)

| Brand | Slug | PR | Status |
|-------|------|----|--------|
| Linear | linear | https://github.com/.../pull/42 | ✅ pass |
| Discord | discord | https://github.com/.../pull/43 | ⚠️  pass with warnings |
| Brave | brave | https://github.com/.../pull/44 | 🔁 fixed (round 2) |
| Notion | notion | — | ❌ needs_human: <reason> |
| Figma | figma | — | ❌ failed_fetch: <reason> |

**Warnings**: <list per brand>
**Needs human**: <list per brand>
```

Then list the PR URLs as a plain bullet list at the bottom so the
user can copy them directly.

## Parallelism — the rules that matter

- **One message, many Agent calls.** Claude Code runs Agent tool uses
  inside the same assistant message concurrently. Two messages with one
  call each run serially. Always batch.
- **Cap at 10 per phase.** Token explosion grows linearly with N
  parallel agents; 10 is the sweet spot where review still surfaces
  patterns without blowing the budget.
- **Worktrees for builders AND reviewers.** Fetchers write to `/tmp/`
  and never touch the repo — no isolation. Builders mutate `icons/`,
  reviewers run `pnpm` and need a clean checkout of the PR branch —
  both require `isolation: "worktree"`. The ~5s setup is worth it to
  prevent collisions and to guarantee the reviewer sees what is
  actually on `origin/<branch>`.
- **Never re-spawn a phase mid-run.** If a fetcher times out, mark it
  failed and continue with the rest. The pipeline is best-effort across
  brands, not all-or-nothing.

## Error policy

- A single brand's failure must **not** stop the others. Always collect
  failures into the final report.
- Pre-flight failures (missing `gh`, no `.changeset/`, dirty working
  tree, wrong base branch) **do** stop everything — abort before
  Phase 1.
- After Phase 4, if a brand still fails review twice, leave its PR
  open and label the row `needs_human`. Do not auto-close it.

## Token-budget reminders

- Fetcher reports are short — keep them. They are the only narrative
  trace of where each asset came from.
- Builder reports are short too — keep them; they carry the PR URLs.
- Reviewer JSON is the longest output. Quote only the `issues` and
  `status` in the final report; drop the per-check breakdown unless a
  reviewer reported a failure.
