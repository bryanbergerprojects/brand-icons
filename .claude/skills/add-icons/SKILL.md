---
name: add-icons
description: Multi-brand icon onboarding orchestrator — fans out parallel fetch → build → review → fix agents (≤ 10 brands) and opens one PR per brand. Fires on add/import/fetch/onboard/create of one or more brand icons (FR + EN: "ajoute l'icône de X", "add the X icon", "fetch icons for X, Y, Z"); prefer over invoking `icon-fetcher` directly even for a single brand. Do NOT use to edit an existing icon — that needs a manual `icon-fetcher --update` + hand edits.
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, AskUserQuestion
---

# Add icons — multi-agent orchestrator

You are the orchestrator of a five-phase pipeline that onboards one or
more brand icons into this monorepo. Phases 1–4 fan out one
specialized sub-agent **per brand, in parallel**, capped at 10 brands;
phase 5 is a sequential Bash cleanup.

The pipeline mirrors the three agents in `.claude/agents/`:

1. **`icon-fetcher`** — web research only. Produces
   `${SCRATCH_DIR}/brand-icons-fetch/<slug>.json` + raw assets.
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

## Scratch directory convention

Every agent (fetcher, builder, reviewer) computes its own `SCRATCH_DIR`
via `git rev-parse --path-format=absolute --git-common-dir` — it
resolves to the **main repo's** `.claude/.tmp/` from any worktree, so all agents read
and write the same shared scratch tree. The orchestrator never sets
`SCRATCH_DIR` itself; it only references the path verbatim in agent
prompts (e.g. `${SCRATCH_DIR}/brand-icons-fetch/<slug>.json`). The
directory is gitignored — never committed.

## Isolation policy

Full rule in `references/parallelism-and-errors.md`. In short: fetchers
(Phase 1) run with **no** `isolation`; builders + reviewers (Phases 2,
3, 4, post-fix) **require** `isolation: "worktree"`.

Capture each spawned worktree's path from the Agent result — Phase 5
cleanup needs them.

