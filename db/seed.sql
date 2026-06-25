-- =============================================================================
-- SkySAFE 2.0 — Seed data for local development
-- Run once after the schema is initialised:
--   docker exec -i skysafe-postgres psql -U skysafe -d skysafe < db/seed.sql
-- =============================================================================

-- ─── Users (mirroring Keycloak skysafe realm) ────────────────────────────────
INSERT INTO users (keycloak_id, email, full_name, role)
VALUES
  ('521829e2-0a4c-4987-8f3a-36e7a4e43f08', 'public@test.local',    'Public User',  'public_user'),
  ('060863f2-570f-4eee-9a54-98c7097a53d1', 'officer@test.local',   'CAAS Officer', 'caas_io'),
  ('63fe3ac6-6f6a-4a22-a56b-801f1b8a6857', 'approver@test.local',  'ADP Approver', 'adp_ao'),
  ('09ac60df-4203-486b-938d-ec77e14ac6c6', 'testio@skysafe.local',  'Test Officer', 'caas_io')
ON CONFLICT (keycloak_id) DO UPDATE
  SET email     = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role      = EXCLUDED.role;


-- ─── Submissions (all owned by public.user) ───────────────────────────────────
INSERT INTO submissions (id, building_name, address, submitter_id, status, file_name, file_size, file_path, submitted_at)
SELECT
  s.id, s.building_name, s.address,
  u.id,
  s.status::submission_status,
  s.file_name, s.file_size, s.file_path,
  s.submitted_at::timestamptz
FROM (VALUES
  ('CAAS-20260523-A1B2C', 'Changi Business Park Tower 3',  '10 Changi Business Park Central 2, Singapore 486030', 'Under Review', 'changi_biz_park_t3.zip', 4521000, '/uploads/changi_biz_park_t3.zip', '2026-05-23T09:15:00Z'),
  ('CAAS-20260521-D3E4F', 'Marina Bay Financial Centre 4', '8 Marina Blvd, Singapore 018981',                    'Submitted',   'mbfc4_bim.zip',           7832000, '/uploads/mbfc4_bim.zip',          '2026-05-21T14:30:00Z'),
  ('CAAS-20260519-G5H6I', 'Toa Payoh HDB Development',     '456 Toa Payoh Lorong 8, Singapore 310456',           'Approved',    'toa_payoh_dev.zip',        3200000, '/uploads/toa_payoh_dev.zip',       '2026-05-19T11:00:00Z'),
  ('CAAS-20260515-J7K8L', 'One Raffles Quay Extension',    '1 Raffles Quay, Singapore 048583',                   'Returned',    'orq_extension.zip',        6100000, '/uploads/orq_extension.zip',       '2026-05-15T08:45:00Z')
) AS s(id, building_name, address, status, file_name, file_size, file_path, submitted_at)
JOIN users u ON u.keycloak_id = '521829e2-0a4c-4987-8f3a-36e7a4e43f08'
ON CONFLICT (id) DO NOTHING;


-- ─── Status history (initial Submitted entry for each submission) ─────────────
INSERT INTO submission_status_history (submission_id, to_status, changed_by, changed_at)
SELECT s.id, 'Submitted', u.id, s.submitted_at
FROM submissions s
JOIN users u ON u.keycloak_id = '521829e2-0a4c-4987-8f3a-36e7a4e43f08'
WHERE NOT EXISTS (
  SELECT 1 FROM submission_status_history h WHERE h.submission_id = s.id
);


-- ─── Login sessions (one historical session per user) ─────────────────────────
INSERT INTO login_sessions (user_id, logged_in_at)
SELECT u.id, ls.logged_in_at::timestamptz
FROM (VALUES
  ('521829e2-0a4c-4987-8f3a-36e7a4e43f08', '2026-05-20T08:00:00Z'),
  ('060863f2-570f-4eee-9a54-98c7097a53d1', '2026-05-20T08:30:00Z'),
  ('63fe3ac6-6f6a-4a22-a56b-801f1b8a6857', '2026-05-20T09:00:00Z'),
  ('09ac60df-4203-486b-938d-ec77e14ac6c6', '2026-05-25T10:00:00Z')
) AS ls(keycloak_id, logged_in_at)
JOIN users u ON u.keycloak_id = ls.keycloak_id
WHERE NOT EXISTS (
  SELECT 1 FROM login_sessions s WHERE s.user_id = u.id
);
