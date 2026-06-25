# CAAS SkySAFE 2.0 — GIS Client Application Requirements

## 1. Project Overview

**SkySAFE** is the GIS Client Application for the **CAAS SkySAFE 2.0** programme — a building-height consultation system run by the Civil Aviation Authority of Singapore. The platform digitizes the aviation safety review process for proposed building structures near airports.

### What it does

1. Allows the public to submit building proposals (IFC+SG BIM files) for aviation safety review.
2. Renders submitted buildings in an interactive 3D map alongside surrounding structures, OLS surfaces, ILS templates, and Composite Height Templates.
3. Surfaces automated compliance-check results — OLS intersections, ILS impact, Radar line-of-sight, and GFA — to CAAS officers.
4. Drives the end-to-end review and approval workflow from submission to Letter of Consent (LOC).

---

## 2. Actors & Roles

| Role | Access | Primary Functions |
|---|---|---|
| **Public User (Requestor)** | Internet | Login, submit building proposals with BIM files, track application status, reply to queries, receive LOC |
| **CAAS Inspection Officer (IO)** | Intranet | View assigned submissions, open 3D map viewer, review compliance results, run additional GIS validations, raise queries, submit for approval |
| **ADP Approving Officer (AO)** | Intranet | Review queued approvals, view 3D scene, generate/edit/issue draft LOC, return to IO with comments, reject with remarks |

---

## 3. Core Features

| Epic | Description |
|---|---|
| **Application Submission** | Public users submit building proposals with IFC+SG BIM packages, supporting documents, and metadata (building name, address, applicant details) |
| **BIM Processing & Validation** | Backend validates IFC+SG files against CORENET-X standards (consumed via API) |
| **Geospatial Analysis** | Automated checks: OLS intersection, ILS impact, Radar line-of-sight, GFA compliance (consumed via API, results displayed in map viewer) |
| **3D Visualization** | Interactive ArcGIS Scene with building explorer, layer controls, basemap gallery, coordinate conversion, and measurement tools |
| **CAAS Division Review** | IO reviews submissions, views compliance results, runs additional validations, raises queries, routes for approval |
| **ADP Processing** | Processing officer manages approval queue, adds conditions, escalates to AO |
| **LOC Generation** | AO issues final Letter of Consent with conditions, returns rejected applications with remarks |
| **Notifications & Reporting** | Status updates, query notifications, and PDF report generation |

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript (strict), Vite 8 |
| **Package Manager** | pnpm |
| **GIS / Mapping** | ArcGIS Maps SDK 5.0 (`@arcgis/map-components`, `@arcgis/core`) |
| **UI Components** | Esri Calcite Components |
| **Routing** | React Router v7 |
| **Auth** | OIDC via react-oidc-context + Keycloak |
| **Backend** | Express 5, TypeScript |
| **Database** | PostgreSQL |
| **PDF Generation** | jsPDF |
| **File Handling** | JSZip (client-side validation), Express file upload |

---

## 5. Architecture

### Repository Layout

```
bim-demo-app/
├── src/
│   ├── app/              # Router, auth provider, protected route
│   ├── features/
│   │   ├── auth/         # Login, callback, unauthorized
│   │   ├── dashboard/    # SubmissionForm, PublicDashboard, CaasDashboard
│   │   └── map-viewer/   # Scene, panels (layers, search, tools, radar, basemap)
│   ├── lib/              # API client, submission store, helpers
│   ├── types/            # Domain types (submission.ts)
│   └── config/           # Auth configuration
├── server/               # Express API (auth sync, submissions CRUD)
└── public/               # Static assets, dev uploads
```

### Integration Points

| System | Protocol | Purpose |
|---|---|---|
| **SkySAFE Backend / Workflow Manager** | REST | Auth, submission CRUD, routing, queries, notifications |
| **iEP — Validation API** | REST | IFC+SG compliance validation results |
| **iEP — Processing API** | REST | OLS / ILS / Radar / GFA assessment results |
| **iEP — ArcGIS Portal** | ArcGIS REST | Basemap, Scene service, GIS layers (LOD2 buildings, OLS, ILS templates) |
| **Keycloak (OIDC)** | OAuth 2.0 / OIDC | User authentication and session management |

The frontend **consumes** these services — it does not build them. BIM file transfer to iEP happens server-side via SFTP relay.

---

## 6. Routes & Access Control