## Pre-flight checks (run once, sequentially)

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "canary" ] || { echo "must run from canary (current: $BRANCH) — abort"; exit 1; }
git status --porcelain | grep -q . && { echo "working tree dirty — abort"; exit 1; }
gh auth status                                           # need gh for PR creation
test -d .changeset                                       # need changesets configured
git fetch origin canary --no-tags                        # refresh the authoritative base tip
git rev-parse origin/canary                              # must resolve — builders branch from here
test -f tools/render-svg/render.mjs || { echo "render:svg helper missing — abort"; exit 1; }
test -f tools/icon-diff/diff.mjs    || { echo "icon:diff helper missing — abort"; exit 1; }
```

If any pre-flight fails, surface it and stop — the builders will not
recover.

`git fetch origin canary` is mandatory. Every builder worktree resets
to `origin/canary` before creating its `feat/add-<slug>` branch — if
the local copy of `origin/canary` is stale, every PR will diverge from
the remote tip. Refresh it here, once, before fanning out.

Also Glob `icons/<slug>/` for every requested brand. If any already
exists, ask the user up-front: skip or cancel. Updating an existing
brand is out of scope for this skill — the builder refuses on
conflict. Point the user to a manual `icon-fetcher --update` rerun
plus hand-driven edits if they truly need an update.

## Phase 1 — Fetch (parallel, ≤ 10)

Spawn **one `icon-fetcher` Agent per brand in a single message** — that
is the mechanism that makes them run concurrently. Do not chain them.

Each Agent call:

- `subagent_type: "icon-fetcher"`.
- `description`: `"Fetch <Brand>"`.
- `prompt`: a self-contained brief — brand name, any URL the user
  provided, slug if overridden. The fetcher contract (icon-only mark,
  fallback waterfall, `icon_only_unavailable` skip) is owned by
  `icon-fetcher.md` §2.5; do not restate it in the prompt.
- No `isolation` — see Isolation policy above.

When all fetchers have returned, consolidate:

- Verify every `${SCRATCH_DIR}/brand-icons-fetch/<slug>.json` exists.
- If any fetcher failed (no JSON, source not found, raster too small,
  every year skipped as `icon_only_unavailable`), collect those brands
  into a `failed_fetch` list and surface them at the end — do not block
  the others.

If a fetcher reports an ambiguous category or an unverified `latest`
across multiple millésimes, ask the user once (batched across all
ambiguous brands via `AskUserQuestion` — chunked into calls of ≤ 4
questions, the tool's per-call cap) and patch the JSON files in-place
before phase 2.

## Phase 2 — Build (parallel, ≤ 10, isolated worktrees)

For every slug that has valid fetcher data, spawn **one `icon-builder`
Agent per brand in a single message**. Each call:

- `subagent_type: "icon-builder"`.
- `description`: `"Build <Brand> PR"`.
- `isolation: "worktree"` (see Isolation policy).
- `prompt`: tells the builder its slug and the absolute path to the
  fetcher JSON. Remind it that the JSON references raw assets under
  `${SCRATCH_DIR}/brand-icons-fetch/<slug>/<year>/` — same absolute path
  from any worktree (resolved via `git rev-parse --path-format=absolute --git-common-dir`).
  **Explicitly instruct the builder to base its branch on
  `origin/canary`** — the harness spawns the worktree from local HEAD
  (which may be stale), so the builder must `git fetch origin canary
  --no-tags` then `git switch -C feat/add-<slug> origin/canary` before
  any file write. PRs target `canary`, not `main`.

Capture from each builder's result:

- The PR URL it printed.
- The worktree path (returned automatically when `isolation: "worktree"`
  produces commits).
- The branch name (`feat/add-<slug>`).

If a builder failed before pushing, mark the slug as `failed_build`
and continue — the others should still ship.

If a builder reported `visual_mismatch` or `wordmark_rejected` on one
or more years, it will not have opened a PR. Mark the slug as
`needs_human` with the list of failing years and reason
(`visual_mismatch` = §4.5 visual diff exhausted 3 retries;
`wordmark_rejected` = §3.5 aspect gate caught a non-icon-only mark).
Continue with the others. Do not auto-spawn another builder for that
brand — the fetcher's source asset is the root cause and a fresh build
will keep failing the same way. A human can patch the fetcher JSON to
set `wide_mark_intentional` on a year's `notes` if the brand's symbol
legitimately has a non-square footprint (rare).

## Phase 3 — Review (parallel, ≤ 10, isolated worktrees)

For every successfully built PR, spawn **one `icon-reviewer` Agent per
brand in a single message**:

- `subagent_type: "icon-reviewer"`.
- `description`: `"Review <Brand> PR"`.
- `isolation: "worktree"` (see Isolation policy). The reviewer fetches
  the PR's branch from `origin` into its worktree — review the
  artifact that is actually on the PR, not a local directory that may
  already be cleaned up.
- `prompt`: includes the slug, `--pr=<url>`, and
  `--branch=feat/add-<slug>`. Do **not** pass `--worktree=<path>` —
  the reviewer rejects it and always fetches `origin/<branch>` into
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
- `isolation: "worktree"` (see Isolation policy). Fresh worktree;
  the original builder's path is opaque to the harness — never reuse.
- `prompt`: includes the slug, `--fix=<pr-url>`, and the reviewer's
  JSON `issues` array verbatim. Remind it to `git fetch origin
  feat/add-<slug>` and `git switch -C feat/add-<slug>
  origin/feat/add-<slug>` before any edit. The builder addresses only
  those issues, commits, and pushes to the existing branch — no new PR.

Capture each fix builder's worktree path for Phase 5 cleanup.

After fix builders return, spawn **one `icon-reviewer` per fixed PR in
a single message**, same `isolation: "worktree"` rule as Phase 3.
Capture each post-fix reviewer's worktree path too. If a PR fails
twice, stop fixing — surface it as a `needs_human` item in the final
report. A third spawn would burn tokens with diminishing returns.

A `visual_fidelity` blocker that survives the fix round always graduates
to `needs_human` — never spawn a third builder for it. Visual drift
that the model cannot self-correct in two passes signals either a bad
source asset (fetcher) or a brand that requires hand crafting. Thresholds
and severity mapping live in `.claude/rules/icon-fidelity.md` §1.4 + §2.

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

See `references/final-report-template.md` for the exact markdown
table to print, plus token-budget rules for quoting fetcher / builder
/ reviewer output.

## Parallelism + error policy

See `references/parallelism-and-errors.md` — one-message batching,
≤ 10 cap per phase, isolation rules, per-brand failure containment,
abort-on-pre-flight, two-fix ceiling.
