# Final report template

Print a single markdown block to the user:

```markdown
## Icon onboarding — <N> brand(s)

| Brand | Slug | PR | Status |
|-------|------|----|--------|
| Linear | linear | https://github.com/.../pull/42 | ✅ pass |
| Discord | discord | https://github.com/.../pull/43 | ⚠️ pass with warnings |
| Brave | brave | https://github.com/.../pull/44 | 🔁 fixed (round 2) |
| Notion | notion | — | ❌ needs_human: <reason> |
| Figma | figma | — | ❌ failed_fetch: <reason> |
| Slack | slack | — | ❌ failed_build: <reason> |
| Adobe | adobe | — | ❌ needs_human: wordmark_rejected (2023, 5.2:1) |

**Warnings**: <list per brand>
**Needs human**: <list per brand>
**Cleanup**: <list of worktree paths that failed to remove, or "all clean">
```

Then list the PR URLs as a plain bullet list at the bottom so the user
can copy them directly.

## Token-budget reminders

Fetcher + builder reports are short — keep them verbatim (narrative
trace + PR URLs). Reviewer JSON is the longest payload — quote only
`issues` and `status`; drop the per-check breakdown unless a check
failed.
