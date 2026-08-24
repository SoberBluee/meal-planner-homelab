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

## Flow

1. **Meals** — add meals with structured ingredients and optional price
2. **Essentials** — maintain your staples template
3. **Shop** — select meals, confirm essentials, review merged list
4. **Export** — copy as text or share to Apple Notes (mobile Safari)
