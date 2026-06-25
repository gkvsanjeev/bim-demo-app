# CONTEXT.md — SkySAFE 2.0 Current Project State

> Read this file at the start of every AI session. It answers "where are we?" so you don't have to re-derive it from git history.

---

## What this project is

**BIM-DEMO-APP** is the GIS Client Application for CAAS SkySAFE 2.0 — a building-height consultation system for the Civil Aviation Authority of Singapore. Public users submit IFC+SG BIM files for aviation safety review; CAAS officers review them via a 3D ArcGIS map viewer.

Full requirements → `requirements.md`  
Architecture + API contracts → `plan.md`  
Task breakdown → `tasks.md`

---

## Current build state (as of 2026-06-25)

### What is working end-to-end

| Feature | Status | Key files |
|---|---|---|
| OIDC login via Keycloak | ✅ Done | `src/features/auth/` |
| User sync to PostgreSQL on login | ✅ Done | `server/index.ts` POST /auth/sync |
| Role-based routing (public_user / caas_io / adp_ao) | ✅ Done | `src/app/ProtectedRoute.tsx` |
| Public user submission form with IFC+SG zip validation | ✅ Done | `src/features/dashboard/SubmissionForm.tsx` |
| Submission stored in PostgreSQL | ✅ Done | `server/index.ts` POST /submissions |
| Public dashboard (user's own submissions) | ✅ Done | `src/features/dashboard/PublicDashboard.tsx` |
| CAAS dashboard (all submissions, filters, search) | ✅ Done | `src/features/dashboard/CaasDashboard.tsx` |
| ArcGIS 3D Scene viewer | ✅ Done | `src/features/map-viewer/App.tsx` |
| Building explorer, basemap gallery, layer list | ✅ Done | `src/features/map-viewer/` |
| Assessment panel (iEP compliance results) | ✅ Done | `src/features/map-viewer/AssessmentPanel.tsx` |
| Radar viewshed panel with PDF export | ✅ Done | `src/features/map-viewer/RadarViewshedPanel.tsx` |
| Scene tools (measurement, line-of-sight, viewshed) | ✅ Done | `src/features/map-viewer/SceneToolsPanel.tsx` |
| Express API server + PostgreSQL (Docker) | ✅ Done | `server/`, `db/init.sql` |

### What is pending

| Phase | Tasks | What it covers |
|---|---|---|
| Phase 1.5 — Design System | Tasks 1.5.1–1.5.10 | Apply DESIGN.md tokens (CSS variables, fonts, buttons, cards) to all existing components |
| Phase 7 — Production Readiness | Tasks 7.1–7.5 | Vercel deployment, serverless functions, loading states, final lint pass |

---

## How to run locally

```bash
# 1. Start PostgreSQL (Docker)
docker run --name skysafe-postgres \
  -e POSTGRES_USER=skysafe \
  -e POSTGRES_PASSWORD=skysafe_dev \
  -e POSTGRES_DB=skysafe \
  -p 5432:5432 -d postgres:15

# 2. Apply schema (first time only)
docker exec -i skysafe-postgres psql -U skysafe -d skysafe < db/init.sql

# 3. Seed test users (first time only)
docker exec -i skysafe-postgres psql -U skysafe -d skysafe < db/seed.sql

# 4. Start API server
pnpm server          # Express on :8000

# 5. Start frontend
pnpm dev             # Vite on :5173
```

Vite proxies `/api/*` → `http://localhost:8000` (configured in `vite.config.ts`).

---

## Test users (Keycloak skysafe realm)

| Email | Password | Role |
|---|---|---|
| `public@test.local` | `password` | `public_user` |
| `officer@test.local` | `password` | `caas_io` |
| `approver@test.local` | `password` | `adp_ao` |

---

## Key gotchas — read before touching any file

1. **ArcGIS Vite pre-bundling** — All `@arcgis/*` and `@esri/*` packages must stay in `optimizeDeps.exclude` in `vite.config.ts`. Removing them causes a silent crash: `Cannot read properties of undefined (reading 'fromJSON')`.

2. **`viewOnReady()` is mandatory** — Never access `sceneEl.map`, `allLayers`, or analysis APIs before `await sceneEl.viewOnReady()` resolves.

3. **No `basemap` with `item-id`** — If `<arcgis-scene>` uses `item-id`, do NOT also set a `basemap` attribute. It crashes silently.

4. **`pnpm` only** — Do not run `npm install` or `yarn`. Use `pnpm` exclusively.

5. **DB must be running before `pnpm server`** — The Express server connects on startup; it will crash if PostgreSQL isn't up.

6. **Design system not yet applied** — Components currently use hardcoded CSS values. Phase 1.5 is the task to apply `DESIGN.md` tokens. Don't introduce new hardcoded values in the meantime.

---

## AI tooling in this project

| Tool | Purpose | Config |
|---|---|---|
| **OpenCode** | Primary AI coding agent | `opencode.json`, `.opencode/` |
| **Claude Code** | Secondary AI coding agent | `CLAUDE.md`, `AGENTS.md` |
| **Playwright MCP** | Browser automation for UI verification | `.playwright-mcp/` (runtime, gitignored) |

### OpenCode agents

| Agent | Mode | When to use |
|---|---|---|
| `plan` | primary | "What's the next task?" / "What's the status?" |
| `review` | subagent | After any implementation — checks ArcGIS rules, TypeScript, design tokens |
| `submission-flow` | subagent | Submission form, dashboards, file upload |
| `auth` | subagent | Keycloak OIDC, ProtectedRoute, role logic |
| `backend` | subagent | Express routes, PostgreSQL queries |
| `map-viewer` | subagent | ArcGIS scene, panels, analysis tools |
| `design-system` | subagent | CSS variables, design tokens, component styles |

### Skills (domain constraints injected into agent context)

| Skill | Covers |
|---|---|
| `arcgis-rules/` | ArcGIS SDK non-negotiables (Vite exclusion, viewOnReady, type declarations) |
| `design-system/` | DESIGN.md tokens → CSS variables, component classes |
| `backend/` | Express + PostgreSQL patterns for this project |
| `map-viewer/` | ArcGIS analysis tools, scene patterns |
| `submission-flow/` | Form validation, file upload, IFC+SG zip structure |
| `react-patterns.md` | React hooks, component conventions |
| `typescript-rules/` | strict mode rules, no-any policy |
| `api-patterns.md` | Express route patterns, pg pool usage, error handling |

---

## Architecture in one paragraph

React 19 + TypeScript frontend (Vite) talks to an Express 5 API server over a Vite proxy (`/api/*`). The server writes to PostgreSQL via the `pg` pool. Auth is OIDC via Keycloak — the frontend never touches passwords, only JWTs. On login, `CallbackPage` calls `/api/auth/sync` to upsert the Keycloak user into the local `users` table. Submissions are stored in PostgreSQL with a status-history audit trail. The 3D map viewer is ArcGIS Maps SDK 5.0 using Stencil web components (`<arcgis-scene>`) initialized with `viewOnReady()`. iEP backend services (validation, processing, ArcGIS Portal) are consumed via REST — not built here.
