---
name: submission-flow
description: Implements the public user submission flow — SubmissionForm with IFC+SG validation, file upload, and dashboard views. Use when creating or modifying submission forms, file upload logic, or dashboard tables.
---

# Submission Flow

Handles the public user journey: submit building proposals, track status, and view submissions.

## Routes

| Path | Component | Roles |
|---|---|---|
| `/submit` | SubmissionForm | `public_user` only |
| `/dashboard` | DashboardPage | All authenticated |

## SubmissionForm

Fields:
- Application Reference (auto-generated, read-only)
- Building Name (required)
- Address (required)
- Applicant Name (required, pre-filled from auth)
- Email Address (required, pre-filled from auth)
- BIM Package Upload (required, `.zip` only)

### File Upload Validation

1. File must be `.zip` format
2. File size <= 100MB
3. Zip contents must contain `.ifc`, `.prj`, `.wld3` files with matching base names
4. Invalid zip shows specific error (missing IFC, missing PRJ, etc.)

### Upload Flow

1. Upload file via `POST /upload` (dev) with `X-Filename` header
2. Create submission via `POST /api/submissions`
3. Navigate to `/dashboard` on success

## Dashboard Views

### PublicDashboard (public_user)

- Fetches user's submissions via `GET /api/submissions?keycloak_id=<uuid>`
- Table: Application ID, Building Name, Status, Submitted Date
- Status filter tabs: All, Submitted, Under Review, Approved, Returned
- Search input for filtering by ID or building name
- "New Application" button navigates to `/submit`

### CaasDashboard (caas_io, adp_ao)

- Fetches all submissions via `GET /api/submissions`
- Table: Application ID, Building Name, Address, Submitter, Date, Status, Action
- Status filter tabs with color-coded badges
- "View in Map" button navigates to `/map/:applicationId`

## API Endpoints

### POST /api/auth/sync

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

### GET /api/submissions

- With `keycloak_id` → returns only that user's submissions
- Without → returns all submissions (CAAS view)

### POST /api/submissions

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

## Type Definitions

Located in `src/types/submission.ts`:

- `Submission` — Full submission entity
- `SubmissionStatus` — 'Submitted' | 'Under Review' | 'Approved' | 'Returned'
- `AppRole` — 'public_user' | 'caas_io' | 'adp_ao'
- `SubmissionCreate` — POST body for creating a submission
- `AuthSyncResponse` — Auth sync response

## API Client

Located in `src/lib/api.ts`:

- `syncAuth(keycloak_id, email, full_name, role)`
- `fetchAllSubmissions()`
- `fetchUserSubmissions(keycloak_id)`
- `createSubmission(data)`

Uses `VITE_API_BASE_URL` env var. Base URL is proxied through Vite `/api/*` to Express on `:8000`.
