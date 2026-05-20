---
description: SVG authoring rules — viewBox, currentColor, variants, no metadata, framework-safe markup
paths:
  - 'icons/*/*/*.svg'
  - 'packages/*/src/icons/**'
  - 'tools/build-icons/templates/**'
---

# SVG Rules

> Applies to every `.svg` file under `icons/<slug>/<year>/` and to generated outputs.

## §1 Must follow

### 1.1 viewBox is `0 0 24 24` — no exceptions

Every committed `color.svg` / `mono.svg` MUST declare
`viewBox="0 0 24 24"`. The framework runtimes
(`packages/react/src/runtime.tsx`, the Vue / Svelte / WC equivalents)
inject the inner SVG markup into a parent `<svg viewBox="0 0 24 24">`
shell — any other canvas size causes path coordinates to fall outside
the visible viewport and the icon renders **invisible** in the docs
grid, the playground, and every downstream consumer.

```xml
<!-- ✅ Good -->
<svg viewBox="0 0 24 24" ... />

<!-- ❌ Bad — paths drawn at x=312, y=840 are way outside the runtime's 0–24 viewport -->
<svg viewBox="0 0 1024 1280" ... />
```

When the source canvas is not `0 0 24 24`, preserve the source geometry
**verbatim** and fit it with a single wrapping `<g transform>`. Never
rewrite path coordinates; the transform is the only allowed adapter.

Normalization by source case:

- **Already `0 0 24 24`** → use as-is, no wrapper.
- **Square but different size** (e.g. `0 0 200 200`, `0 0 64 64`) →
  wrap all content in `<g transform="scale(24/W)">`, `W` = source
  width. No translate.
