---
name: typescript-rules
description: Enforces TypeScript strict mode rules and coding standards. Use when writing new TypeScript code, reviewing changes, or fixing type errors. Catches violations of noUnusedLocals, noUnusedParameters, and the no-any rule.
---

# TypeScript Rules

## Compiler Options

- `strict: true`
- `verbatimModuleSyntax: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `moduleResolution: "Bundler"`
- `target: "ES2023"`
- `noEmit: true` — Type-checking is separate from build (`tsc -b` in `pnpm build`)

## No `any` Without Comment

No `any` type without a `// FIXME(<area>): <reason>` comment.

```ts
// BAD
const data: any = response

// GOOD
const data: unknown = response // FIXME(auth): Keycloak profile shape not yet typed
```

## Module Imports

Use `@/` path alias for imports within the project:

```ts
import { api } from '@/lib/api'
import type { Submission } from '@/types/submission'
```

## ArcGIS Imports

ArcGIS core must be dynamically imported in `useEffect`, never top-level:

```ts
// BAD — breaks Vite pre-bundling
import ViewshedAnalysis from '@arcgis/core/analyses/ViewshedAnalysis'

// GOOD — dynamic import in useEffect
useEffect(() => {
  import('@arcgis/core/analyses/ViewshedAnalysis').then((mod) => {
    // use mod.ViewshedAnalysis
  })
}, [])
```

## CSS Modules

Use feature-scoped CSS modules (`*.module.css`) until a UI kit is chosen. Reference design tokens via CSS variables defined in `src/index.css`.

## File Structure

```
src/
├── app/           # router, auth provider, protected route
├── features/
│   ├── auth/      # login, callback, unauthorized
│   ├── dashboard/ # SubmissionForm, PublicDashboard, CaasDashboard
│   └── map-viewer/# scene, panels (layers, search, tools, radar, basemap)
├── lib/           # api client, submissionStore, lastLogin
├── types/         # domain types (submission.ts)
└── config/        # auth config
```

## Server & Database

- Express server at `server/index.ts` runs on port 8000 (env `PORT`)
- DB connection in `server/db.ts` — defaults to `skysafe/skysafe_dev@localhost:5432`
- Vite proxies `/api/*` to `http://localhost:8000` with `/api` prefix stripped

## Build Commands

```bash
pnpm build    # tsc -b && vite build
pnpm lint     # eslint .
```
