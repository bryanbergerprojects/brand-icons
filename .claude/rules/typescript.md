---
description: TypeScript rules — types, null safety, Zod validation, function shapes, error handling
paths:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript Rules

> **§1 Must follow** — non-negotiable. Violation blocks review.
> **§2 Conventions** — project style. Follow unless justified.

---

## §1 Must follow

### 1.1 Never use `any`

Use `unknown`, then narrow with a type guard or Zod. Applies everywhere, including `catch`.

```ts
// ❌ Bad
const parse = (data: any) => data.value;
try { ... } catch (e: any) { console.log(e.message); }

// ✅ Good
const parse = (data: unknown) => dataValidation.parse(data).value;
try { ... } catch (e: unknown) {
  if (e instanceof Error) console.log(e.message);
}
```

### 1.2 Never use the `!` non-null assertion

Replace by narrowing, early return, or fail-fast assertion. Allowed only when TS narrowing is provably impossible AND the value is non-null at runtime — justify in a one-line comment.

```ts
// ❌ Bad
const icon = manifest.find((i) => i.slug === slug)!;

// ✅ Good
const icon = manifest.find((i) => i.slug === slug);
if (!icon) throw new Error(`unknown icon ${slug}`);
```

### 1.3 Zod enums — `z.nativeEnum` only

Never `z.enum([...])` for a TypeScript enum. Duplicating literals causes silent drift.

```ts
// ✅ Good
import { Category } from './category';
const metaValidation = z.object({ category: z.nativeEnum(Category) });
```

### 1.4 Functions with 2+ params take a single named object

The object's type is declared as a named `type`, never inline.

```ts
// ❌ Bad
const renderIcon = (slug: string, size: number, variant: Variant) => { ... };
const renderIcon = (input: { slug: string; size: number; variant: Variant }) => { ... };

// ✅ Good
type RenderIconInput = { slug: string; size: number; variant: Variant };
const renderIcon = (input: RenderIconInput) => { ... };
```

### 1.5 No lone boolean parameter

```ts
// ❌ Bad
generateIcon(true);

// ✅ Good — named object or split
generateIcon({ withBackground: true });
// or
generateIconWithBackground();
```

### 1.6 Validate at every boundary with Zod

Boundaries in this repo: `meta.json` files, CLI inputs, build pipeline inputs, fetched manifests, network responses.

```ts
// ❌ Bad
const meta = JSON.parse(raw) as IconMeta;

// ✅ Good
const meta = metaValidation.parse(JSON.parse(raw));
```

### 1.7 ESM only — no CJS imports

- `"type": "module"` everywhere, top-level `await` allowed.
- Use `node:` protocol for Node built-ins: `import path from 'node:path'`.
- Never use `require`, `__dirname`, or `module.exports`.

---

## §2 Conventions

### 2.1 Functions

- Arrow functions with `const`. Exceptions: generators, named recursive functions.
- 1 caller → keep inline. ≥2 callers same folder → local `utils.ts`. Cross-folder → `<package>/src/utils/<name>.ts`.
- Every exported util requires JSDoc: 1-line description + `@param` + `@returns`.

```ts
/**
 * Snaps a number to the nearest half-pixel for crisp SVG rendering.
 * @param value raw coordinate
 * @returns coordinate rounded to a `.0` or `.5` increment
 */
export const snapHalf = (value: number): number => Math.round(value * 2) / 2;
```

### 2.2 Types

- Prefer `type` over `interface`. Use `interface` only for `extends` / `implements`.
- Always `import type` for type-only imports (`verbatimModuleSyntax` is on).
- Multi-generic functions: name them (`TIcon`, `TVariant`), never `T`/`U`.

### 2.3 Null safety

- `??` over `||` for fallbacks. Use `||` only when falsy values (`""`, `0`, `false`) should also fallback — comment the intent.
- Handle `null` / `undefined` with early return or typed fallback. `noUncheckedIndexedAccess` is on — indexing returns `T | undefined`.

```ts
const first = items[0];
if (!first) return null;
// first is narrowed
```

### 2.4 Casting (`as`)

Use `as` only when (1) reading from a validated boundary (Zod `parse`), or (2) after a narrowing TS cannot infer. Otherwise: type guard or Zod.

### 2.5 Zod conventions

- **Variables**: suffix `Validation` (camelCase) — `metaValidation`, `iconInputValidation`. Never `Schema`.
- **Files**: `validation.ts` or `validations.ts`.
- **Inferred types**: `type IconMeta = z.infer<typeof metaValidation>`.

### 2.6 Error handling

- Handle errors close to the source. Never swallow silently.
- In the build pipeline, fail loudly with the offending slug and file path.
- In React components, surface to the user via toast or fallback UI — never an empty `catch`.
