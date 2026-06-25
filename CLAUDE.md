# CLAUDE.md — BIM-DEMO-APP (CAAS SkySAFE 2.0 GIS Client)

> Loaded automatically by Claude Code at session start. Keep this file lean and current. Long-form docs live in `/docs`.

---

## 1. What this project is

**BIM-DEMO-APP** is the **GIS Client Application** for the **CAAS SkySAFE 2.0** programme — a building-height consultation system run by the Civil Aviation Authority of Singapore (CAAS). It is the public-facing and CAAS-internal frontend that:

1. Lets a **Public User** submit a building proposal (an IFC+SG BIM file plus supporting documents) for aviation-safety review.
2. Renders the submitted building as a 3D model on a Singapore basemap alongside surrounding buildings, OLS surfaces, ILS technical templates, and Composite Height Templates.
3. Surfaces **iEP** (Information Experimentation Platform) compliance-check results — OLS intersections, ILS impact, Radar line-of-sight, and GFA — to CAAS officers.
4. Drives the **review and approval workflow**: Public User → CAAS Inspection Officer → ADP Approving Officer → Letter of Consent (LOC).

This repository currently contains the **demo / PoC** of the GIS Client. Backend services (SFTP relay, validation/processing APIs, workflow engine) are outside this repo — we **consume** them.

### Actors and roles (3-tier model)

| Role | Network | Primary functions |
|---|---|---|
| **Public User (Requestor)** | Internet | Login, start submission, upload IFC+SG BIM + supporting docs, receive submission ID, view 3D map of own submission, reply to queries, track status, receive LOC |
| **CAAS Inspection Officer (IO)** | Intranet | View assigned submissions, open 3D map viewer, review iEP validation results, run additional GIS validations, raise queries to Requestor, submit for approval |
| **ADP Approving Officer (AO)** | Intranet | Review queued approval requests, view 3D scene, generate/edit/issue draft LOC, return to IO with comments, reject with remarks |

> Source of truth for stories: `docs/requirements/iEP_Skysafe_2_0_UserStories_Ver1_0_Clarifications_20260430.xlsx` (48 stories US-01…US-48 across 7 epics).

---

## 2. Tech stack (current, agreed)

- **Build / runtime**: Vite 5+, React 18+, TypeScript (strict)
- **Package manager**: **pnpm** (do NOT use npm or yarn in this repo)
- **GIS / Mapping**: **ArcGIS Maps SDK for JavaScript 5.0** — `@arcgis/map-components` (Stencil web components) + `@arcgis/core` (types)
- **Linting**: ESLint flat config (`eslint.config.js`)
- **Module style**: ESM only, `"type": "module"` in `package.json`

### Pending / not yet decided (flag before assuming)

- State management (Redux Toolkit vs Zustand vs React Query only) — **not chosen yet**
- Router (React Router vs TanStack Router) — **not chosen yet**
- UI component library (Mantine vs MUI vs shadcn/ui) — **not chosen yet** (design tokens are defined; a component lib is additive)
- Auth (Singpass / Corppass for Public User; AD/OIDC for CAAS Intranet users) — **TBD with CAAS**
- API client (fetch wrapper vs axios vs ky) — **TBD**
- Testing (Vitest + React Testing Library is the leaning) — **TBD**

When asked to add any of the above, **first confirm the choice** rather than picking silently.

---

## 3. Repository layout

```
bim-demo-app/
├── .claude/                 # Claude Code local settings (do not commit secrets)
├── public/                  # Static assets served as-is
├── src/
│   ├── assets/              # Images, icons, fonts
│   ├── App.tsx              # Root component
│   ├── App.css
│   ├── main.tsx             # Vite entry; mounts <App />
│   ├── index.css            # Global styles
│   └── types.d.ts           # Global ambient types
├── index.html               # Vite HTML entry
├── vite.config.ts
├── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml      # present but currently unused — keep only if monorepo planned
```

### Target structure (once features grow)

Introduce these folders only when the first concrete file needs them — do not pre-create empty scaffolding:

```
src/
├── app/                     # App shell, routing, providers
├── features/                # Feature-sliced modules (submission, mapViewer, review, loc)
│   ├── submission/
│   ├── map-viewer/
│   ├── review-workflow/
│   └── loc-generation/
├── components/              # Shared, dumb UI components
├── lib/                     # Cross-cutting helpers (api client, formatters)
├── services/                # API integrations (iEP, SkySAFE backend, ArcGIS Portal)
├── hooks/                   # Reusable hooks
├── types/                   # Shared domain types (Submission, ValidationResult, etc.)
└── config/                  # Runtime config, env loading
```

---

## 4. Functional modules (mapped to epics)

| Epic | Stories | Module home |
|---|---|---|
| Application Submission | US-01 … US-08 | `features/submission` |
| BIM Processing & iEP Integration | US-09 … US-13 | Backend (consumed via `services/iep`) |
| iEP BIM Extraction & Geospatial Analysis | US-14 … US-20 | Backend (results displayed in `features/map-viewer` + `features/review-workflow`) |
| 3D Visualisation via iEP | US-21 … US-25 | `features/map-viewer` |
| CAAS Division Review Workflow | US-26 … US-34 | `features/review-workflow` |
| ADP Processing Officer Workflow | US-35 … US-41 | `features/review-workflow` |
| ADP Approving Officer Workflow | US-42 … US-45 | `features/loc-generation` |
| Notifications & Reporting | US-46 … US-48 | `features/notifications` (cross-cutting) |

---

## 5. Integration points (consumed, not built here)

| System | Protocol | Purpose |
|---|---|---|
| **SkySAFE backend / Workflow Manager** | REST (TBD) | Auth, submission CRUD, routing, queries, notifications, audit |
| **iEP — Validation API** | REST | CORENET-X / IFC validation result for a given BIM filename |
| **iEP — Processing API** | REST | OLS / ILS / Radar / GFA assessment results (structured text) |
| **iEP — ArcGIS Portal / Server** | ArcGIS REST (via `@arcgis/core`) | Basemap, Scene service for proposed building, surrounding buildings (LOD2), OLS surfaces, ILS templates, Composite Height Templates |
| **SFTP** | SFTP | BIM file transfer (handled server-side; **not** from this frontend) |

The frontend **never** uploads to SFTP directly — it POSTs the BIM file to the SkySAFE backend, which relays via SFTP to iEP.

---

## 6. ArcGIS JS SDK 5.0 — house rules

### Package roles (do not mix)

| Package | Role | Import rule |
|---|---|---|
| `@arcgis/map-components` | Stencil-based web components (`<arcgis-scene>`, `<arcgis-building-explorer>`, etc.) | Import each component individually from `@arcgis/map-components/components/<name>` **before** using it in JSX |
| `@arcgis/core` | SDK core classes — primarily used for **TypeScript types** | Avoid importing runtime classes directly; can conflict with the map-components bundle |
| `@esri/calcite-components` | Esri design system web components | Installed but not currently in use in the main app |

### 🚨 Critical Vite constraint (causes silent crashes if missed)

All `@arcgis/*` and `@arcgis/charts-components` packages **must** be listed in `optimizeDeps.exclude` in `vite.config.ts`. Vite's pre-bundling breaks ArcGIS's internal module initialisation order and causes:

```
Cannot read properties of undefined (reading 'fromJSON')
```

This is **not** a lazy-add — it must be there from the start for any ArcGIS package added.

### 🚨 Web component ↔ React JSX bridge

ArcGIS map components are custom elements, not React components. Their JSX types are **manually declared** in `src/types.d.ts`:

```ts
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'arcgis-scene': ...,
      // etc.
    }
  }
}
```

When introducing any new ArcGIS widget (`<arcgis-legend>`, `<arcgis-zoom>`, etc.), **add its type declaration to `src/types.d.ts` first**.

### 🚨 Scene initialisation — always await `viewOnReady()`

Get a `ref` on `<arcgis-scene>`, then inside `useEffect`:

```ts
const view = await sceneEl.viewOnReady();
// Only now is sceneEl.map / allLayers / view safe to access
```

Do **not** access `sceneEl.map`, `allLayers`, or call any analysis APIs before `viewOnReady()` resolves.

### 🚨 Basemap rule — never set `basemap` when using `item-id`

