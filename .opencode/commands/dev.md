---
description: Start the full local development environment — Docker containers, Express API server, and Vite dev server
---

Start these in order across three terminals:

**Terminal 1 — Docker services (if not already running)**

```bash
docker compose up -d
```

Wait until `docker compose ps` shows `skysafe-postgres` as `healthy`.

**Terminal 2 — Express API server**

```bash
pnpm server
```

Starts on `http://localhost:8000`. Vite proxies `/api/*` to this server.

**Terminal 3 — Vite dev server**

```bash
pnpm dev
```

Starts on `http://localhost:5173`. Open this URL in the browser.

---

## Access points

| Service | URL | Credentials |
|---|---|---|
| Frontend | `http://localhost:5173` | Login via Keycloak |
| Express API | `http://localhost:8000` | Internal — called via Vite proxy |
| Keycloak Admin | `http://localhost:18080/admin` | admin / admin |
| PostgreSQL | `localhost:5432` | skysafe / skysafe_dev / db: skysafe |

## Test users (Keycloak skysafe realm)

| Email | Password | Role | Dashboard |
|---|---|---|---|
| `public@test.local` | `password` | `public_user` | Public dashboard + submit form |
| `officer@test.local` | `password` | `caas_io` | CAAS dashboard + map viewer |
| `approver@test.local` | `password` | `adp_ao` | CAAS dashboard + map viewer |
