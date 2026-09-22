# DevFlow

DevFlow is a developer productivity dashboard: projects, tasks, a Kanban board, clients, analytics and a
profile page.

The repository has two parts:

| Part | Location | Stack | Status |
| ---- | -------- | ----- | ------ |
| **Task 1: Frontend** | repository root (`app/`, `components/`, `lib/`) | Next.js 13 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui | Dashboard UI, authenticated against the backend and backed by it for users, projects and tasks |
| **Task 2 and 3: Backend API + database** | [`/backend`](./backend) | Node.js, Express, TypeScript, Prisma (SQLite), Zod | REST API with session-based authentication; users, projects and tasks are persisted in a database through Prisma, with migrations |
| **Task 4: AI-assisted task generation** | frontend (`components/tasks/ai-task-generator-dialog.tsx`) + [`/backend`](./backend) (`POST /api/ai/generate-tasks`) | Same stack, plus the Google Gemini API | Describe a feature, review AI-suggested tasks, save the ones you want |

> **The Task 2/3 backend lives in [`/backend`](./backend).** It is a standalone service with its own
> `package.json`, and the full API documentation (setup, environment variables, endpoints, request and
> response examples, error responses) is in [`backend/README.md`](./backend/README.md). The AI endpoint
> is documented there too, under
> [AI-assisted task generation](./backend/README.md#ai-assisted-task-generation-task-4).

**Final architecture:** Frontend → REST API → Backend → Database, with AI integration for task
generation.

- The frontend authenticates against the backend (session cookies, sent automatically with every
  request) and reads/writes users, projects and tasks entirely through the REST API, which
  persists them in the database via Prisma.
- Client and activity data remain frontend-local fixtures. This is intentional, not a gap: they sit
  outside the Task 2/3 database/API model, which defines no client or activity tables.

## AI-assisted task generation (Task 4)

On the **Tasks** page, "Generate with AI" opens a dialog: pick a project, describe a feature in a
sentence or two, and the backend asks an AI model for a short list of task suggestions. Nothing is
saved yet — each suggestion can be edited or unchecked, and only the ones you accept are added,
through the exact same `POST /api/tasks` call the "New Task" dialog uses.

The AI key (`GEMINI_API_KEY`) lives only in `backend/.env` and is read only by the backend; the
browser never sees it (see [`backend/.env.example`](./backend/.env.example)). Without a key
configured, the button still works — generation returns a clear "not configured" error and the rest
of the app is unaffected.

Backend details, request/response shapes, error codes and the integration test
(`npm run test:ai`, no real API key needed) are in
[`backend/README.md`](./backend/README.md#ai-assisted-task-generation-task-4).

## Frontend (Task 1)

From the repository root:

```bash
npm install
npm run dev        # http://localhost:3000
```

The frontend defaults to `http://localhost:4000/api` for the backend. Set
`NEXT_PUBLIC_API_URL` when the API is hosted elsewhere.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Backend (Tasks 2 and 3)

From the `backend` folder:

```bash
cd backend
npm install
cp .env.example .env      # Windows (cmd): copy .env.example .env
npm run setup             # generate the Prisma client and create the SQLite database
npm run dev               # http://localhost:4000/api
curl http://localhost:4000/api/health
```

`FRONTEND_ORIGIN` in `backend/.env` controls which frontend origin CORS allows (default
`http://localhost:3000`, which is where the frontend dev server runs).

See [`backend/README.md`](./backend/README.md) for everything else.

## Project structure

```
.
├── app/            # Next.js routes (Task 1 frontend)
├── components/     # UI components
├── lib/            # types, helpers, API client, and local fixtures for clients/activities
├── backend/        # Tasks 2/3 REST API + database (Express + Prisma), documented in backend/README.md
└── ...
```
