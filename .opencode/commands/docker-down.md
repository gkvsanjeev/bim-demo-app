---
description: Stop PostgreSQL and Keycloak containers (data is preserved in named volumes)
---

```bash
docker compose down
```

This stops and removes the containers but **preserves all data** in the named volumes:
- `skysafe_postgres_data` — all database rows, schema, users, submissions
- `keycloak_data` — realm config, users, client registrations

To also wipe all data and start fresh (destructive — use only when resetting for a clean demo):

```bash
docker compose down -v
```

After a full wipe, you must re-run schema init and seeding on next `docker compose up -d`:

```bash
# Schema auto-applies on first container start (db/init.sql is mounted as init script)
docker compose up -d
# Wait for healthy, then seed
pnpm db:seed
```
