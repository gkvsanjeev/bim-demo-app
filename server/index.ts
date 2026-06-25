import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

// ---------------------------------------------------------------------------
// POST /auth/sync
// Upserts the Keycloak user into `users`, records a login session, and
// returns the timestamp of the previous session (shown as "Last Login" in UI).
// Body: { keycloak_id, email, full_name, role }
// ---------------------------------------------------------------------------
app.post('/auth/sync', async (req, res) => {
  const { keycloak_id, email, full_name, role } = req.body as {
    keycloak_id: string
    email: string
    full_name: string
    role: string
  }

  const userResult = await pool.query<{ id: string }>(
    `INSERT INTO users (keycloak_id, email, full_name, role)
     VALUES ($1, $2, $3, $4::app_role)
     ON CONFLICT (keycloak_id) DO UPDATE
       SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role
     RETURNING id`,
    [keycloak_id, email, full_name, role],
  )
  const userId = userResult.rows[0].id

  // Capture previous last login before inserting the new session
  const prevResult = await pool.query<{ logged_in_at: Date }>(
    `SELECT logged_in_at FROM login_sessions
     WHERE user_id = $1
     ORDER BY logged_in_at DESC
     LIMIT 1`,
    [userId],
  )
  const lastLoginAt: string | null = prevResult.rows[0]?.logged_in_at?.toISOString() ?? null

  await pool.query('INSERT INTO login_sessions (user_id) VALUES ($1)', [userId])

  res.json({ user_id: userId, last_login_at: lastLoginAt })
})

// ---------------------------------------------------------------------------
// GET /submissions[?keycloak_id=<uuid>]
// Returns all submissions (CAAS view) or only the submitter's own rows.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// POST /submissions
// Creates a new submission and its initial status-history entry.
// Body: { id, building_name, address, keycloak_id, file_name, file_size, file_path }
// ---------------------------------------------------------------------------
app.post('/submissions', async (req, res) => {
  const { id, building_name, address, keycloak_id, file_name, file_size, file_path } = req.body as {
    id: string
    building_name: string
    address: string
    keycloak_id: string
    file_name: string
    file_size: number
    file_path: string
  }

  const userResult = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE keycloak_id = $1',
    [keycloak_id],
  )
  if (userResult.rows.length === 0) {
    res.status(400).json({ error: 'User not found — call /auth/sync first' })
    return
  }
  const submitter_id = userResult.rows[0].id

  await pool.query(
    `INSERT INTO submissions (id, building_name, address, submitter_id, file_name, file_size, file_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, building_name, address, submitter_id, file_name, file_size, file_path],
  )

  await pool.query(
    `INSERT INTO submission_status_history (submission_id, to_status, changed_by)
     VALUES ($1, 'Submitted', $2)`,
    [id, submitter_id],
  )

  res.status(201).json({ id })
})

const PORT = Number(process.env.PORT ?? 8000)
app.listen(PORT, () => {
  console.log(`SkySAFE API server → http://localhost:${PORT}`)
})
