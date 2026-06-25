---
description: Stop PostgreSQL and Keycloak containers (containers are kept; data in named volumes is fully preserved)
---

Stop both containers without removing them:

```bash
docker stop skysafe-postgres skysafe-keycloak
```

This keeps the containers and all data intact:
- `skysafe_postgres_data` — all database rows, schema, users, submissions
- `keycloak_data` — realm config, users, client registrations

Confirm both are stopped:

```bash
docker ps --filter "name=skysafe" --format "table {{.Names}}\t{{.Status}}"
```

An empty table means both containers are stopped. Restart anytime with `/docker-up`.
