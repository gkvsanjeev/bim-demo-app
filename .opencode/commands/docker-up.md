---
description: Start PostgreSQL and Keycloak containers (data persists in named volumes — no seeding needed)
---

Start the containers. If they already exist (stopped after Docker Desktop restart), start them directly to avoid a name-conflict error from compose:

```bash
docker start skysafe-postgres skysafe-keycloak 2>/dev/null || docker compose up -d
```

This starts:
- **skysafe-postgres** → `postgresql://skysafe:skysafe_dev@localhost:5432/skysafe`
- **skysafe-keycloak** → `http://localhost:18080` (admin / admin)

Both use named volumes (`skysafe_postgres_data`, `keycloak_data`) so all data from the previous session is retained. No need to re-run `db:seed` or reconfigure Keycloak.

Confirm both are up:

```bash
docker ps --filter "name=skysafe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Wait for `skysafe-postgres` to show `Up` before starting the API server with `pnpm server`.
