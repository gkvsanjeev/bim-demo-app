# AGENTS.md — BIM-DEMO-APP (CAAS SkySAFE 2.0 GIS Client)

## Commands

```
pnpm install              # install dependencies
pnpm dev                  # Vite dev server (front-end)
pnpm server               # Express API server on :8000 (auth sync, submissions)
pnpm build                # tsc -b && vite build
pnpm lint                 # eslint .
```

Run `pnpm dev` and `pnpm server` concurrently for a full local environment.

## Architecture

- **Front-end**: React 19 + TypeScript + Vite 8 + React Router v7
- **Back-end**: Express 5 (`server/index.ts`) — `POST /auth/sync`, `GET/POST /submissions`
- **Database**: PostgreSQL (`server/db.ts`), seed via `pnpm db:seed`
- **Auth**: OIDC via `react-oidc-context` + Keycloak (`src/config/auth.ts`)
- **Roles**: `public_user`, `caas_io`, `adp_ao` — enforced by `ProtectedRoute`

### Routes

| Path | Component | Roles |
|---|---|---|
| `/login` | LoginPage | public |
| `/auth/callback` | CallbackPage | public |
| `/dashboard` | DashboardPage | all authenticated |
| `/submit` | SubmissionForm | public_user only |
| `/map/:applicationId` | App (ArcGIS scene) | caas_io, adp_ao |

### Feature layout

```
src/
├── app/           # router, auth provider, protected route
├── features/
│   ├── auth/      # login, callback, unauthorized
│   ├── dashboard/ # SubmissionForm, PublicDashboard, CaasDashboard
│   └── map-viewer/# scene, panels (layers, search, tools, radar, basemap)
├── lib/           # api client, submissionStore, lastLogin
├── types/         # domain types (submission.ts)
├── config/        # auth config
└── types.d.ts     # ArcGIS/calcite web-component JSX declarations
```

## ArcGIS — non-negotiable rules

1. **Vite exclude** — all `@arcgis/*` and `@esri/*` packages must be in `optimizeDeps.exclude` in `vite.config.ts`. Vite pre-bundling breaks ArcGIS initialisation.
2. **Import components individually** — e.g. `import '@arcgis/map-components/components/arcgis-scene'` before use in JSX. See `src/App.tsx`.
3. **Await `viewOnReady()`** — get a ref on `<arcgis-scene>`, then inside `useEffect` await `sceneEl.viewOnReady()` before accessing `map`, `allLayers`, or any analysis APIs.
4. **Scene item-id** — the scene loads via `item-id="f477c289e93347aba6a0c052bfe0e0a4"`. Do not set `basemap` alongside `item-id`.
5. **New widget types** — add JSX intrinsic element declarations to `src/types.d.ts` before using any new ArcGIS or calcite web component.
6. **Stylesheet** — `@arcgis/core/assets/esri/themes/light/main.css` imported once in `main.tsx`.

## TypeScript

- `strict: true`, `verbatimModuleSyntax: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `moduleResolution: "Bundler"`, `target: "ES2023"`
- `noEmit: true` — type-checking is separate from build (`tsc -b` in `pnpm build`)
- No `any` without `// FIXME(<area>): <reason>` comment

## Server & Database

- Express server at `server/index.ts` runs on port 8000 (env `PORT`).
- Vite proxies `/api/*` to `http://localhost:8000` with `/api` prefix stripped.
- DB connection in `server/db.ts` — defaults to `skysafe/skysafe_dev@localhost:5432`.
- Init schema: `db/init.sql`. Seed data: `db/seed.sql` (`pnpm db:seed`).

## File uploads (dev only)

- Vite middleware at `POST /upload` writes to `public/uploads/<filename>`.
- Filename sanitised to safe chars only (no path traversal).

## Design System

Source of truth: `DESIGN.md` (repo root). CSS custom properties: `src/styles/tokens.css` (imported globally in `main.tsx` before `index.css`).

**Font substitutes**: Inter (variable) → figmaSans; JetBrains Mono → figmaMono. Both loaded via Google Fonts in `index.html`.

### Token namespaces

| Prefix | Examples |
|---|---|
| `--color-*` | `--color-primary`, `--color-block-lime`, `--color-hairline` |
| `--space-*` | `--space-xs` (8px) … `--space-section` (96px) |
| `--radius-*` | `--radius-md` (8px), `--radius-pill` (50px), `--radius-full` (9999px) |
| `--font-size-*` | `--font-size-display-xl` (86px) … `--font-size-caption` (12px) |
| `--font-weight-*` | `--font-weight-body` (320) … `--font-weight-card-title` (700) |
| `--line-height-*` | per role |
| `--letter-spacing-*` | per role |

### Utility classes (all from `src/styles/tokens.css`)

**Typography**: `.type-display-xl`, `.type-display-lg`, `.type-headline`, `.type-subhead`, `.type-card-title`, `.type-body-lg`, `.type-body`, `.type-body-sm`, `.type-link`, `.type-button`, `.type-eyebrow`, `.type-caption`

**Buttons** (all pill-shaped — no square buttons): `.btn-primary`, `.btn-secondary`, `.btn-tertiary`, `.btn-icon`, `.btn-icon-inverse`, `.btn-magenta`

**Color blocks** (pastel section panels): `.color-block` + modifier `.color-block-lime`, `.color-block-lilac`, `.color-block-cream`, `.color-block-mint`, `.color-block-pink`, `.color-block-coral`, `.color-block-navy`

**Cards**: `.card` (hairline border, canvas bg), `.card-soft` (surface-soft bg, no border)

**Forms**: `.input`

### Rules

- Never hardcode hex colors, px spacing, or border-radius values — always use `var(--token)`.
- Never more than one `.btn-primary` visible in the same viewport.
- Never two color-blocks adjacent without `var(--space-section)` white-canvas gap between them.
- `.type-eyebrow` and `.type-caption` only — never use `var(--font-mono)` in body copy.
- For page → color-block mapping and JSX examples, see `.opencode/skills/ui-patterns.md`.

## Gotchas

- `pnpm dev` alone does NOT start the Express server. Run both `pnpm dev` and `pnpm server` concurrently.
- `CLAUDE.md` has more detail but is stale in places (e.g. lists Vite 5, React 18 — actual versions are Vite 8, React 19 per `package.json`).
- No test framework or CI configured yet.
- No prettier configured — ESLint flat config only.
- `.env` and `.env.local` are gitignored. No `.env.example` committed yet.
