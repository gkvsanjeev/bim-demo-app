---
description: Apply the database schema from db/init.sql (only needed after a full volume wipe)
---

> **You normally do NOT need this.** The schema is auto-applied by Docker on first container start
> via the `./db/init.sql:/docker-entrypoint-initdb.d/01_init.sql` mount in `docker-compose.yml`.
> Docker only runs init scripts when the volume is empty (first start or after `docker compose down -v`).

If you need to manually re-apply the schema (e.g., after a volume wipe on a running container):

```bash
docker exec -i skysafe-postgres psql -U skysafe -d skysafe < db/init.sql
```

Then seed:

```bash
pnpm db:seed
```

## What the schema creates

- Enums: `app_role` (`public_user`, `caas_io`, `adp_ao`), `submission_status` (`Submitted`, `Under Review`, `Approved`, `Returned`)
- Tables: `users`, `login_sessions`, `submissions`, `submission_status_history`
- Views: `user_last_login`, `submission_list`
- Indexes: all lookup columns (submitted_at, submitter_id, status, keycloak_id, user_recent login)
- Triggers: `updated_at` auto-updated on `users` and `submissions`

Source of truth: `db/init.sql` — all schema changes go here.