When loading a web scene via `item-id`, the portal item defines its own basemap. Setting a second `basemap` attribute on `<arcgis-scene>` triggers `Basemap.fromJSON` before the module is ready and **crashes silently**. Leave `basemap` unset in that case.

### General rules

- Use **`SceneView`** (via `<arcgis-scene>`) for all 3D work. `MapView` only for ancillary 2D panels if ever needed.
- Render the proposed building via a **Scene Layer** (multipatch) published by iEP — never parse or render IFC on the client.
- Surrounding buildings: **LOD2 Scene Layer** from iEP.
- For line-of-sight (US-25): `<arcgis-line-of-sight>` widget.
- Always set Portal URL / API key via env vars — never hardcode.
- Stylesheet: import `@arcgis/core/assets/esri/themes/light/main.css` **once** in `main.tsx`.
- Full-screen scene: `src/index.css` resets `html`, `body`, `#root` to `height: 100%; margin: 0`. Do **not** add `width`/`height` constraints to `#root`.

---

## 7. Coding conventions

### TypeScript

- `strict: true` is non-negotiable. No `any` without `// FIXME(<name>): <reason>` comment.
- Prefer `type` for unions/aliases, `interface` for object shapes that may be extended.
- Domain types live in `src/types/` and are imported by both UI and services.

### React

- **Function components only.** No class components.
- Hooks: prefix custom hooks with `use*`. Keep them pure and side-effect-narrow.
- Prefer composition over prop drilling — colocate state at the feature root and pass down, or use a state library once chosen.
- Async data: use a query layer (React Query likely). Until decided, encapsulate fetches behind a `services/*` function, **not** inline `fetch` in components.

### File naming

- Components: `PascalCase.tsx` (e.g. `SubmissionForm.tsx`)
- Hooks: `camelCase.ts` starting `use` (e.g. `useSubmission.ts`)
- Services / utilities: `camelCase.ts`
- Tests: `*.test.ts(x)` colocated with the unit under test.

### Imports

- Absolute imports via `@/` alias (configure in `vite.config.ts` + `tsconfig.app.json` when first needed).
- No circular imports. If you create one, refactor immediately.

### Styling

The design system is defined in **`DESIGN.md`** (repo root). CSS custom properties for every token are in **`src/styles/tokens.css`**, imported globally before `index.css` in `main.tsx`.

**Rules — enforce on every UI task:**
- **Read `DESIGN.md` before writing any new component.** Identify which component recipe (button, card, color-block, input) applies before touching CSS.
- **Always use token variables.** Never hardcode colors (`#000`), spacing (`16px`), font sizes, or border radii. Use `var(--color-primary)`, `var(--space-lg)`, `var(--radius-pill)`, etc.
- Use `.type-*` utility classes from `tokens.css` for typography, or copy their individual property variables into a CSS module.
- Use `.btn-primary`, `.btn-secondary`, `.color-block`, `.card`, `.input` utility classes from `tokens.css` directly in JSX, or extend them in a CSS module.
- Scope layout to the component with `*.module.css`. Layout properties only — no color, font, or spacing overrides that conflict with tokens.
- **Font substitute:** Inter (variable) for figmaSans; JetBrains Mono for figmaMono. Both are loaded via Google Fonts in `index.html`. Never set `font-family` to anything else.
- For UI skill patterns with JSX examples, read `.opencode/skills/ui-patterns.md`.
- Do not introduce Tailwind, MUI, or Mantine without confirming.

---

