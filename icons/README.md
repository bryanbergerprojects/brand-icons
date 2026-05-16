# Icons — source of truth

One folder per brand. Folder name = `slug` (kebab-case ASCII).

## Required files

| File         | Purpose                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `color.svg`  | Official multi-color SVG. `viewBox="0 0 24 24"`. No editor metadata. Fills as-is.        |
| `mono.svg`   | Single-color variant. `fill="currentColor"`. Gradients flattened. No `<linearGradient>`. |
| `custom.svg` | Lucide-style stroke variant. `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`. Centered in 20×20 inside 24×24. |
| `meta.json`  | Brand metadata validated by Zod. See `.claude/rules/meta.md`.                            |

## Optional files

| File          | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| `color-bg.svg` | Variant with brand-colored background, when applicable.       |

## Rules

- Edit by hand only. Generated files in `packages/*/src/icons/` are never edited here.
- New icon = new folder. PR + Changeset required.
- Run `pnpm build:icons` after any change to regenerate framework packages.
- Validate against schema before commit — see `.claude/rules/meta.md` and `.claude/rules/svg.md`.

## Adding an icon via Claude Code

Invoke the agents:

```
Task: icon-fetcher  → produces color.svg + mono.svg + meta.json
Task: icon-maker    → produces custom.svg
```

Manual creation also fine — agents are convenience, not requirement.
