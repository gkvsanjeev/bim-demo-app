---
description: Start PostgreSQL and Keycloak containers (data persists in named volumes — no seeding needed)
---

Run the following command to start both services in the background:

```bash
docker compose up -d
```

This starts:
- **skysafe-postgres** → `postgresql://skysafe:skysafe_dev@localhost:5432/skysafe`
- **skysafe-keycloak** → `http://localhost:18080` (admin / admin)

Both use named volumes (`skysafe_postgres_data`, `keycloak_data`) so all data from the previous session is retained. No need to re-run `db:seed` or reconfigure Keycloak.

Wait for PostgreSQL to be healthy before starting the API server:

```bash
docker compose ps
```

Status should show `healthy` for `skysafe-postgres` before running `pnpm server`.
