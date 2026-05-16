---
description: Vitest unit + SVG snapshot rules — file layout, mocking, determinism, snapshot strategy
paths:
  - '**/__tests__/**/*.{test,spec}.{ts,tsx}'
  - '**/__test-utils__/**/*.{ts,tsx}'
  - '**/vitest.config.ts'
---

# Tests Rules

## 1. Critical

### Vitest only

No Jest, no Mocha. Vitest 2.x, run via `pnpm test` (turbo task).

### `vi.mock` at the top of the file

`vi.mock` is hoisted by Vitest. Calling it inside `beforeEach` / `it` runs _before_ those blocks but reads as if local — a silent foot-gun.

```ts
// ❌ Bad
beforeEach(() => {
  vi.mock('./fs-helpers', () => ({ readSvg: vi.fn() }));
});

// ✅ Good — top of file, pure factory
vi.mock('./fs-helpers', () => ({ readSvg: vi.fn() }));
```

### `vi.hoisted` for fixtures used by `vi.mock`

The factory cannot read outer-scope variables.

```ts
const mocks = vi.hoisted(() => ({ svg: '<svg viewBox="0 0 24 24"/>' }));
vi.mock('./fs-helpers', () => ({ readSvg: () => mocks.svg }));
```

### Fake timers must be paired

`vi.useFakeTimers()` in `beforeEach` requires `vi.useRealTimers()` in `afterEach`. Same for `vi.stubGlobal` / `vi.unstubAllGlobals`.

### Determinism

No reads from real network, real filesystem (outside fixtures), real `Date.now()`, real `Math.random()` from a test that asserts on them. Stub at the boundary.

### Pure over mocks

Mock only at I/O boundaries (`node:fs`, network, child_process). Internal helpers should be tested as-is.

### Happy path required

Every `describe` for a public symbol must include at least one passing happy-path test. Edge-case-only suites mask broken happy paths.

## 2. SVG snapshots

### Where they live

Snapshots for the build pipeline live in `tools/build-icons/__tests__/__snapshots__/`. They cover:

- Output of SVGO optimization on a known input.
- Generated `core/icons/<slug>.ts` content for a known fixture.
- Generated React/Vue/Svelte component for the same fixture.

### What they assert

- The full string content of the generated file. Snapshots are file-level.
- A failure means either a real regression OR an intentional pipeline change — update with `pnpm test -u` and review the diff carefully.

### Inline vs file snapshots

Use `toMatchFileSnapshot` for files ≥ 5 lines. Inline only for trivial assertions.

```ts
expect(generated).toMatchFileSnapshot('./__snapshots__/github.react.tsx');
```

## 3. Conventions

### Framework setup

- `globals: false` — import explicitly:

  ```ts
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  ```

- Each package owns its `vitest.config.ts`. Shared config can live at the monorepo root if it grows.

### File location

- Tests live in `__tests__/` next to the source.
- One test file per source file: `optimize.ts` → `__tests__/optimize.test.ts`.
- Shared test utilities → sibling `__test-utils__/` (excluded from runner by naming).

### File naming

- `*.test.ts` canonical. `*.spec.ts` is a legacy fallback only.
- Directory `__tests__/` (singular convention).

### Test structure

- One top-level `describe('symbolName', ...)` per public symbol.
- `it('does X when Y', ...)` — sentence-case, no `should`.
- Nested `describe` only for ≥2 divergent branches needing their own setup.

```ts
describe('optimizeSvg', () => {
  it('strips editor metadata', () => { ... });
  it('forces viewBox to 0 0 24 24', () => { ... });

  describe('with raster fallback', () => {
    it('rejects images smaller than 256px', () => { ... });
  });
});
```

### React component testing

`@brand-icons/react` components are generated and trivial — assertions on `outerHTML` are sufficient. No `@testing-library/react` needed unless a component grows behavior.

### What we do NOT test

- Visual / screenshot regression (sprint 16+ if ever).
- E2E browser tests.
- Vue / Svelte runtime behavior — generated wrappers are validated by their snapshot.
