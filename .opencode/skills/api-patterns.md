# API Patterns — SkySAFE 2.0 Express Server

> These are the actual patterns in use in `server/index.ts` and `server/db.ts`.
> Follow them exactly when adding new routes. Do not invent alternatives.

---

## Database Connection

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

## Route Structure

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

## Upsert Pattern (users table)

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

## Foreign Key Lookup + 400 Guard

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

## Query Filter Pattern (optional query param)

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

## Status History Pattern

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

## HTTP Status Codes in Use

| Situation | Code |
|---|---|
| Successful read or upsert | `200` (default — `res.json(data)`) |
| Resource created | `201` — `res.status(201).json({ id })` |
| Missing required field or user not found | `400` — `res.status(400).json({ error: '...' })` |
| Unexpected server error | `500` — `res.status(500).json({ error: '...' })` |

---

## API Contract Reference

All endpoints are proxied through Vite at `/api/*` → `http://localhost:8000`.  
Full request/response shapes are documented in `plan.md` § 3. API Contract.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/sync` | Upsert Keycloak user, record login, return `last_login_at` |
| `GET` | `/submissions` | All submissions (no param) or user's own (`?keycloak_id=`) |
| `POST` | `/submissions` | Create new submission + initial status history row |
| `POST` | `/upload` | Dev-only: write file bytes to `public/uploads/` |

---

## What NOT to do

- No raw string interpolation in SQL: `WHERE id = '${id}'` → **SQL injection**. Use `$1`.
- No second `Pool` instance — import from `server/db.ts`.
- No `app_role` or `submission_status` values as plain strings without the `::enum` cast.
- No `async/await` mixing with `.then()` chains in the same handler.
- Do not add new routes without updating `plan.md` § 3. API Contract.
