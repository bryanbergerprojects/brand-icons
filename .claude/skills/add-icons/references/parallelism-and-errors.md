# Parallelism + error policy

## Parallelism — the rules that matter

- **One message, many Agent calls.** Claude Code runs Agent tool uses
  inside the same assistant message concurrently. Two messages with one
  call each run serially. Always batch.
- **Cap at 10 per phase.** Token explosion grows linearly with N
  parallel agents; 10 is the sweet spot where review still surfaces
  patterns without blowing the budget.
- **Worktree isolation policy.** Builders (Phase 2 + 4) and reviewers
  (Phase 3 + post-fix) MUST run with `isolation: "worktree"`. Fetchers
  MUST NOT — they only write under `${SCRATCH_DIR}` (= main repo's
  `.claude/.tmp/`, gitignored), so they share the main checkout safely.
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
- A `visual_fidelity` blocker that survives the fix round always
  graduates to `needs_human` — never spawn a third builder for it.
  Visual drift that the model cannot self-correct in two passes signals
  either a bad source asset (fetcher) or a brand that requires hand
  crafting. Thresholds and severity mapping live in
  `.claude/rules/icon-fidelity.md` §1.4 + §2.
