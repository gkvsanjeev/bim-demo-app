# API Patterns — SkySAFE 2.0

> Two backend services are consumed by this frontend. Each has its own start command and patterns. Follow the section that matches the service you're working on.

---

## Service 1 — iEP Processing API (FastAPI / Python)

**Repo**: `C:\Users\d1336061\OneDrive - NCS PTE LTD\Projects\ECAAS\Application\bim-info-extraction`

### Starting the service

```bash
cd "C:\Users\d1336061\OneDrive - NCS PTE LTD\Projects\ECAAS\Application\bim-info-extraction"
uv run uvicorn iep.api.main:app --reload
```

The `cd` is required — uvicorn resolves `iep.api.main` relative to the project root where `pyproject.toml` lives (source package is `src/iep/`). Running from any other directory will fail with a `ModuleNotFoundError`.

Runs on **`http://localhost:8000`** by default.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check — returns `{"status": "ok"}` |
| `POST` | `/processing/extract-shell` | Extract exterior shell from IFC file, return structured JSON + trigger background PDF |
| `GET` | `/processing/analysis-report/{application_ref}` | Download the PDF report (202 if still generating, 404 if no result) |
| `POST` | `/processing/analyse` | Run selected aviation safety assessments; PDF is generated synchronously so URL is immediately valid |

### Request / response models

All bodies are **pydantic v2 models** defined in `src/iep/models/`. Never pass raw dicts across the API boundary.

`POST /processing/extract-shell` body:
```json
{ "application_ref": "APP-2025-001", "ifc_filename": "building.ifc" }
```

`POST /processing/analyse` body:
```json
{
  "application_ref": "APP-2025-001",
  "ifc_filename": "building.ifc",
  "assessments": {
    "composite_height_template": true,
    "ols_intersection": true,
    "ils_technical_template": true,
    "radar": false,
    "gfa": true
  }
}
```

### Error handling

- Errors are **structured, not thrown** — all failure paths return the same `ProcessingResponse` shape with a non-empty `errors` array identifying the `stage` and `detail`.
- Never expect a non-2xx HTTP error from this API; always check `response.errors`.
- `errors` is always a list (empty on success; one entry per failed stage on partial failure).

### Key constraints

- The IFC file must already be on disk at `data/ifc/<ifc_filename>` — the API does not accept file uploads.
- Results are cached as JSON in `results/`. A second call with the same `application_ref` returns the cached result immediately.
- All geospatial coordinates are in **SVY21 (EPSG:3414)**, not WGS84.

---

## Service 2 — SkySAFE Express Server (Node.js / PostgreSQL)

> These are the actual patterns in use in `server/index.ts` and `server/db.ts`.
> Follow them exactly when adding new routes. Do not invent alternatives.

### Database Connection

`server/db.ts` exports a single shared `Pool`. Import it in every route file — never create a second pool.

```ts
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'skysafe',
  user:     process.env.PGUSER     ?? 'skysafe',
  password: process.env.PGPASSWORD ?? 'skysafe_dev',
})
```

**Rules:**
- Always use `$1`, `$2`, … placeholders. Never string-interpolate values into SQL.
- Pass the values array as the second argument to `pool.query(sql, [val1, val2])`.
- Cast PostgreSQL enums explicitly: `$4::app_role`, `$5::submission_status`.

---

### Route Structure

All routes live in `server/index.ts`. Each route:
1. Destructures and types `req.body` / `req.query` inline.
2. Runs queries sequentially (no parallel `Promise.all` unless reads are independent).
3. Returns the appropriate HTTP status code explicitly.

```ts
app.post('/resource', async (req, res) => {
  const { field_one, field_two } = req.body as {
    field_one: string
    field_two: string
  }

  // validate presence
  if (!field_one || !field_two) {
    res.status(400).json({ error: 'field_one and field_two are required' })
    return
  }

  const result = await pool.query<{ id: string }>(
    `INSERT INTO table (col_one, col_two) VALUES ($1, $2) RETURNING id`,
    [field_one, field_two],
  )

  res.status(201).json({ id: result.rows[0].id })
})
```

---

### Upsert Pattern (users table)

Use `ON CONFLICT … DO UPDATE` to handle both first-time inserts and subsequent logins atomically.

```ts
const result = await pool.query<{ id: string }>(
  `INSERT INTO users (keycloak_id, email, full_name, role)
   VALUES ($1, $2, $3, $4::app_role)
   ON CONFLICT (keycloak_id) DO UPDATE
     SET email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role
   RETURNING id`,
  [keycloak_id, email, full_name, role],
)
const userId = result.rows[0].id
```

---

### Foreign Key Lookup + 400 Guard

When a route needs a local `user_id` from a `keycloak_id`, always guard against missing users:

```ts
const userResult = await pool.query<{ id: string }>(
  'SELECT id FROM users WHERE keycloak_id = $1',
  [keycloak_id],
)
if (userResult.rows.length === 0) {
  res.status(400).json({ error: 'User not found — call /auth/sync first' })
  return
}
const userId = userResult.rows[0].id
```

---

### Query Filter Pattern (optional query param)

Branching on an optional `?keycloak_id=` query param without code duplication:

```ts
app.get('/submissions', async (req, res) => {
  const { keycloak_id } = req.query

  if (keycloak_id) {
    const result = await pool.query(
      `SELECT sl.* FROM submission_list sl
       JOIN users u ON u.id = sl.submitter_id
       WHERE u.keycloak_id = $1
       ORDER BY sl.submitted_at DESC`,
      [keycloak_id],
    )
    res.json(result.rows)
  } else {
    const result = await pool.query(
      'SELECT * FROM submission_list ORDER BY submitted_at DESC',
    )
    res.json(result.rows)
  }
})
```

---

### Status History Pattern

Every status change gets an immutable audit row. Insert it immediately after the main record:

```ts
await pool.query(
  `INSERT INTO submission_status_history (submission_id, to_status, changed_by)
   VALUES ($1, $2::submission_status, $3)`,
  [submissionId, newStatus, changedByUserId],
)
```

Do NOT update `submission_status_history` rows — they are append-only.

---

### HTTP Status Codes in Use

| Situation | Code |
|---|---|
| Successful read or upsert | `200` (default — `res.json(data)`) |
| Resource created | `201` — `res.status(201).json({ id })` |
| Missing required field or user not found | `400` — `res.status(400).json({ error: '...' })` |
| Unexpected server error | `500` — `res.status(500).json({ error: '...' })` |

---

### API Contract Reference

All endpoints are proxied through Vite at `/api/*` → `http://localhost:8000`.  
Full request/response shapes are documented in `plan.md` § 3. API Contract.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/sync` | Upsert Keycloak user, record login, return `last_login_at` |
| `GET` | `/submissions` | All submissions (no param) or user's own (`?keycloak_id=`) |
| `POST` | `/submissions` | Create new submission + initial status history row |
| `POST` | `/upload` | Dev-only: write file bytes to `public/uploads/` |

---

### What NOT to do (Express server)

- No raw string interpolation in SQL: `WHERE id = '${id}'` → **SQL injection**. Use `$1`.
- No second `Pool` instance — import from `server/db.ts`.
- No `app_role` or `submission_status` values as plain strings without the `::enum` cast.
- No `async/await` mixing with `.then()` chains in the same handler.
- Do not add new routes without updating `plan.md` § 3. API Contract.
