# Weekendly waitlist

A pre-launch waitlist for Weekendly, an app for finding events in your city. People join with their details and see their place in line. The Weekendly team gets a private page listing everyone, with a CSV download.

**Stack:** React 19 (Vite) · Node.js 20 + Express · PostgreSQL 16 · Docker Compose

---

## How to run

You need Docker Desktop (or Docker Engine with Compose). Then:

```bash
docker compose up --build
```

| What | Where |
|---|---|
| Waitlist page | http://localhost:8080 |
| Team view | http://localhost:8080/team, password **`weekendly-team`** |
| Database (optional, for pgAdmin / psql) | `localhost:5433`, database / user / password: `weekendly` |

The first build takes a minute or two. The database table is created automatically on start-up. No `.env` file is needed, because every setting has a local default.

- Stop: `docker compose down` (the data is kept in the `weekendly-db-data` volume)
- Start again with an empty database: `docker compose down -v`, then `docker compose up`

### Configuration

All optional. Set them in your shell or in a `.env` file next to `docker-compose.yml`:

| Variable | Default | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | `weekendly-team` | Team view password |
| `SESSION_SECRET` | `change-me-in-production` | Signs the team session cookie |
| `DB_PASSWORD` | `weekendly` | Postgres password |

The defaults are for local use only. Change `ADMIN_PASSWORD` and `SESSION_SECRET` for any real deployment, and set `COOKIE_SECURE=true` on the API when it's served over HTTPS.

### Development mode (hot reload, optional)

```bash
docker compose up db                    # only the database, on localhost:5433
cd backend  && npm install && npm run dev   # API on http://localhost:3000 (reads backend/.env)
cd frontend && npm install && npm run dev   # UI on http://localhost:5173 (reads frontend/.env)
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` first. In dev mode the frontend calls the API on port 3000 directly, which CORS allows for `http://localhost:5173` only.

---

## What's implemented (checked against the brief)

| Requirement | Status | Where |
|---|---|---|
| React frontend, Node.js backend, PostgreSQL | ✅ | `frontend/`, `backend/`, `postgres:16` |
| Runs with a single `docker compose up` | ✅ | `docker-compose.yml`, healthchecks control start-up order |
| Form: full name, email, mobile, city (Ahmedabad, Mumbai, Delhi, Bengaluru, Pune, Other + city name), interests (one or more), WhatsApp updates, terms | ✅ | `WaitlistPage.jsx`. Interests are a multi-select. "Your city" appears only for Other |
| Shows how many people have joined | ✅ | `GET /api/waitlist/count`, shown on the page and updated after joining |
| Shows the person's position after joining | ✅ | `201 { position, count }` |
| Same email or mobile can't join twice; tell them they're on the list and show their position | ✅ | Unique indexes + `409 { position, matchedOn }`. Matching ignores email case and mobile format |
| Clear messages when input is wrong | ✅ | Message under each field (checked in the browser and again on the server). The cursor moves to the first wrong field |
| Team page listing everyone, newest first | ✅ | `/team` → `GET /api/admin/entries` |
| CSV download | ✅ | `GET /api/admin/entries.csv` |
| Only the team can open it | ✅ | Password login → signed HttpOnly cookie, checked by the API on every team request |
| README | ✅ | This file (plus design notes in `TECHNICAL_APPROACH.md`) |

### API

| Method | Path | Result |
|---|---|---|
| `GET` | `/api/waitlist/count` | `{ count }` |
| `POST` | `/api/waitlist` | `201 { position, count }` · `400 { fields }` · `409 { position, matchedOn, count }` · `429` |
| `POST` | `/api/admin/login` | `{ password }` → sets session cookie · `400` / `401` / `429` |
| `POST` | `/api/admin/logout` | Clears the cookie |
| `GET` | `/api/admin/me` | `200` if logged in, else `401` |
| `GET` | `/api/admin/entries` | `{ count, entries }`, newest first |
| `GET` | `/api/admin/entries.csv` | CSV file |

---

## Approach

Full design notes are in [TECHNICAL_APPROACH.md](TECHNICAL_APPROACH.md). In short:

- **Three containers:** `web` (nginx serving the React build and forwarding `/api` to the backend, so the browser sees one origin), `api` (Express), `db` (Postgres).
- **Validation in two places.** The browser checks for instant feedback; the server checks again and is authoritative. Both use the same rules and messages. The fixed lists (cities, interests, limits) live in one constants file on each side. The database also has `CHECK` constraints as a last safety net.
- **Duplicates are caught by the database.** Email (lower-cased) and mobile (stored as `+91XXXXXXXXXX`) have unique indexes. The API inserts first and treats a unique violation as "already joined". Checking first and then inserting would let two identical requests at the same moment both get in.
- **Position is gap-free.** Position = number of entries with `id <=` yours. The raw id isn't used, because Postgres skips ids when an insert fails.
- **Team view security lives in the API, not only in the React route.** React code runs in the visitor's browser and can be bypassed, so every `/api/admin/*` request is checked on the server.
- **Small, explainable stack.** Express, plain SQL with `pg`, no ORM, no UI library, plain CSS.

