---
"@brand-icons/core": patch
"@brand-icons/react": patch
"@brand-icons/vue": patch
"@brand-icons/svelte": patch
"@brand-icons/wc": patch
---

Fix Figma icon (2016 + 2024) viewBox so the mark renders inside the 24×24 runtime shell. Wrap source paths in an aspect-preserving `<g transform>`; normalize 2024 footprint to match 2016 size.