- **Non-square** (e.g. Figma's 2:3 pill, a tall logotype) → identify
  the **tight content bounding box** `[x y w h]` — usually the declared
  viewBox, but crop to the content box when the canvas has whitespace
  padding (e.g. `0 0 1024 1280` with content only in `[312 340 400 600]`).
  Then compute, formatting `scale`/`tx`/`ty` to ≤ 4 decimals:

  ```
  scale = 24 / max(w, h)
  fitW  = w * scale
  fitH  = h * scale
  tx    = (24 - fitW) / 2 - x * scale
  ty    = (24 - fitH) / 2 - y * scale
  ```

  Wrap every visible child in `<g transform="translate(tx ty) scale(scale)">`.

```xml
<!-- ✅ Good — non-square source fitted via wrapping transform -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g transform="translate(4 0) scale(0.08)">
    <!-- original 200×300 paths kept verbatim -->
    <path fill="#0ACF83" d="M50 300c27.6 0 ..."/>
  </g>
</svg>
```

### 1.2 No fixed `width` / `height`

Sizing comes from the component's `size` prop at runtime.

```xml
<!-- ❌ Bad -->
<svg width="24" height="24" viewBox="0 0 24 24">

<!-- ✅ Good -->
<svg viewBox="0 0 24 24">
```

The generated framework components inject `width` and `height` from the prop.

### 1.3 No editor metadata

Strip on every save:

- `<title>`, `<desc>`, comments outside `<svg>`.
- `<sodipodi:*>`, `<inkscape:*>`, `<metadata>`, `<defs>` containing only unused gradients.
- `id` attributes that are not referenced.
- `class` attributes.
- `data-*` attributes.
- Inline `style` attributes (unless ineradicable).

SVGO config in `tools/build-icons` enforces this. The hand-edited input must already be clean — the pipeline is a safety net, not a substitute for craft.

### 1.4 `currentColor` for mono

`mono.svg`: every fill is `fill="currentColor"`. No hex, no named colors. Consumers set the color via CSS `color` on a parent element.

### 1.5 Gradients in `mono` — `currentColor` only

`<linearGradient>` / `<radialGradient>` / `<pattern>` are allowed in
`mono.svg` **only** when every `<stop>` resolves to `currentColor` with
a `stop-opacity` that mirrors the color version's gradient direction
and stop count. Hex / named stops in mono are forbidden.

When `color.svg` carries a gradient, derive the mono gradient by
keeping the same `<linearGradient>` / `<radialGradient>` element (same
`x1/y1/x2/y2` or `cx/cy/r`), replacing every stop color with
`currentColor`, and translating the original color stops into
`stop-opacity` values that reproduce the perceived light→dark ramp.
The dominant / darker end stays opaque (`stop-opacity="1"`), the
lighter end fades (typical range `0.2`–`0.6`). Pure-color fills with
no gradient stay solid `currentColor`.

```xml
<!-- ❌ Bad — hex stop in mono -->
<linearGradient id="g"><stop offset="0" stop-color="#1DB954"/></linearGradient>

<!-- ✅ Good — currentColor + opacity ramp preserves the gradient feel -->
<linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
  <stop offset="0" stop-color="currentColor" stop-opacity="1"/>
  <stop offset="1" stop-color="currentColor" stop-opacity="0.35"/>
</linearGradient>
```

### 1.6 Internal details as `fill-opacity` shades in `mono`

When `color.svg` contains internal details (eyes, accents, inner
shapes, layered marks) painted with distinct hues, the mono variant
must preserve those details as `currentColor` fills with varying
`fill-opacity`. The dominant silhouette stays opaque
(`fill-opacity="1"` or omitted); accent shapes fade
(`fill-opacity≈0.6`); fine details / highlights fade further
(`fill-opacity≈0.3`).

Pick opacity values by ranking the source hues by perceived luminance
relative to the dominant color — darker accents stay closer to 1,
lighter accents step toward 0. Do not invent shapes the color version
lacks, and do not drop shapes the color version carries: every
`<path>` from `color.svg` must have a counterpart in `mono.svg`.

### 1.7 Strip opaque background squares / rects

Some upstream assets ship with an opaque white (or off-white) square
behind the mark — common on app-icon exports, favicons, press-kit
PNGs traced to SVG. That background is not part of the brand mark and
must be removed before commit, leaving the canvas transparent.

- Detect via a full-canvas `<rect width="…" height="…" fill="#fff|white|#ffffff">` or
  a `<path>` whose bounding box matches the source viewBox and whose
  fill is white / near-white.
- Strip the offending element entirely. Do **not** repaint it
  `currentColor` and do **not** keep it with `fill="none"` — delete the
  node so the SVG renders truly transparent.
- The same rule applies in `color.svg`: the runtime exposes a
  `background` prop that wraps the icon in a colored shell, so source
  files must never bake their own background in.

### 1.8 No `<script>`, no event handlers, no external refs

- No `<script>` blocks.
- No `on*` attributes.
- No `xlink:href` to external resources.
- No `<image>` referencing a raster.

SVG strings are inlined into JS and HTML — anything dynamic is a security and bundle-size risk.

### 1.9 No `<use>` cross-icon references

Each `.svg` must be self-contained. The build pipeline assumes this when generating per-icon files.

## §2 Conventions

### 2.1 File layout

```
icons/<slug>/
├── meta.json          # Brand-level — years[], palette[], latest
└── <year>/            # One subdir per millésime
    ├── color.svg      # Official, multi-color
    └── mono.svg       # Single-color, currentColor
```

`color-bg.svg`, `mono-dark-bg.svg` etc. are **not** committed. The `background` prop is resolved at runtime by the framework component (wraps the SVG in a `<rect fill={brandColor}>`). Equally, `mode="bw" | "wb" | "mono"` is a runtime CSS transform — no pre-generated derivative variants.

### 2.2 Indentation & formatting

- 2 spaces, LF endings.
- `color.svg` may keep the upstream formatting if SVGO output is more compact — round-trip through SVGO before commit.

### 2.3 Attribute order

`xmlns`, `width`, `height` (only for templates, not source), `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, then specific attributes per element.

### 2.4 Accessibility

`<title>` is added by the framework components when `title` prop is set, not in the source SVG. Source SVG stays decoration-only — no `<title>`, no `role`, no `aria-*`.

### 2.5 Path data

- Use uppercase commands (`M`, `L`, `C`) for absolute, lowercase for relative — never mix arbitrarily.
- Prefer shorter commands when round-tripping is identical (`H`, `V` over `L` for axis-aligned segments).
- Let SVGO decide final compaction; the human-edited input prioritizes readability.
