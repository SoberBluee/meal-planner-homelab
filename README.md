# Meal Planner

A household meal planner and shopping list app for homelab use. Plan meals, maintain an essentials template, build merged shopping lists, and export to clipboard or Apple Notes.

## Setup

```bash
cd meal-planner
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Compose (local)

Starts MySQL, Redis and the Next.js app with hot reload:

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000). The app binds the project directory into the container, so code changes reload. Schema is applied with `npm run db:push` on startup.

Stop with `Ctrl+C` or `docker compose down`. Add `-v` to `down` if you also want to wipe the MySQL volume.

## Environment

| Variable | Description |
|----------|-------------|
| `APP_PIN` | Shared household PIN used at login |
| `AUTH_SECRET` | Secret for signing session cookies |
| `COOKIE_SECURE` | Set `true` when serving the app over HTTPS |
| `DB_HOST` | MySQL host (e.g. `127.0.0.1` or your StatefulSet service DNS) |
| `DB_PORT` | MySQL port (default `3306`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `REDIS_HOST` | Redis host for caching. Leave unset to disable the cache |
| `REDIS_PORT` | Redis port (default `6379`) |
| `REDIS_PASSWORD` | Redis password, if your Redis requires auth |
| `REDIS_DB` | Redis database index (default `0`) |
| `REDIS_TTL_SECONDS` | Cache expiry in seconds (default `300`) |
| `LOG_DIR` | Directory for daily access logs (default `/var/log/mealplanner`). Files are named `access-YYYY-MM-DD.log` (UTC date) |
| `LOG_LEVEL` | Pino log level (default `info`) |

Meals, ingredients and essentials reads are cached in Redis and cleared on every write. If Redis is unreachable the app logs a warning and reads MySQL directly.

## Scripts

- `npm run dev` — development server
- `npm run build && npm start` — production
- `npm run db:push` — apply database schema
- `npm run test:merge` — run ingredient merge tests

## Homelab deploy

```bash
npm run build
pm2 start npm --name meal-planner -- start
```

Point nginx or Caddy at `http://localhost:3000`.

For Kubernetes, point the `DB_*` variables at your MySQL StatefulSet service, for example:

- `DB_HOST=mysql.mealplanner.svc.cluster.local`
- `DB_PORT=3306`
- `DB_USER=mealplanner`
- `DB_PASSWORD=<password>`
- `DB_NAME=mealplanner`

Point the `REDIS_*` variables at your Redis StatefulSet service, for example `REDIS_HOST=mealplanner-redis-svc`, `REDIS_PORT=6379`, `REDIS_PASSWORD=<password>`.

## Flow

1. **Meals** — add meals with structured ingredients and optional price
2. **Essentials** — maintain your staples template
3. **Shop** — select meals, confirm essentials, review merged list
4. **Export** — copy as text or share to Apple Notes (mobile Safari)
