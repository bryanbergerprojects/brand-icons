---
'@brand-icons/build-icons': patch
'@brand-icons/react': patch
'@brand-icons/vue': patch
'@brand-icons/svelte': patch
'@brand-icons/wc': patch
---

Preserve root `fill="none"` from source SVGs through SVGO and propagate it to the framework wrapper `<svg>`. Icons whose paths rely on inherited `fill="none"` (e.g. stroke-only smile curves on Google Chat 2026, the checkmark on Google Tasks 2026) no longer fall back to solid-black when rendered through `@brand-icons/react`, `@brand-icons/vue`, `@brand-icons/svelte`, or `<brand-icon>`.
