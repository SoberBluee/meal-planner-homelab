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
| `DATABASE_URL` | MySQL connection string (e.g. `mysql://user:pass@host:3306/db`) |

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

For Kubernetes, set `DATABASE_URL` to your MySQL StatefulSet service DNS, for example:

`mysql://mealplanner:<password>@mysql.mealplanner.svc.cluster.local:3306/mealplanner`

## Flow

1. **Meals** — add meals with structured ingredients and optional price
2. **Essentials** — maintain your staples template
3. **Shop** — select meals, confirm essentials, review merged list
4. **Export** — copy as text or share to Apple Notes (mobile Safari)
