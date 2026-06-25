---
description: Run TypeScript type-check and Vite production build to verify no compile errors
---

```bash
pnpm build
```

This runs `tsc -b && vite build` in sequence:
1. `tsc -b` — type-checks all source files with `strict: true`, `noEmit: true`
2. `vite build` — bundles to `dist/` (only runs if tsc passes)

Then verify lint:

```bash
pnpm lint
```

## What to look for

- TypeScript errors: fix any `TS2xxx` errors before committing
- `any` without `// FIXME(<area>): <reason>` comment — remove or annotate
- ArcGIS imports at top-level outside `useEffect` — move inside
- Unused imports or variables — remove them

## Common failures

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@/...'` | `@/` alias not in `tsconfig.app.json` | Add `paths: { "@/*": ["./src/*"] }` |
| `Property X does not exist on type IntrinsicElements` | New ArcGIS widget not declared | Add to `src/types.d.ts` |
| `Type 'any' is not assignable` | Missing type on API response | Add interface to `src/types/` |
