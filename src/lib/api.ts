import type { Submission, SubmissionStatus } from '../types/submission'

// All requests go through the Vite proxy: /api → http://localhost:8000
const BASE = '/api'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Upserts the Keycloak user, records the login session, and returns the
 *  ISO timestamp of the user's previous session (or null for first login). */
export async function syncUser(params: {
  keycloak_id: string
  email: string
  full_name: string
  role: string
}): Promise<{ user_id: string; last_login_at: string | null }> {
  const res = await fetch(`${BASE}/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Auth sync failed (HTTP ${res.status})`)
  return res.json() as Promise<{ user_id: string; last_login_at: string | null }>
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

/** Fetch all submissions — used by CAAS Inspection Officers. */
export async function fetchAllSubmissions(): Promise<Submission[]> {
  const res = await fetch(`${BASE}/submissions`)
  if (!res.ok) throw new Error(`Failed to fetch submissions (HTTP ${res.status})`)
  const rows = (await res.json()) as DbSubmissionRow[]
  return rows.map(rowToSubmission)
}

/** Fetch submissions belonging to one public user identified by Keycloak ID. */
export async function fetchUserSubmissions(keycloak_id: string): Promise<Submission[]> {
  const res = await fetch(`${BASE}/submissions?keycloak_id=${encodeURIComponent(keycloak_id)}`)
  if (!res.ok) throw new Error(`Failed to fetch submissions (HTTP ${res.status})`)
  const rows = (await res.json()) as DbSubmissionRow[]
  return rows.map(rowToSubmission)
}

/** Create a new submission record in the database. */
export async function createSubmission(data: {
  id: string
  building_name: string
  address: string
  keycloak_id: string
  file_name: string
  file_size: number
  file_path: string
}): Promise<void> {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create submission (HTTP ${res.status})`)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface DbSubmissionRow {
  id: string
  building_name: string
  address: string
  status: string
  file_name: string | null
  file_size: number | null
  file_path: string | null
  submitted_at: string
  updated_at: string
  submitter_id: string
  submitter_name: string | null
  submitter_email: string | null
}

function rowToSubmission(row: DbSubmissionRow): Submission {
  return {
    id:             row.id,
    buildingName:   row.building_name,
    address:        row.address,
    submitterName:  row.submitter_name ?? '',
    submitterEmail: row.submitter_email ?? '',
    submittedAt:    row.submitted_at,
    status:         row.status as SubmissionStatus,
    fileName:       row.file_name ?? '',
    fileSize:       row.file_size ?? 0,
  }
}
