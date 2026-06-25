---
description: Seed the database with test users and sample submissions (only needed after a full volume wipe)
---

> **You normally do NOT need this.** Named volumes preserve all data across container restarts.
> Only run this after `docker compose down -v` (full volume wipe) or on a fresh machine.

Ensure the postgres container is running and healthy first:

```bash
docker compose ps
```

Then seed:

```bash
pnpm db:seed
```

This runs: `docker exec -i skysafe-postgres psql -U skysafe -d skysafe < db/seed.sql`

## What gets seeded

| Email | Role | Keycloak ID |
|---|---|---|
| `public@test.local` | `public_user` | `521829e2-...` |
| `officer@test.local` | `caas_io` | `060863f2-...` |
| `approver@test.local` | `adp_ao` | `63fe3ac6-...` |
| `testio@skysafe.local` | `caas_io` | `09ac60df-...` |

Plus sample submissions owned by `public@test.local`.

All inserts use `ON CONFLICT … DO UPDATE` so re-running seed is idempotent — it won't create duplicates.
