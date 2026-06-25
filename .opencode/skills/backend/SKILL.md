---
name: backend
description: Implements the Express API server, PostgreSQL schema, and database operations. Use when creating or modifying API endpoints, database queries, or server configuration.
---

# Backend — SkySAFE 2.0

Express 5 API server with PostgreSQL database for auth sync and submission management.

## Server Setup

- **File**: `server/index.ts`
- **Port**: 8000 (env `PORT`)
- **Middleware**: `cors()`, `express.json()`
- **DB Connection**: `server/db.ts` — `DATABASE_URL` env var, defaults to `skysafe/skysafe_dev@localhost:5432`

## Vite Proxy

Requests to `/api/*` are proxied to `http://localhost:8000` with the `/api` prefix stripped.

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | Profile from Keycloak JWT | `keycloak_id` (unique), `email`, `full_name`, `role` (enum) |
| `login_sessions` | Audit trail of logins | `user_id` (FK), `logged_in_at`, `ip_address` |
| `submissions` | Core entity — one BIM application per row | `id` (PK, CAAS-YYYYMMDD-XXXXX), `building_name`, `address`, `submitter_id` (FK), `status` (enum), `file_name`, `file_size`, `file_path` |
| `submission_status_history` | Immutable audit trail | `submission_id` (FK), `from_status`, `to_status`, `changed_by` (FK), `notes` |

### Enums

- **app_role**: `public_user`, `caas_io`, `adp_ao`
- **submission_status**: `Submitted`, `Under Review`, `Approved`, `Returned`

### Views

- **user_last_login** — Most recent login per user
- **submission_list** — Enriched submission data with submitter name/email

### Indexes

- `idx_submissions_submitted_at` — Dashboard sort
- `idx_submissions_submitter_id` — Public user filter
- `idx_submissions_status` — Status filter tabs
- `idx_login_sessions_user_recent` — Last login lookup
- `idx_status_history_submission` — Audit trail order

### Schema Files

- `db/init.sql` — Runs automatically on Docker container start
- `db/seed.sql` — Seed data (`pnpm db:seed`)

## API Endpoints

### Auth

**`POST /api/auth/sync`**

Upserts Keycloak user into local DB, records login session, returns last login timestamp.

Request:
```json
{
  "keycloak_id": "uuid",
  "email": "user@example.com",
  "full_name": "John Tan",
  "role": "public_user"
}
```

Response:
```json
{
  "user_id": "uuid",
  "last_login_at": "2026-01-15T10:30:00Z"
}
```

### Submissions

**`GET /api/submissions`**

- With `keycloak_id` query param → returns only that user's submissions
- Without → returns all submissions (CAAS view)
- Ordered by `submitted_at DESC`
- Response includes `submitter_name` and `submitter_email` from `submission_list` view

**`POST /api/submissions`**

Creates a new submission with building details, file metadata, and initial status.

Request:
```json
{
  "id": "CAAS-20260115-JUG5P",
  "building_name": "Changi Business Park Tower 3",
  "address": "10 Changi Business Park Central 2",
  "keycloak_id": "uuid",
  "file_name": "building.zip",
  "file_size": 15728640,
  "file_path": "/uploads/building.zip"
}
```

Response: `201 Created` → `{"id": "CAAS-20260115-JUG5P"}`

Returns `400` if user not found. Creates initial status history entry with `Submitted` status.

### File Upload (Dev Only)

**`POST /upload`**

- Headers: `Content-Type: application/octet-stream`, `X-Filename: building.zip`
- Body: raw file bytes
- Writes to `public/uploads/<filename>` (filename sanitised to safe chars)
- Response: `{"path": "/uploads/building.zip"}`

## Integration Points

| System | Protocol | Purpose |
|---|---|---|
| **SkySAFE Backend / Workflow Manager** | REST | Auth, submission CRUD, routing, queries, notifications |
| **iEP — Validation API** | REST | IFC+SG compliance validation results |
| **iEP — Processing API** | REST | OLS / ILS / Radar / GFA assessment results |
| **iEP — ArcGIS Portal** | ArcGIS REST | Basemap, Scene service, GIS layers |
| **Keycloak (OIDC)** | OAuth 2.0 / OIDC | User authentication and session management |

## Local Development

```bash
# Terminal 1: Vite dev server (frontend)
pnpm dev

# Terminal 2: Express API server
pnpm server

# Terminal 3: Database (if not running)
docker run --name skysafe-postgres -e POSTGRES_PASSWORD=skysafe -p 5432:5432 -d postgres:15

# Seed database
pnpm db:seed
```

## Environment Variables

### Client (prefixed `VITE_`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Express server URL |
| `VITE_IEP_PORTAL_URL` | iEP ArcGIS Portal |
| `VITE_IEP_SCENE_BUILDINGS_URL` | LOD2 buildings Scene Layer |
| `VITE_IEP_SCENE_OLS_URL` | OLS surfaces Scene Layer |
| `VITE_AUTH_CLIENT_ID` | Keycloak OIDC client ID |

### Server

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Express server port (default 8000) |