## 8. Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # start Vite dev server
pnpm build                # tsc + vite build → dist/
pnpm preview              # preview the production build locally
pnpm lint                 # eslint over src/
```

Add a new script in `package.json` rather than running long ad-hoc commands.

---

## 9. Environment variables

All env vars must be prefixed `VITE_` to be exposed to the client. Add new vars to a committed `.env.example` (without secrets) when introduced.

Expected vars (add as features land — do not pre-create unused ones):

```
VITE_API_BASE_URL=          # SkySAFE backend base URL
VITE_IEP_PORTAL_URL=        # ArcGIS Portal URL hosted by iEP
VITE_IEP_BASEMAP_ITEM_ID=   # Portal item ID for CAAS basemap
VITE_IEP_SCENE_BUILDINGS_URL=   # Scene Layer URL for LOD2 surrounding buildings
VITE_IEP_SCENE_OLS_URL=     # Scene Layer URL for OLS surfaces
VITE_AUTH_CLIENT_ID=        # OIDC/Singpass client id (TBD)
```

Never commit `.env` or `.env.local`. They are gitignored.

---

## 10. Open clarifications (NCS questions to CAAS — affect implementation)

These come straight from the user-stories sheet. Until answered, **flag any related decision as an assumption** in code comments and PRs:

- **US-01**: Number/format/size of supporting documents alongside IFC+SG; checks to run on them.
- **US-02**: Confirm all submissions are IFC+SG only (no Revit).
- **US-03**: Existing Workflow Manager vs new COTS — assume new for now.
- **US-10**: Scope of IFC Model Checker (CORENET-X is in CORENET-X system, not iEP).
- **US-14**: Need sample IFC+SG BIM file from CAAS.
- **US-20**: Availability of OLS/ILS/Radar GIS layers and source agencies.
- **US-21**: Single Internet-facing app with auth vs separate Intranet app (current assumption: **separate Intranet experience** for IO and AO).
- **US-21**: Basemap source — assume **3D basemap, hosted by iEP ArcGIS Portal**.
- **US-22**: Format of Composite Height Templates / ILS Technical Templates (assume ESRI-compatible Scene Layers / multipatch).
- **US-26**: Routing rules to CAAS divisions — not yet defined.
- **US-31**: Mandatory vs supplementary conditions; count of conditions.
- **US-44 / US-45**: Confirm 3-role model (Requestor → IO → AO); digital signature on LOC?

---

## 11. Housekeeping items in this repo

- `package-lock.json` and `pnpm-lock.yaml` coexist — **delete `package-lock.json`**; we are pnpm-only.
- `pnpm-workspace.yaml` exists but no workspaces declared — either declare packages or remove the file.
- `dist/` should be gitignored (verify `.gitignore` contains it).
- `tsconfig.tsbuildinfo` should be gitignored.

---

## 12. Working agreement with Claude Code

When you (Claude) work in this repo:

1. **Confirm before scaffolding.** If a request implies adding a router, state lib, UI kit, or test framework, ask which option to use before installing.
2. **Small, focused diffs.** Prefer one feature or one fix per change. Don't rewrite working code in passing.
3. **Match existing conventions** in any file you touch. If conventions conflict with this CLAUDE.md, raise it — do not silently diverge.
4. **Cite the user story (US-xx)** in commit messages and PR descriptions for any feature work, e.g. `feat(submission): US-01 BIM upload form`.
5. **Add new env vars to `.env.example`** the same commit that introduces them.
6. **Never hardcode** ArcGIS Portal URLs, API base URLs, or credentials. Use env vars.
7. **Type everything from API responses.** Generate / hand-write types in `src/types/` and import from services.
8. **Surface assumptions** in code comments with the format `// ASSUMPTION(US-XX): <what and why>` so they are greppable.
9. **Ask before installing heavy deps** (anything >100KB gzipped, anything with peer-dep risk).
10. **Don't touch backend concerns.** SFTP, BIM extraction, OLS analysis — these are iEP / SkySAFE backend. We consume their APIs only.

---

## 13. Key terminology cheat-sheet

| Term | Meaning |
|---|---|
| **BIM** | Building Information Model |
| **IFC+SG** | Singapore profile of IFC — CORENET-X-compliant BIM format |
| **CORENET-X** | Singapore's BIM e-submission platform; defines the IFC+SG profile |
| **iEP** | Information Experimentation Platform — backend GIS + data platform (ArcGIS stack + Databricks) |
| **OLS** | Obstacle Limitation Surfaces — 3D aviation safeguarding surfaces around airports |
| **ILS** | Instrument Landing System — radio nav aid; has its own technical-template surfaces |
| **GFA** | Gross Floor Area — checked against a pre-defined limit |
| **LOC** | Letter of Consent — the final approval document issued to the Public User |
| **ADP** | Aerodrome Planning (the division that owns processing and approving) |
| **LOD2** | Level-of-Detail 2 — simplified 3D building geometry with roof shapes |
| **Multipatch** | ESRI 3D feature class storing closed 3D shapes |

---

_Last updated: keep this date and a one-line note when material sections change._
