---
description: Visual fidelity contract for brand icons — silhouette, color, mono derivation, and the render-read-compare self-check loop
paths:
  - 'icons/*/*/*.svg'
  - '.claude/agents/icon-builder.md'
  - '.claude/agents/icon-reviewer.md'
---

# Icon Fidelity Rules

Applies to every `color.svg` / `mono.svg` produced under
`icons/<slug>/<year>/` and to the agents that build or review them.

A structurally-valid SVG that does **not** look like the official mark
is a failure, not a near-miss. Fidelity outranks every other quality
axis. The builder enforces these rules before commit; the reviewer
re-verifies them against the same fetcher reference.

## §1 Must follow

### 1.1 Silhouette identical to source

Compared against `${SCRATCH_DIR}/brand-icons-fetch/<slug>/<year>/preview.png`
(the fetcher's canonical visual reference):

- Same path count modulo SVGO merging.
- Same hole topology.
- Same corner sharpness.
- Same orientation — no mirrored, no rotated mark.
- No missing shape, no added shape.

### 1.2 Dominant color matches

Each top-3 palette entry of the produced `color.svg` is within
**ΔE < 10** of the matching entry sampled from `preview.png`.
Gradients keep direction and stop count.

Both builder and reviewer use the same `<` comparator and the same
threshold so a builder-pass guarantees a reviewer-pass on color.

### 1.3 Mono silhouette equals color silhouette

`mono.svg` silhouette equals `color.svg` silhouette, with every fill
resolved to `currentColor`. No re-authoring of path data, no shifting
of coordinates, no recentering of sub-shapes. If you type a number
that does not appear verbatim in `color.svg`, stop: you are rewriting,
not deriving.

The mechanical authoring rules — literal-copy paths, gradients →
`currentColor` + `stop-opacity` ramp, internal details → `fill-opacity`
shades, strip opaque backgrounds, holes via `fill-rule="evenodd"`, no
invented vertices — are defined once in `.claude/rules/svg.md`
§1.4–§1.7. This section adds only the fidelity contract on top of them:
**every `<path>` in `color.svg` has a counterpart in `mono.svg`, at
identical coordinates** — no dropping, no inventing, no drift.

**Contrast parity (no inversion).** Beyond coordinate parity, the mono
mark must preserve the *light/dark reading* of the color mark. A region
that reads light in `color.svg` — a white knockout (negative space) or
a pale highlight tint — must read light in `mono.svg` too: a knockout
stays a transparent hole (§1.6b), a highlight becomes low-opacity
currentColor (§1.6). If a white `+` cutout renders as a solid black `+`
in mono, that is a **contrast inversion** — a fidelity blocker, even
when path-parity and the pixel-diff both pass. This is the single most
common mono defect; check it explicitly (see §1.3b below).

### 1.3b The pixel-diff is unreliable when the reference carries a stripped element

The fetcher's `preview.png` is rendered from the *upstream* asset,
which may include a full-canvas background that §1.7 requires stripping
from the committed SVG. When that happens, the committed mark renders
on a transparent canvas while the reference is mostly opaque
background — `pixelmatch`/`odiff` ratios then balloon (often 60–85%)
purely from canvas mismatch, not from any real divergence. The high
ratio is **noise, not signal**.

In that situation the deterministic gate is non-authoritative. The
agent (builder §4.5, reviewer §7) MUST fall back to direct PNG
inspection and judge on the *mark itself*:

- **Fill coverage** — does the mark fill the 24×24 box per §1.1 (touches
  ≥ 2 opposite edges)? A correctly-stripped-but-not-refit mark shows a
  small centered glyph with wide transparent margin — a §1.1/§1.7
  violation the pixel-diff cannot see.
- **Contrast parity** — render `mono.svg` and confirm no inversion
  (§1.3): cutouts read empty, ink reads filled.

Detect this case when: (a) the produced SVG has no full-canvas
background but `preview.png` is ≥ ~50% a single flat color, or (b) the
mono diff ratio is high while the color diff's *palette* ΔE passes. In
both, do not trust the ratio — inspect. (Long-term fix: the fetcher
should also emit a transparent-canvas `preview.png`; until then this
fallback is mandatory.)

### 1.4 Render-diff-compare self-check (deterministic tool-first)

Mandatory before commit (builder, §4.5) and as the reviewer's §7 check.
The pipeline is **tool-first**: a deterministic CLI produces the
verdict, the LLM only inspects PNGs when the tool flags a blocker —
and then only to describe the mismatch, never to override the verdict.

Cap the visual fix loop at **3 attempts per year**; on the third
failure, hard-stop and surface the year as `visual_mismatch` so the
orchestrator routes to `needs_human`.

**Pipeline order:**

1. SVGO conservative optimization (preserves coordinates, paths, hidden
   elements). Configured in `tools/build-icons/src/optimize.ts`:
   `convertPathData`, `mergePaths`, `removeHiddenElems`, `collapseGroups`,
   and the `moveElemsAttrs*` plugins are disabled; `convertShapeToPath`
   remains active (geometry-exact).
2. Render produced SVG to PNG at 256×256 via `pnpm render:svg`
   (`@resvg/resvg-js`).
3. Run `pnpm icon:diff` (deterministic multi-check):
   - **odiff** (Rust SIMD) — pixel-level diff with YIQ perceptual
     threshold + antialiasing-aware.
   - **pixelmatch** (JS) — secondary pixel diff for cross-check; emits
     `diff.png` artifact.
   - **palette ΔE 2000** (`colorjs.io`) — top-3 entries compared with
     CIEDE2000; `color` variant only, `mono` skips this check.
4. Parse `verdict.json` + interpret exit code:
   - `0` pass / `2` warning (continue) / `1` blocker (retry) / `3`
     tool error (hard-stop).
5. On blocker only: `Read` `produced.png` + `preview.png` + `diff.png`
   to describe the mismatch in the retry rationale. Tool verdict is
   authoritative — the LLM is a describer, not a judge.

**Reference invocation:**

```bash
mkdir -p ${SCRATCH_DIR}/brand-icons-<stage>/<slug>/<year>/
pnpm --silent render:svg \
  icons/<slug>/<year>/color.svg \
  ${SCRATCH_DIR}/brand-icons-<stage>/<slug>/<year>/produced.png \
  --width=256
pnpm --silent icon:diff \
  --produced=${SCRATCH_DIR}/brand-icons-<stage>/<slug>/<year>/produced.png \
  --reference=${SCRATCH_DIR}/brand-icons-fetch/<slug>/<year>/preview.png \
  --output-dir=${SCRATCH_DIR}/brand-icons-<stage>/<slug>/<year>/ \
  --variant=color \
  --quiet
```

**Thresholds** (defaults in `tools/icon-diff/diff.mjs`, overridable via
flags):

| Check                   | Warning                     | Blocker                     |
| ----------------------- | --------------------------- | --------------------------- |
| pixelmatch diff ratio   | > 3% (`silhouette_drift`)   | > 10% (`silhouette_diff`)   |
| ΔE 2000 top palette     | > 5 (`hue_drift`)           | > 10 (`hue_mismatch`)       |
| Per-pixel YIQ threshold | 0.05                        | 0.05                        |

**Variants:**

- `color.svg` → `--variant=color` (all checks active).
- `mono.svg` → `--variant=mono` (silhouette-only; palette ΔE skipped).

**Failure mode:**

If `render:svg` fails or `preview.png` is missing, treat as a fidelity
blocker (the fetcher did not honor its contract). If `icon-diff`
itself errors (exit 3), hard-stop — the orchestrator must intervene.

## §2 Severity mapping for the reviewer

The `icon-diff` CLI emits these `issues[].code` values; map them 1:1 to
the reviewer's `checks.visual_fidelity` verdict:

| `issues[].code`     | Severity | Trigger                                           |
| ------------------- | -------- | ------------------------------------------------- |
| `silhouette_diff`   | blocker  | pixelmatch diff ratio > 10%                       |
| `hue_mismatch`      | blocker  | ΔE 2000 top entry > 10 (color variant only)       |
| `silhouette_drift`  | warning  | pixelmatch diff ratio 3–10%                       |
| `hue_drift`         | warning  | ΔE 2000 top entry 5–10 (color variant only)       |

Wrong canvas centering, missing or extra elements, and mirrored marks
manifest as elevated `silhouette_diff` (large diff ratio) — the
deterministic check is the gate; LLM observation only enriches the
issue message.