| Path | Component | Roles |
|---|---|---|
| `/login` | LoginPage | Public |
| `/auth/callback` | CallbackPage | Public |
| `/dashboard` | DashboardPage | All authenticated |
| `/submit` | SubmissionForm | `public_user` only |
| `/map/:applicationId` | App (ArcGIS Scene) | `caas_io`, `adp_ao` |

Protected by `<ProtectedRoute>` component enforcing role-based access.

---

## 7. API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/sync` | Upserts Keycloak user into local DB, records login session, returns last login timestamp |

### Submissions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/submissions` | Returns all submissions (CAAS view) or user's own submissions (filter by `keycloak_id`) |
| `POST` | `/api/submissions` | Creates a new submission with building details, file metadata, and initial status |

### File Upload (Dev)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Writes uploaded file to `public/uploads/` (dev only) |

---

## 8. Key Technical Constraints

### ArcGIS Non-Negotiables

1. **Vite exclusion** — All `@arcgis/*` and `@esri/*` packages must be in `optimizeDeps.exclude`. Pre-bundling breaks ArcGIS initialization.
2. **Individual component imports** — Import each web component from `@arcgis/map-components/components/<name>` before JSX use.
3. **Await `viewOnReady()`** — Always await `sceneEl.viewOnReady()` before accessing `map`, `allLayers`, or analysis APIs.
4. **No `basemap` with `item-id`** — When loading a scene via `item-id`, leave `basemap` unset to avoid silent crashes.
5. **Type declarations** — New ArcGIS widgets require manual JSX intrinsic element declarations in `src/types.d.ts`.

### TypeScript

- `strict: true` — No `any` without a `// FIXME(<area>): <reason>` comment.
- `verbatimModuleSyntax: true`, `moduleResolution: "Bundler"`, `target: "ES2023"`.
- `noEmit: true` — Type-checking is separate from build.

### Styling

- Feature-scoped CSS modules (`*.module.css`) until a UI kit is chosen.
- ArcGIS theme stylesheet imported once in `main.tsx`.

---

## 9. Environment Variables

All prefixed `VITE_` for client exposure:

```
VITE_API_BASE_URL=          # SkySAFE backend base URL
VITE_IEP_PORTAL_URL=        # ArcGIS Portal URL (hosted by iEP)
VITE_IEP_SCENE_BUILDINGS_URL=   # LOD2 surrounding buildings Scene Layer
VITE_IEP_SCENE_OLS_URL=     # OLS surfaces Scene Layer
VITE_AUTH_CLIENT_ID=        # OIDC client ID (TBD)
```

Never commit `.env` or `.env.local` — they are gitignored.

---

## 10. Open Questions

These items affect implementation and require clarification from CAAS:

- **Supporting documents** — Number, format, size limits, and validation checks alongside IFC+SG files.
- **BIM format scope** — Confirm IFC+SG only (no Revit submissions).
- **Workflow Manager** — Existing system vs new COTS solution.
- **Sample BIM file** — Availability of a sample IFC+SG file for development.
- **GIS layer availability** — OLS/ILS/Radar layers and their source agencies.
- **App architecture** — Single Internet-facing app with auth vs separate Intranet app for IO/AO.
- **Template format** — Composite Height Templates and ILS Technical Templates format (assumed ESRI Scene Layers).
- **Routing rules** — How submissions are routed to CAAS divisions.
- **LOC conditions** — Mandatory vs supplementary conditions and their count.
- **Digital signature** — Whether LOC requires a digital signature.

---

## 11. Key Terminology

| Term | Meaning |
|---|---|
| **BIM** | Building Information Model |
| **IFC+SG** | Singapore profile of IFC — CORENET-X compliant BIM format |
| **CORENET-X** | Singapore's BIM e-submission platform |
| **iEP** | Information Experimentation Platform — backend GIS + data platform (ArcGIS stack) |
| **OLS** | Obstacle Limitation Surfaces — 3D aviation safeguarding surfaces around airports |
| **ILS** | Instrument Landing System — radio navigation aid with technical-template surfaces |
| **GFA** | Gross Floor Area — checked against a pre-defined limit |
| **LOC** | Letter of Consent — final approval document issued to the Public User |
| **ADP** | Aerodrome Planning — the division that owns processing and approving |
| **LOD2** | Level-of-Detail 2 — simplified 3D building geometry with roof shapes |