## Decisions where the brief isn't specific

1. **Mobile numbers are Indian only:** 10 digits starting 6–9, with `+91`, `91`, `0`, spaces and dashes accepted. All the listed cities are in India.
2. **Duplicate = same email OR same mobile**, after normalising (email case-insensitive, mobile format-insensitive). The reply says which one matched.
3. **The duplicate reply shows only the position**, never the name or other details of the existing entry.
4. **Team access = one shared password**, exchanged for an HttpOnly, SameSite=Strict, signed cookie that lasts 8 hours. There's a logout. Login is rate-limited to 10 failed tries per 15 minutes.
5. **The team page uses one URL** (`/team`). It shows the login form or the table depending on whether you're logged in.
6. **Rate limit on signups:** 10 per minute per IP, against spam.
7. **"Other" city is stored separately** (`city = 'Other'`, `city_other = 'Surat'`), so reports can group by the fixed list.
8. **Terms agreement is stored as a timestamp** (`terms_accepted_at`), which records *when* they agreed.
9. **The CSV is safe to open in Excel.** It's UTF-8 with a BOM, and text people typed that starts with `=`, `+`, `-` or `@` is prefixed with `'` so Excel won't run it as a formula.
10. **No pagination on the team page.** Fine at waitlist scale; listed under improvements.
11. **The database is published on port 5433**, so the team can browse it with pgAdmin. 5432 is often taken by a local Postgres.

## Known limitations

- The rate-limit counters live in memory. They reset when the API restarts and wouldn't be shared between several API instances.
- Showing "already on the list" lets someone check whether an email or mobile is registered. The brief requires it; only the position is revealed, and requests are rate-limited.
- If the team session expires and someone clicks **Download CSV**, the browser shows the `401` JSON instead of a file. Reloading the page brings back the login form.
- `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so it can't change a table that already exists. Schema changes would need a migration tool (see below).

## What I'd improve with more time

1. **Automated tests.** Unit tests for the validation rules (Vitest). API tests with Supertest against a test database (join, duplicates, validation errors, team auth). A Playwright end-to-end test of the form. CI running them plus `docker compose build`. They were left out on purpose to stay within 90 minutes. The code is ready for them: `createApp()` is separate from the server, and validation is a pure function.
2. **An ORM or query builder with migrations** (Prisma or Drizzle), replacing the single idempotent `schema.sql`.
3. **Shared validation and TypeScript.** One schema (e.g. zod) used by both frontend and backend, instead of the same rules written twice.
4. **Better team access.** Per-user accounts or Google sign-in limited to the company domain, plus a log of who exported the CSV.
5. **Anti-abuse.** Email verification (double opt-in), a CAPTCHA or honeypot field, and a Redis-backed rate limit.
6. **Team view at scale.** Pagination, search and filters (city, interests), streamed CSV, and a CSV download that handles an expired session gracefully.
7. **International phone numbers** with `libphonenumber-js`.
8. **Growth features.** Referral links ("move up the list by inviting friends") and a welcome email.
9. **Operations.** Structured logging, error tracking and basic metrics.

## How I used AI

I used **Claude Code** (Anthropic) in VS Code as a pair programmer throughout:

- **Planning:** it drafted `TECHNICAL_APPROACH.md` from the brief (architecture, data model, API, validation rules, security, time plan), which I reviewed before writing code.
- **Code:** it generated the scaffolding (Vite app, Express skeleton, Dockerfiles, compose file) and the first versions of the form, validation, API and team view. I steered the scope: I asked it to remove extras the brief didn't ask for (field hints, automated tests, an ORM), and to put those under "with more time" instead.
- **Checking:** it ran the API with `curl` (join, duplicate by email case and mobile format, validation errors, rate limit, login, a forged cookie, CSV) and checked the database constraints by inserting bad rows directly. I tested the form and team page in the browser.
- **Questions:** I used it to understand decisions, for example why the team page is protected in the API and not only in the React route, and how the session cookie works.

I've reviewed all the code and can explain and change any part of it. I didn't use a project rules or memory file (such as `CLAUDE.md`): the AI was guided by the brief, `TECHNICAL_APPROACH.md` and my instructions in the conversation.

## Time taken

About **1.5 hours** in total, roughly: planning about 10 min, scaffolding and setup about 15 min, waitlist form and API about 30 min, team view about 15 min, Docker, checks and README about 20 min.
