# GymPro Admin API (Node.js)

Backend for the **GYMPRO** admin panel (Figma): dashboard KPIs, members, leads, plans, billing, attendance, trainers, schedule, equipment, reports, and settings.

## Stack

- **Node.js** + **Express** + **TypeScript**
- **Prisma** + **SQLite** (dev); switch to PostgreSQL via `DATABASE_URL`
- **JWT** auth with roles: `ADMIN`, `GENERAL_MANAGER`, `STAFF`, `TRAINER`

## Quick start

```bash
cd gym-backend
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

API base: `http://localhost:4000/api/v1`

**Swagger UI:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)  
OpenAPI JSON: `http://localhost:4000/api/docs/openapi.json`

### Demo login (after seed)

| Field | Value |
|--------|--------|
| Email | `sarah@gympro.local` |
| Password | `admin123` |

Send header: `Authorization: Bearer <token>`

Optional multi-location header: `X-Location-Id: <locationId>`

## Main endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Dashboard | `GET /dashboard/overview` |
| Search | `GET /search?q=` |
| Locations | `GET /locations`, `POST /locations` |
| Members | `GET/POST /members`, `GET/PATCH/DELETE /members/:id` |
| Visitors | `GET/POST /visitors`, `POST /visitors/:id/convert` |
| Plans | `GET/POST /membership-plans`, `PATCH/DELETE /membership-plans/:id` |
| Payments | `GET /payments`, `GET /payments/summary`, `POST /payments` |
| Attendance | `GET /attendance`, `GET /attendance/live`, check-in/out |
| Trainers | CRUD `/trainers` |
| Schedule | `/schedule/classes`, book, status |
| Equipment | CRUD `/equipment` |
| Reports | `/reports/members`, `/reports/revenue`, `/reports/attendance` |
| Settings | `GET/PUT /settings` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |

Responses use `{ success, data, meta? }`.

## Frontend (Vite)

Set CORS in `.env`:

```env
CORS_ORIGIN=http://localhost:5173
```

Example axios setup:

```ts
const api = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  headers: { Authorization: `Bearer ${token}` },
});
```

## Production notes

- Change `JWT_SECRET` and disable `POST /auth/bootstrap` (already blocked in production).
- Use PostgreSQL: `DATABASE_URL="postgresql://..."` and `provider = "postgresql"` in `prisma/schema.prisma`.