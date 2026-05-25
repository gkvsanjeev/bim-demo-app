-- =============================================================================
-- SkySAFE 2.0 — PostgreSQL Schema
-- Runs automatically on first container start via /docker-entrypoint-initdb.d/
-- Requires PostgreSQL 13+ (gen_random_uuid() is built-in, no extension needed)
-- =============================================================================


-- ─── Utility function: keep updated_at current on every row modification ──────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── Enum: application roles ──────────────────────────────────────────────────
-- Mirrors the roles assigned in Keycloak realm_access.roles.
-- Keycloak is the authoritative source; this column is the app's local copy
-- so queries can join on role without decoding a JWT every time.

CREATE TYPE app_role AS ENUM (
  'public_user',   -- Internet: building owners, architects, agents (US-01…US-08)
  'caas_io',       -- Intranet: CAAS Inspection Officers           (US-26…US-34)
  'adp_ao'         -- Intranet: ADP Approving Officers             (US-42…US-45)
);


-- ─── Enum: submission lifecycle states ────────────────────────────────────────

CREATE TYPE submission_status AS ENUM (
  'Submitted',    -- Created by public user; awaiting IO assignment
  'Under Review', -- IO has opened and is actively reviewing the case
  'Approved',     -- AO has generated and issued the Letter of Consent (LOC)
  'Returned'      -- IO or AO returned to applicant with remarks for resubmission
);


-- =============================================================================
-- TABLE: users
-- =============================================================================
-- One row per application user, upserted from the Keycloak JWT on every login.
-- Keycloak handles password storage and SSO; this table stores only the
-- profile data the app needs for display and foreign-key joins.

CREATE TABLE users (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_id  VARCHAR(255) UNIQUE NOT NULL,  -- JWT 'sub' claim (Keycloak user UUID)
  email        VARCHAR(255) UNIQUE NOT NULL,  -- JWT 'email' claim
  full_name    VARCHAR(255),                  -- JWT 'name' claim
  role         app_role     NOT NULL,         -- highest-privilege role from realm_access.roles
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- =============================================================================
-- TABLE: login_sessions
-- =============================================================================
-- One row inserted on every successful OIDC callback.
-- The most recent row per user is displayed as "Last Login" in the UI.
-- Older rows form a login-activity audit trail.

CREATE TABLE login_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_in_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    INET        -- from X-Forwarded-For header; NULL if not available
);

-- "Give me the last login time for user X" — used by every page header load
CREATE INDEX idx_login_sessions_user_recent
  ON login_sessions (user_id, logged_in_at DESC);


-- =============================================================================
-- TABLE: submissions
-- =============================================================================
-- Core entity: one BIM height consultation application per row.
-- Created by a public_user; reviewed by caas_io; approved/returned by adp_ao.

CREATE TABLE submissions (
  id             VARCHAR(30)       PRIMARY KEY,      -- CAAS-YYYYMMDD-XXXXX (generated in app)
  building_name  VARCHAR(255)      NOT NULL,
  address        TEXT              NOT NULL,
  submitter_id   UUID              NOT NULL REFERENCES users(id),
  status         submission_status NOT NULL DEFAULT 'Submitted',
  file_name      VARCHAR(255),                       -- original .zip filename as uploaded
  file_size      BIGINT,                             -- bytes
  file_path      VARCHAR(500),                       -- server-side path, e.g. /uploads/foo.zip
  submitted_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TRIGGER submissions_set_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- CAAS dashboard: all submissions sorted newest-first
CREATE INDEX idx_submissions_submitted_at ON submissions (submitted_at DESC);
-- Public user dashboard: filter to submitter's own records
CREATE INDEX idx_submissions_submitter_id ON submissions (submitter_id);
-- CAAS dashboard status filter tabs
CREATE INDEX idx_submissions_status       ON submissions (status);


-- =============================================================================
-- TABLE: submission_status_history
-- =============================================================================
-- Immutable audit trail — every status transition (including initial creation)
-- appends one row. Never UPDATE or DELETE rows in this table.

CREATE TABLE submission_status_history (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  VARCHAR(30)       NOT NULL REFERENCES submissions(id),
  from_status    submission_status,               -- NULL for the initial 'Submitted' entry
  to_status      submission_status NOT NULL,
  changed_by     UUID              NOT NULL REFERENCES users(id),
  notes          TEXT,                            -- officer remarks or return reason
  changed_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Audit trail view for a single submission, ordered chronologically
CREATE INDEX idx_status_history_submission
  ON submission_status_history (submission_id, changed_at ASC);


-- =============================================================================
-- VIEWS (convenience — no extra tables)
-- =============================================================================

-- Last login per user (used by the API's /auth/sync endpoint)
CREATE VIEW user_last_login AS
  SELECT DISTINCT ON (user_id)
    user_id,
    logged_in_at
  FROM  login_sessions
  ORDER BY user_id, logged_in_at DESC;

-- Submission list enriched with submitter name (used by CAAS dashboard)
CREATE VIEW submission_list AS
  SELECT
    s.id,
    s.building_name,
    s.address,
    s.status,
    s.file_name,
    s.file_size,
    s.file_path,
    s.submitted_at,
    s.updated_at,
    u.id            AS submitter_id,
    u.full_name     AS submitter_name,
    u.email         AS submitter_email
  FROM  submissions s
  JOIN  users       u ON u.id = s.submitter_id;
