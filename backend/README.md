# DevFlow Backend (Tasks 2, 3 and 4)

REST API for DevFlow, built with Node.js, Express, TypeScript, Prisma (SQLite) and Zod.

Resources: **Authentication** (session-based), **Users**, **Projects**, **Tasks** (including a
dedicated task status endpoint), and **AI-assisted task generation** (Task 4, see
[below](#ai-assisted-task-generation-task-4)).

> This folder is a standalone service. The Task 1 frontend (the Next.js dashboard in the repository
> root) calls it directly: users, authentication/sessions, projects and tasks are all read from and
> written to this API, which persists them through Prisma. Only client and activity data stay
> frontend-local, since this API has no client/activity tables (see the root
> [`README.md`](../README.md) for the full picture).

## Contents

- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [Running the server](#running-the-server)
- [Scripts](#scripts)
- [Conventions](#conventions)
- [Health endpoint](#health-endpoint)
- [Authentication endpoints](#authentication-endpoints)
- [Users endpoints](#users-endpoints)
- [Projects endpoints](#projects-endpoints)
- [Tasks endpoints](#tasks-endpoints)
- [Task status endpoint](#task-status-endpoint)
- [AI-assisted task generation (Task 4)](#ai-assisted-task-generation-task-4)
- [Error responses](#error-responses)
- [Verifying the build](#verifying-the-build)
- [Persistence test](#persistence-test)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)

## Setup

Requires **Node.js 18.18 or newer**.

From a clean checkout:

```bash
cd backend
npm install
cp .env.example .env      # Windows (cmd): copy .env.example .env
npm run setup             # generates the Prisma client and creates the SQLite database
npm run dev               # http://localhost:4000/api
```

`npm run setup` runs `prisma generate` and `prisma migrate deploy`. It applies the committed migrations
in `prisma/migrations/` and creates `prisma/dev.db` with the `User`, `Project` and `Task` tables. It is
safe to run repeatedly: migrations that were already applied are skipped. See
[Database and migrations](#database-and-migrations) for details.

Check that the server is up:

```bash
curl http://localhost:4000/api/health
```

## Environment variables

Configuration is read from `backend/.env` (loaded from the backend folder no matter where the process
is started) or from the real process environment, which takes precedence. `.env` is git-ignored; only
`.env.example` is committed, and it contains no secrets.

| Variable          | Required                  | Default                 | Description |
| ----------------- | ------------------------- | ----------------------- | ----------- |
| `NODE_ENV`        | No                        | `development`           | `development`, `test` or `production`. In `production`, error responses hide internal details. |
| `PORT`            | No                        | `4000`                  | Port the API listens on. |
| `DATABASE_URL`    | **Yes**                   | (none)                  | Prisma connection string. For SQLite, `file:./dev.db` is relative to `prisma/schema.prisma`. |
| `FRONTEND_ORIGIN` | Only when `NODE_ENV=production` | `http://localhost:3000` (development only) | Origin allowed by CORS. Use a comma-separated list for several, e.g. `http://localhost:3000,https://devflow.example.com`. Each entry must be an `http(s)` URL. |
| `GEMINI_API_KEY` | No (feature disables without it) | (none) | Server-side key for AI task generation (Google Gemini API). Read only by the backend; never sent to the browser. Leave blank to disable the feature (`POST /api/ai/generate-tasks` then returns `503 AI_NOT_CONFIGURED`; every other endpoint is unaffected). Get a free-tier key at [Google AI Studio](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Model used for task generation. The default is available on the Gemini API free tier. |
| `GEMINI_BASE_URL` | No | `https://generativelanguage.googleapis.com` | Override only for a proxy or a test double (the integration test below points this at a local mock server). |

All variables are validated with Zod at startup. If one is missing or invalid the server exits with a
readable message instead of starting half-configured.

### CORS

CORS allows only the origin(s) in `FRONTEND_ORIGIN` (requests without an `Origin` header, such as
`curl`, are unaffected). Methods `GET, HEAD, PUT, PATCH, POST, DELETE` are allowed, preflight results are
cached for 10 minutes, and the `Location` response header is exposed to browsers.

## Database and migrations

All API data is stored in a real database through Prisma. There is no mock or in-memory data in the
backend: every endpoint reads and writes the database, so data survives server restarts. The database is
SQLite by default (a single file, `prisma/dev.db`, git-ignored). Its location comes from `DATABASE_URL`.

### Models and relationships

| Model | Relationship | Foreign key | When the parent is deleted |
| ----- | ------------ | ----------- | -------------------------- |
| `User` → `Project` | a user owns many projects (optional) | `Project.ownerId` | Projects are kept, `ownerId` becomes `null` (`SetNull`) |
| `User` → `Task` | a user is assigned many tasks (optional) | `Task.assigneeId` | Tasks are kept, `assigneeId` becomes `null` (`SetNull`) |
| `Project` → `Task` | a project has many tasks (required) | `Task.projectId` | The project's tasks are deleted (`Cascade`) |

Foreign keys are enforced by the database itself (SQLite foreign keys are switched on by Prisma), and the
API also checks referenced ids first so clients get a clear `400` instead of a database error.

### Constraints

| Rule | Where it is enforced |
| ---- | -------------------- |
| `User.email` is unique (trimmed and lower-cased before saving) | Unique index `User_email_key`, plus Zod. Duplicates return `409` |
| Required fields: `User.name`, `User.email`, `Project.name`, `Task.title`, `Task.projectId` | `NOT NULL` columns, plus Zod (length limits, `400` on failure) |
| Defaults: `Task.status = TODO`, `Task.priority = MEDIUM`, `createdAt = now`, `updatedAt` maintained automatically | `schema.prisma` / migration |
| `Task.status` is `TODO`, `IN_PROGRESS` or `DONE`; `Task.priority` is `LOW`, `MEDIUM` or `HIGH` | Prisma enums (validated by Prisma Client) and Zod. SQLite has no native enum type, so a raw SQL insert bypassing Prisma is not blocked by the database |
| Valid relationships | Foreign keys with the delete rules above |
| Indexes for common lookups | `Project.ownerId`, `Task.projectId`, `Task.assigneeId`, `Task.status` |

### Migrations

The schema is versioned in `prisma/migrations/`, and the migration files are committed to git. The
database can be recreated from the project at any time:

```bash
cd backend
npm install
cp .env.example .env          # sets DATABASE_URL
npm run setup                 # generate client + apply all migrations -> prisma/dev.db
```

| Task | Command |
| ---- | ------- |
| Create / upgrade the database from the committed migrations | `npm run prisma:deploy` (also run by `npm run setup`) |
| Change the schema | Edit `prisma/schema.prisma`, then `npm run prisma:migrate -- --name describe_the_change`. Commit the new folder in `prisma/migrations/` |
| See what is applied | `npm run prisma:status` |
| Wipe and rebuild a **development** database | `npm run prisma:reset` (deletes all data) |
| Inspect data | `npm run prisma:studio` |

Use `prisma:deploy` (never `prisma:reset`) on anything that holds data you care about.

**Existing `dev.db` from an earlier version?** If it was created with `prisma db push` or with a
different migration history, the simplest fix for a development database is to delete
`prisma/dev.db` and run `npm run setup`. To keep the data instead, mark the initial migration as already
applied (only if the tables already match the schema): `npx prisma migrate resolve --applied 20260920000000_init`.

**Checking the migrations match `schema.prisma`.** The initial migration (`20260920000000_init`) was
written by hand to match the schema, not generated by the Prisma CLI. Its SQL was executed on a real SQLite
database and the unique index, `NOT NULL` columns, defaults and the `SetNull` / `Cascade` rules were
confirmed, but it has not been compared with what Prisma would generate. Confirm there is no drift once with:

```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "file:./shadow.db" --exit-code
```

Exit code `0` means the migrations and the schema agree. If it reports a difference, run
`npm run prisma:migrate -- --name sync_schema`, commit the generated migration, and delete the
`shadow.db` file the command created (it is git-ignored).

### Production notes

- SQLite stores data in one file, so `DATABASE_URL` must point to a **persistent disk or volume**. Hosts
  with an ephemeral filesystem (many serverless and free-tier platforms) lose the file on redeploy.
- Back up the database file, or use a hosted database. Switching to PostgreSQL or MySQL means changing the
  `provider` in `schema.prisma`, the `DATABASE_URL`, and regenerating the migrations.
- Keep the real `DATABASE_URL` in the host's environment settings or an untracked `.env`. Only
  `.env.example` (no credentials) is committed.

## Running the server

| Mode        | Commands |
| ----------- | -------- |
| Development (auto-reload) | `npm run dev` |
| Production  | `npm run build` then `npm start` |

For production, set the variables in your host's environment (or a `.env` file), including
`NODE_ENV=production`, `DATABASE_URL` and `FRONTEND_ORIGIN`, and run `npm run prisma:deploy` to create/upgrade
the database before each start. `npm run build` cleans `dist/`, regenerates the Prisma client and
compiles TypeScript; `npm start` runs `dist/server.js`. The server shuts down gracefully on
`SIGINT`/`SIGTERM`.

## Scripts

| Script                    | Purpose |
| ------------------------- | ------- |
| `npm run dev`             | Start with auto-reload (`tsx watch`) |
| `npm run build`           | Clean `dist/`, generate the Prisma client, compile TypeScript |
| `npm start`               | Run the compiled server (`dist/server.js`) |
| `npm run typecheck`       | Type-check without emitting files |
| `npm run setup`           | `prisma generate` + `prisma migrate deploy` (first-time setup) |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:validate` | Validate `schema.prisma` |
| `npm run prisma:deploy`   | Apply committed migrations to the database (`prisma migrate deploy`) |
| `npm run prisma:migrate`  | Create a new migration after editing `schema.prisma` (`prisma migrate dev`) |
| `npm run prisma:status`   | Show which migrations are applied (`prisma migrate status`) |
| `npm run prisma:reset`    | **Delete all data**, recreate the database and re-apply migrations |
| `npm run prisma:studio`   | Browse and edit the data in Prisma Studio |
| `npm run test:persistence`| Build, then run the end-to-end persistence test (see below) |
| `npm run test:ai`         | Build, then run the AI task-generation integration test (see [above](#verifying-the-ai-feature)) |

## Conventions

- **Base URL:** `http://localhost:4000/api` (change the port with `PORT`). All bodies are JSON; send `Content-Type: application/json`.
- **Authentication:** `/auth/register` and `/auth/login` are public; every other resource (`/users`, `/projects`, `/tasks`, `/ai`) requires the session cookie those endpoints set (`requireAuth`), and returns `401 UNAUTHORIZED` without one. See [Authentication endpoints](#authentication-endpoints).
- **IDs** are UUIDs. A malformed id returns `400`; a well-formed id that does not exist returns `404`.
- **Success responses:** `{ "data": ... }`. Lists add `"meta": { "total": <count> }`.
- **Status codes:** `POST` returns `201` with a `Location` header. `GET`, `PATCH` and `DELETE` return `200`
  (`DELETE` returns the deleted record in `data`).
- **Errors:** `{ "error": { "code", "message", "details?" } }`, produced by one central error handler.
- **Strict bodies:** unknown fields are rejected with `400`. Strings are trimmed.
- **Dates** (`dueDate`): `YYYY-MM-DD` (midnight UTC) or an ISO 8601 date-time **with a timezone**
  (`2026-10-15T09:00:00Z`, `2026-10-15T09:00:00+05:30`). Responses are always UTC ISO strings.
- **Clearing a value:** on `PATCH`, send `null` for `description`, `dueDate`, `assigneeId` (tasks) or
  `ownerId` (projects).
- **References** in a body (`projectId`, `assigneeId`, `ownerId`) must point to an existing record,
  otherwise the API returns `400` with `details[].path` naming the field.
- **Deleting:** deleting a project also deletes its tasks. Deleting a user keeps their projects and
  tasks and sets `ownerId` / `assigneeId` to `null`.

### Endpoint summary

| Method | Path                    | Success | Description |
| ------ | ----------------------- | ------- | ----------- |
| GET    | `/api/health`           | 200     | Health check |
| POST   | `/api/auth/register`    | 201     | Create an account and start a session (public) |
| POST   | `/api/auth/login`       | 200     | Start a session (public) |
| POST   | `/api/auth/logout`      | 204     | End the current session |
| GET    | `/api/auth/me`          | 200     | Get the signed-in user |
| POST   | `/api/users`            | 201     | Create a user |
| GET    | `/api/users`            | 200     | List users (newest first) |
| GET    | `/api/users/:id`        | 200     | Get one user |
| PATCH  | `/api/users/:id`        | 200     | Update `name` and/or `email` |
| DELETE | `/api/users/:id`        | 200     | Delete a user |
| POST   | `/api/projects`         | 201     | Create a project |
| GET    | `/api/projects`         | 200     | List projects (newest first) |
| GET    | `/api/projects/:id`     | 200     | Get one project, including its tasks |
| PATCH  | `/api/projects/:id`     | 200     | Update a project |
| DELETE | `/api/projects/:id`     | 200     | Delete a project **and its tasks** |
| POST   | `/api/tasks`            | 201     | Create a task |
| GET    | `/api/tasks`            | 200     | List tasks (newest first), optional filters |
| GET    | `/api/tasks/:id`        | 200     | Get one task |
| PATCH  | `/api/tasks/:id`        | 200     | Update a task |
| PATCH  | `/api/tasks/:id/status` | 200     | Change only the task status |
| DELETE | `/api/tasks/:id`        | 200     | Delete a task |
| POST   | `/api/ai/generate-tasks` | 200    | Suggest tasks for a project from a free-text description (AI; nothing is saved) |

The examples below use these ids (yours will differ):

| Placeholder  | Example value |
| ------------ | ------------- |
| `<userId>`    | `2800d443-cf9d-4c31-b2ea-ef0a9676c108` |
| `<projectId>` | `1eea796c-7e17-467a-90bc-a849c3ecf819` |
| `<taskId>`    | `38f1e584-f658-451b-83b5-f56c2bff1862` |

## Health endpoint

`GET /api/health` returns `200 OK`.

```bash
curl http://localhost:4000/api/health
```

```json
{
  "status": "ok",
  "service": "devflow-api",
  "environment": "development",
  "uptime": 42,
  "timestamp": "2026-09-20T09:30:00.000Z"
}
```

`uptime` is in seconds.

## Authentication endpoints

Session-based: a successful register/login sets an `HttpOnly` cookie (`devflow_session`, signed,
7-day expiry); the browser sends it back automatically on same-origin requests (`credentials:
'include'`). There is no bearer token to manage on the client.

| Field      | Type   | Rules |
| ---------- | ------ | ----- |
| `name`     | string | **Required** on register, 1-100 characters |
| `email`    | string | **Required**, valid email, at most 254 characters. Trimmed and lower-cased |
| `password` | string | **Required**, 8-128 characters |

**Register**: `POST /api/auth/register` — `201 Created`, sets the session cookie, returns the new
user (`{ id, name, email, createdAt, updatedAt }`, no password). `409 EMAIL_EXISTS` if the email is
already registered.

**Log in**: `POST /api/auth/login` — `200 OK`, sets the session cookie, returns the user.
`401 INVALID_CREDENTIALS` on a wrong email/password.

**Log out**: `POST /api/auth/logout` — `204 No Content`, clears the session cookie.

**Current user**: `GET /api/auth/me` — `200 OK` with the signed-in user, or `401 UNAUTHORIZED` if
there is no valid session.

## Users endpoints

`/api/users` requires a session (see [Authentication endpoints](#authentication-endpoints) above);
requests without one get `401 UNAUTHORIZED`. It exists for legitimate listing/lookup use (e.g.
assigning a task, picking a project owner) and for managing the signed-in user's own profile —
not as a public directory.

| Field   | Type   | Rules |
| ------- | ------ | ----- |
| `name`  | string | **Required** on create, 1-100 characters |
| `email` | string | **Required** on create, valid email, at most 254 characters. Trimmed and lower-cased, and **unique** (`409` on duplicates) |

`PATCH` accepts `name` and/or `email` (at least one).

**Create a user**: `POST /api/users`

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Rivera","email":"alex@devflow.io"}'
```

`201 Created` (with `Location: /api/users/<userId>`)

```json
{
  "data": {
    "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "name": "Alex Rivera",
    "email": "alex@devflow.io",
    "createdAt": "2026-09-20T09:30:00.000Z",
    "updatedAt": "2026-09-20T09:30:00.000Z"
  }
}
```

**List users**: `GET /api/users` returns `200 OK`

```json
{
  "data": [
    {
      "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
      "name": "Alex Rivera",
      "email": "alex@devflow.io",
      "createdAt": "2026-09-20T09:30:00.000Z",
      "updatedAt": "2026-09-20T09:30:00.000Z"
    }
  ],
  "meta": { "total": 1 }
}
```

**Get, update, delete**

```bash
curl http://localhost:4000/api/users/<userId>                     # 200, { "data": <user> }

curl -X PATCH http://localhost:4000/api/users/<userId> \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex R."}'                                         # 200, { "data": <updated user> }

curl -X DELETE http://localhost:4000/api/users/<userId>           # 200, { "data": <deleted user> }
```

## Projects endpoints

| Field         | Type           | Rules |
| ------------- | -------------- | ----- |
| `name`        | string         | **Required** on create, 1-120 characters |
| `description` | string \| null | Optional, up to 2000 characters (empty string is stored as `null`) |
| `ownerId`     | UUID \| null   | Optional, must be an existing user |
| `dueDate`     | date \| null   | Optional |

`PATCH` accepts any subset of these fields (at least one). Project responses include the `owner`
(`id`, `name`, `email`, or `null`) and `taskCount`. `GET /api/projects/:id` also includes a `tasks` array.

**Create a project**: `POST /api/projects`

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Revamp",
    "description": "Redesign the marketing site",
    "ownerId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "dueDate": "2026-12-31"
  }'
```

`201 Created` (with `Location: /api/projects/<projectId>`)

```json
{
  "data": {
    "id": "1eea796c-7e17-467a-90bc-a849c3ecf819",
    "name": "Website Revamp",
    "description": "Redesign the marketing site",
    "dueDate": "2026-12-31T00:00:00.000Z",
    "createdAt": "2026-09-20T09:32:23.556Z",
    "updatedAt": "2026-09-20T09:32:23.556Z",
    "ownerId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "owner": {
      "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
      "name": "Alex Rivera",
      "email": "alex@devflow.io"
    },
    "taskCount": 0
  }
}
```

**List projects**: `GET /api/projects` returns `200 OK` with `{ "data": [<project>, ...], "meta": { "total": n } }`,
where each project has the shape shown above.

**Get one project**: `GET /api/projects/<projectId>` returns `200 OK`

```json
{
  "data": {
    "id": "1eea796c-7e17-467a-90bc-a849c3ecf819",
    "name": "Website Revamp",
    "description": "Redesign the marketing site",
    "dueDate": "2026-12-31T00:00:00.000Z",
    "createdAt": "2026-09-20T09:32:23.556Z",
    "updatedAt": "2026-09-20T09:32:23.556Z",
    "ownerId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "owner": { "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108", "name": "Alex Rivera", "email": "alex@devflow.io" },
    "tasks": [
      {
        "id": "38f1e584-f658-451b-83b5-f56c2bff1862",
        "title": "Design homepage",
        "description": "Hero + pricing sections",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "dueDate": "2026-10-15T00:00:00.000Z",
        "createdAt": "2026-09-20T09:32:23.569Z",
        "updatedAt": "2026-09-20T09:32:23.577Z",
        "projectId": "1eea796c-7e17-467a-90bc-a849c3ecf819",
        "assigneeId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
        "assignee": { "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108", "name": "Alex Rivera", "email": "alex@devflow.io" }
      }
    ],
    "taskCount": 1
  }
}
```

**Update a project**: `PATCH /api/projects/<projectId>` returns `200 OK` with the updated project.

```bash
# rename and clear the due date
curl -X PATCH http://localhost:4000/api/projects/<projectId> \
  -H "Content-Type: application/json" \
  -d '{"name":"Website v2","dueDate":null}'
```

**Delete a project**: `DELETE /api/projects/<projectId>` returns `200 OK` with the deleted project in
`data`. Its tasks are deleted too.

```bash
curl -X DELETE http://localhost:4000/api/projects/<projectId>
```

## Tasks endpoints

| Field         | Type           | Rules |
| ------------- | -------------- | ----- |
| `title`       | string         | **Required** on create, 1-200 characters |
| `projectId`   | UUID           | **Required** on create, must be an existing project |
| `description` | string \| null | Optional, up to 2000 characters |
| `assigneeId`  | UUID \| null   | Optional, must be an existing user |
| `priority`    | enum           | `LOW` \| `MEDIUM` \| `HIGH`, default `MEDIUM` |
| `status`      | enum           | `TODO` \| `IN_PROGRESS` \| `DONE`, default `TODO` |
| `dueDate`     | date \| null   | Optional |

Enum values are upper-case and case-sensitive. `PATCH /api/tasks/:id` accepts any subset of these fields
(at least one); sending a new `projectId` moves the task to another project. Task responses include the
`project` (`id`, `name`) and the `assignee` (`id`, `name`, `email`, or `null`).

**Create a task**: `POST /api/tasks`

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design homepage",
    "description": "Hero + pricing sections",
    "projectId": "1eea796c-7e17-467a-90bc-a849c3ecf819",
    "assigneeId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "priority": "HIGH",
    "dueDate": "2026-10-15"
  }'
```

`201 Created` (with `Location: /api/tasks/<taskId>`)

```json
{
  "data": {
    "id": "38f1e584-f658-451b-83b5-f56c2bff1862",
    "title": "Design homepage",
    "description": "Hero + pricing sections",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-10-15T00:00:00.000Z",
    "createdAt": "2026-09-20T09:32:23.569Z",
    "updatedAt": "2026-09-20T09:32:23.569Z",
    "projectId": "1eea796c-7e17-467a-90bc-a849c3ecf819",
    "assigneeId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "project": { "id": "1eea796c-7e17-467a-90bc-a849c3ecf819", "name": "Website Revamp" },
    "assignee": { "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108", "name": "Alex Rivera", "email": "alex@devflow.io" }
  }
}
```

**List tasks**: `GET /api/tasks` returns `200 OK` with `{ "data": [<task>, ...], "meta": { "total": n } }`.
Optional filters `projectId`, `assigneeId`, `status` and `priority` can be combined; an invalid filter
value returns `400`.

```bash
curl "http://localhost:4000/api/tasks?projectId=<projectId>&status=IN_PROGRESS"
```

**Get one task**: `GET /api/tasks/<taskId>` returns `200 OK` with `{ "data": <task> }`.

**Update a task**: `PATCH /api/tasks/<taskId>` returns `200 OK` with the updated task.

```bash
# change priority and unassign
curl -X PATCH http://localhost:4000/api/tasks/<taskId> \
  -H "Content-Type: application/json" \
  -d '{"priority":"LOW","assigneeId":null}'
```

**Delete a task**: `DELETE /api/tasks/<taskId>` returns `200 OK` with the deleted task in `data`.

```bash
curl -X DELETE http://localhost:4000/api/tasks/<taskId>
```

## Task status endpoint

`PATCH /api/tasks/:id/status` changes only the status. The body must contain exactly one field,
`status`, set to `TODO`, `IN_PROGRESS` or `DONE`. Any status can move to any other.

```bash
curl -X PATCH http://localhost:4000/api/tasks/<taskId>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

`200 OK`: the full updated task.

```json
{
  "data": {
    "id": "38f1e584-f658-451b-83b5-f56c2bff1862",
    "title": "Design homepage",
    "description": "Hero + pricing sections",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2026-10-15T00:00:00.000Z",
    "createdAt": "2026-09-20T09:32:23.569Z",
    "updatedAt": "2026-09-20T09:35:10.114Z",
    "projectId": "1eea796c-7e17-467a-90bc-a849c3ecf819",
    "assigneeId": "2800d443-cf9d-4c31-b2ea-ef0a9676c108",
    "project": { "id": "1eea796c-7e17-467a-90bc-a849c3ecf819", "name": "Website Revamp" },
    "assignee": { "id": "2800d443-cf9d-4c31-b2ea-ef0a9676c108", "name": "Alex Rivera", "email": "alex@devflow.io" }
  }
}
```

An invalid value (`{"status":"BLOCKED"}`) returns `400`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "status", "message": "Status must be one of: TODO, IN_PROGRESS, DONE" }]
  }
}
```

An unknown task id returns `404 TASK_NOT_FOUND`.

## AI-assisted task generation (Task 4)

`POST /api/ai/generate-tasks` turns a free-text project/feature description into a short list of
task suggestions. It requires a session (same as `/projects` and `/tasks`) and is rate-limited to
10 requests per minute per signed-in user.

**This endpoint never writes to the database.** It only returns suggestions; the client reviews
them and saves the ones it wants through the normal `POST /api/tasks` endpoint, exactly like a
task created by hand. There is no separate "AI task" type or table — a saved suggestion is a
regular `Task` row.

| Field         | Type   | Rules |
| ------------- | ------ | ----- |
| `projectId`   | UUID   | **Required**, must be an existing project. Its name, description and existing task titles are given to the AI as context (and used to avoid suggesting duplicates). |
| `description` | string | **Required**, 10-4000 characters. What to build. |

```bash
curl -X POST http://localhost:4000/api/ai/generate-tasks \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{
    "projectId": "<projectId>",
    "description": "Add threaded comments to posts: users can reply to a comment, and moderators can delete abusive ones."
  }'
```

`200 OK`:

```json
{
  "data": {
    "tasks": [
      { "title": "Design comment data model", "description": "Model comments, replies and authorship.", "priority": "HIGH" },
      { "title": "Build POST /comments endpoint", "description": "Validate input and persist a new comment.", "priority": "HIGH" },
      { "title": "Render comment thread in the UI", "description": "Show nested replies with author and timestamp.", "priority": "MEDIUM" }
    ]
  }
}
```

Each suggestion has `title` (≤80 characters), `description` and `priority` (`LOW` \| `MEDIUM` \|
`HIGH`) — the same shape `POST /api/tasks` accepts, so the frontend can pass an accepted
suggestion straight through unchanged (plus the `projectId` and, optionally, an `assigneeId`).

**Errors**, same envelope as everywhere else in the API:

| Status | `code` | When |
| ------ | ------ | ---- |
| 400 | `VALIDATION_ERROR` | Description too short/long, or `projectId` is missing/not a real project |
| 401 | `UNAUTHORIZED` | No session |
| 429 | `RATE_LIMITED` | More than 10 requests in a minute from this user |
| 429 | `AI_RATE_LIMITED` | The AI provider itself is rate-limiting the server |
| 502 | `AI_PROVIDER_ERROR` | The AI provider rejected the request (e.g. misconfigured server credentials) |
| 502 | `AI_BAD_RESPONSE` | The AI response could not be parsed into usable tasks |
| 502 | `AI_UNREACHABLE` | The AI provider could not be reached at all |
| 503 | `AI_NOT_CONFIGURED` | `GEMINI_API_KEY` is not set on the server |
| 503 | `AI_UNAVAILABLE` | The AI provider returned a server error |
| 504 | `AI_TIMEOUT` | The AI provider took too long to respond |

### How it fits together (Frontend → API → Backend → Database → AI)

1. **Frontend**: the "Generate with AI" dialog on the Tasks page (`components/tasks/ai-task-generator-dialog.tsx`) collects a project and a description and calls the API through the same `apiRequest` helper (`lib/api.ts`) every other feature uses — no AI-specific fetch code, no key of any kind in the browser.
2. **API**: `POST /api/ai/generate-tasks`, authenticated and rate-limited like the rest of the API (`src/routes/ai.routes.ts`).
3. **Backend**: `src/services/ai.service.ts` loads the project and its existing task titles from **the database** (Prisma), builds a prompt, and calls the **AI** provider (Google Gemini API) with the server-side `GEMINI_API_KEY`. The provider's response is parsed defensively (it is untrusted input) and capped/deduplicated before being returned.
4. **Review**: the frontend shows the suggestions with editable title/description/priority and checkboxes; nothing is saved yet.
5. **Save**: for each accepted suggestion the frontend calls the existing `addTask` flow, which `POST`s to `/api/tasks` exactly as the manual "New Task" dialog does — so a generated task is a normal task from the database's point of view: it appears in the task list, the Kanban board, project task counts, and everywhere else immediately.

### Verifying the AI feature

```bash
npm run test:ai
```

`scripts/ai-integration-test.mjs` runs the whole chain above against a throwaway database
(`prisma/ai-test.db`) and a **local mock AI server** (no real API key or network access needed,
and no cost): it registers a user, creates a project, calls `/api/ai/generate-tasks`, checks the
suggestions and that generation alone wrote nothing to the database, saves an accepted suggestion
through `POST /api/tasks`, confirms it shows up under the project, and exercises the error paths
(bad provider response, upstream 5xx/429/401, and the endpoint's own per-user rate limit).

## Error responses

Every error uses the same envelope, created in `src/middleware/error-handler.ts`:

```json
{ "error": { "code": "MACHINE_READABLE_CODE", "message": "Human-readable message", "details": [] } }
```

`details` is only present for validation errors and conflicts.

| Status | `code` | When |
| ------ | ------ | ---- |
| 400 | `VALIDATION_ERROR` | Body/params/query failed validation, unknown field, malformed UUID, or a referenced `projectId` / `assigneeId` / `ownerId` does not exist |
| 400 | `BAD_REQUEST` | Malformed JSON body |
| 401 | `UNAUTHORIZED` | Missing or invalid session on an endpoint that requires one (`/users`, `/projects`, `/tasks`, `/ai`, `/auth/me`) |
| 401 | `INVALID_CREDENTIALS` | `POST /api/auth/login` with a wrong email/password |
| 404 | `USER_NOT_FOUND`, `PROJECT_NOT_FOUND`, `TASK_NOT_FOUND` | The resource in the URL does not exist |
| 404 | `NOT_FOUND` | Unknown route |
| 409 | `CONFLICT` | Duplicate value (e.g. a user email that already exists) or a database conflict |
| 409 | `EMAIL_EXISTS` | `POST /api/auth/register` with an email that is already registered |
| 413 | `PAYLOAD_TOO_LARGE` | Request body larger than 1 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Unsupported content type or encoding |
| 500 | `INTERNAL_ERROR` | Unexpected error. Details are logged on the server, never returned in production |
| 503 | `DATABASE_UNAVAILABLE` | The database cannot be reached or timed out |

Database (Prisma) errors are translated, and the raw Prisma message is never sent to the client.

**400: validation error** (`POST /api/tasks` with `{"title":"","projectId":"nope","priority":"URGENT"}`)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "title", "message": "Title is required" },
      { "path": "projectId", "message": "Invalid project id" },
      { "path": "priority", "message": "Priority must be one of: LOW, MEDIUM, HIGH" }
    ]
  }
}
```

**400: referenced record does not exist** (`projectId` is a valid UUID but no such project)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "projectId", "message": "Project not found" }]
  }
}
```

**400: malformed JSON**

```json
{ "error": { "code": "BAD_REQUEST", "message": "Malformed JSON body" } }
```

**404: resource not found** (`GET /api/tasks/<unknown id>`)

```json
{ "error": { "code": "TASK_NOT_FOUND", "message": "Task not found" } }
```

**404: unknown route** (`GET /api/unknown`)

```json
{ "error": { "code": "NOT_FOUND", "message": "Route not found: GET /api/unknown" } }
```

**409: duplicate email** (`POST /api/users` with an email that already exists)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A record with this email already exists",
    "details": { "fields": ["email"] }
  }
}
```

**500: unexpected error** (production)

```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Internal server error" } }
```

**503: database unavailable**

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "The database is temporarily unavailable. Please try again shortly."
  }
}
```

## Verifying the build

From `backend/`, after `npm install`:

```bash
npm run prisma:validate   # schema.prisma is valid
npm run typecheck         # TypeScript compiles with no errors
npm run build             # produces dist/
npm run setup             # database created from the committed migrations
npm start                 # run the compiled server (run `npm run build` first)
npm run test:persistence  # end-to-end create/read/update/delete + restart test
```

Then a quick smoke test. `/users` requires a session (see
[Authentication endpoints](#authentication-endpoints)), so register first and reuse the cookie:

```bash
curl -i http://localhost:4000/api/health                                     # 200

curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@x.io","password":"correct-horse-battery"}'   # 201, sets the session cookie
curl -i -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@x.io","password":"correct-horse-battery"}'   # 409 (duplicate email)

curl -i http://localhost:4000/api/users                                      # 401 (no session cookie)
curl -i http://localhost:4000/api/users -b cookies.txt                       # 200 (with the session cookie)
curl -i -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -b cookies.txt -d '{"name":""}'        # 400 (invalid body)
curl -i -b cookies.txt \
  http://localhost:4000/api/users/2800d443-cf9d-4c31-b2ea-ef0a9676c108       # 404 (well-formed id, doesn't exist)
```

## Persistence test

`npm run test:persistence` proves that data is stored in the database and survives restarts. It builds the
project, then runs `scripts/persistence-test.mjs`, which uses a **separate throwaway database**
(`prisma/persistence-test.db`) so your development data is not touched:

1. Creates a fresh database from the committed migrations.
2. Starts the compiled server and, through the HTTP API, **creates** users, a project and tasks
   (checking `201`, defaults, the duplicate-email `409` and the `400` cases), **retrieves** them,
   and **updates** them (including the task status endpoint).
3. **Stops and restarts the server**, then checks that every record and every update is still there.
4. **Deletes** the data (checking the `SetNull` and `Cascade` rules), restarts once more and checks that
   nothing deleted came back.

It prints one line per check and exits with a non-zero code on the first failure. Use `TEST_PORT` to
change the port (default `4100`) and `KEEP_TEST_DB=1` to keep the test database file for inspection.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Invalid environment configuration` at startup | Create `backend/.env` from `.env.example` and check the variable named in the message. |
| Requests return `500` mentioning the database schema (development) | The tables do not exist yet. Run `npm run prisma:deploy` (or `npm run setup`). |
| `prisma migrate deploy` reports the database is not empty / a migration failed | The database was created outside the migration workflow. For a development database, delete `prisma/dev.db` and run `npm run setup` (see [Migrations](#migrations)). |
| Data disappears after a redeploy (hosted) | SQLite file is on an ephemeral disk. Point `DATABASE_URL` at persistent storage. |
| `@prisma/client did not initialize yet` | Run `npm run prisma:generate`. |
| `Port 4000 is already in use` | Change `PORT` in `backend/.env`. |
| Browser blocks requests with a CORS error | Set `FRONTEND_ORIGIN` to the exact origin of the frontend (scheme, host and port) and restart. |

## Project structure

```
backend/
├── .env.example              # documented configuration template (no secrets)
├── prisma/
│   ├── schema.prisma         # datasource, generator, User / Project / Task models
│   └── migrations/           # committed SQL migrations (recreate the database from these)
├── scripts/persistence-test.mjs      # end-to-end persistence test (npm run test:persistence)
├── scripts/ai-integration-test.mjs   # end-to-end AI task-generation test (npm run test:ai)
└── src/
    ├── server.ts             # entry: listen + graceful shutdown
    ├── app.ts                # Express app (CORS, JSON, /api, error handling)
    ├── config/env.ts         # env loading + Zod validation (incl. GEMINI_* vars)
    ├── constants/task.ts     # allowed task statuses and priorities
    ├── routes/               # /api router and per-resource routers (incl. ai.routes.ts)
    ├── controllers/          # request handlers (incl. ai.controller.ts)
    ├── services/             # business/data logic (Prisma, incl. ai.service.ts — the only file that calls the AI provider)
    ├── schemas/              # Zod request schemas (incl. ai.schema.ts)
    ├── middleware/           # validate, not-found, error-handler, rate-limit
    ├── lib/prisma.ts         # lazily created Prisma client
    └── utils/                # AppError, asyncHandler, Prisma error mapping, origin parsing
```

### Data model

```
User 1 ──< Project   (Project.ownerId, optional)
User 1 ──< Task      (Task.assigneeId, optional)
Project 1 ──< Task   (Task.projectId, required)
```
