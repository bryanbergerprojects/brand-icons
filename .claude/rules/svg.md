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

### 1.1 viewBox is `0 0 24 24`

Unless the official mark is intrinsically non-square (rare). Document the exception in `meta.notes` and `BRAND_OWNERS.md` review queue.

```xml
<!-- ✅ Good -->
<svg viewBox="0 0 24 24" ... />

<!-- ❌ Bad — varying canvas breaks layout in the docs grid -->
<svg viewBox="0 0 64 64" ... />
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

### 1.5 No gradients in `mono`

`<linearGradient>` / `<radialGradient>` / `<pattern>` are allowed only in `color.svg`. Mono must be solid single-color renderings.

### 1.6 No `<script>`, no event handlers, no external refs

- No `<script>` blocks.
- No `on*` attributes.
- No `xlink:href` to external resources.
- No `<image>` referencing a raster.

SVG strings are inlined into JS and HTML — anything dynamic is a security and bundle-size risk.

### 1.7 No `<use>` cross-icon references

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
