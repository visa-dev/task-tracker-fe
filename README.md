# Task Tracker - Frontend

React + Vite + Tailwind CSS frontend for the Task Tracker app: JWT auth, role-based dashboard, real-time task updates over WebSocket.

**Companion repo:** the Spring Boot backend lives in a separate repository (`task-tracker-backend`), deployed to AWS EC2 (Docker, pulling from ECR) with RDS MySQL. This repo is frontend-only, deployed to **Vercel**.

Stack: React 18 · Vite 5 · Tailwind CSS · React Router · Axios · @stomp/stompjs + sockjs-client

---

## Setup Instructions

### Backend Setup
The backend is a separate repository (`task-tracker-backend`) — clone it and follow its own README (`docker compose up --build` is the fastest path). This frontend just needs to know where that backend is running (see Environment Configuration below), and the backend's `CORS_ALLOWED_ORIGINS` needs to include wherever this frontend is running.

### Frontend Setup
1. Copy the env file and point it at your local backend:
```bash
   cp .env.example .env
```
2. Install & run:
```bash
   npm install
   npm run dev
```
   App starts at `http://localhost:5173`.
3. Lint:
```bash
   npm run lint
```

### Environment Configuration

| Variable | Local default | Production (Vercel) |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Your deployed backend's public URL + `/api/v1` |
| `VITE_WS_URL` | `http://localhost:8080/ws` | Your deployed backend's public URL + `/ws` |

**Production values go in the Vercel dashboard** (Project → Settings → Environment Variables), never in a committed file. See `.env.example` for the full annotated version.

### Database Setup
This repository has no database of its own — it's a static frontend that talks to the backend's REST/WebSocket API. Database setup (MySQL locally, RDS in production) is documented in the backend repo's README.

---

## Design Decisions

### Architecture Overview

src/
├── services/      apiClient.js (shared axios instance + interceptors)
│                  authService.js, taskService.js, userService.js (one per backend resource)
├── context/       AuthContext - holds user + token, exposes login()/logout()
├── components/    Layout (sidebar nav), TaskTable, TaskModal, Filters, SummaryCards,
│                  SearchableSelect, ConfirmDialog, Spinner, Pagination, route guards
└── pages/         Login, Register, Dashboard, AdminUsers

- **API layer split by resource** (`authService`/`taskService`/`userService`) rather than one monolithic file, mirroring the backend's own Auth/Task/User service split.
- **Single unified Dashboard** for both roles — the same table/filter/summary components conditionally render owner-related fields based on `user.role`, rather than maintaining two parallel dashboards for what's ultimately the same view with a different data scope.
- **Real-time via WebSocket refetch, not full-entity push** — on any `{action, taskId}` event, the client just calls the existing authenticated `GET /tasks` again, so the backend's RBAC is enforced exactly the same way for real-time updates as for a manual page load.

### Key Implementation Decisions
- **`global is not defined` crash fix**: `sockjs-client` (a `@stomp/stompjs` fallback transport) expects Node's `global` object, which Vite doesn't polyfill by default. Fixed via `define: { global: 'window' }` in `vite.config.js`.
- **401 handling is split by intent**: a wrong password on the Login page shows "Invalid username or password" (handled locally by that page); an expired token anywhere else clears storage and redirects to `/login?reason=expired`, which pre-fills the last-used username so only the password needs retyping. The Axios interceptor in `apiClient.js` explicitly excludes `/auth/login` and `/auth/register` from the auto-redirect logic so these two same-status-code cases aren't conflated.
- **Edit-only-if-changed**: `TaskModal` snapshots the task's original values on open and diffs against the form on submit — no network call at all if nothing changed.
- **Confirmation before consequential actions**: task delete, user deactivate, and task assignment all go through the reusable `ConfirmDialog` rather than acting immediately on click.
- **A task's status can't be changed while Unassigned** — the inline status picker and the Edit modal's status field are both disabled with an explanatory tooltip until an Admin has assigned the task to someone (mirrors a rule enforced server-side too).

---

## Assumptions
- Assignment dropdowns (Assign-to, inline table assign) only ever list **active, non-admin** users — this is a UI convenience mirroring a rule the backend enforces regardless of what's sent.
- `SearchableSelect` is a small custom combobox rather than a library like `react-select` — kept the bundle lean and avoided a dependency that couldn't be installed/verified in the sandbox this was originally built in.
- The optional Dockerfile/Nginx setup is provided for completeness but isn't the intended deploy path — Vercel via git integration is.

---

## Future Improvements
- Keyboard navigation (arrow keys/Enter) in `SearchableSelect` — currently mouse/click-driven only.
- Optimistic UI updates instead of a full refetch on every WebSocket event.
- A proper "reassign from the Edit modal" flow (currently reassignment happens via the inline Owner-column picker on the table row, not from within the Edit modal itself).
- Actually enforce the Vercel preview/production Actions-driven deploy path in CI (currently a documented, opt-in no-op unless `VERCEL_TOKEN` etc. are set — most users will rely on Vercel's dashboard git integration instead).

---

## API Documentation

### Postman Collection
`TaskTracker.postman_collection.json` (also present in the backend repo) covers every implemented endpoint: register/login, full task CRUD, pagination/filtering, quick status change, admin assignment, and user activation/deactivation.

### Postman Environment
`TaskTracker.postman_environment.json` — import alongside the collection and select it in Postman for a ready-to-go `baseUrl` (defaults to `http://localhost:8080/api/v1`).

---

## Version Control
This repo ships with a real, staged commit history — not one bulk commit. Run `git log --oneline` after cloning to see it; commits are scoped by concern (scaffold → routing/auth/services → shared UI primitives → auth pages → task components → main pages → favicon → optional Docker/lint config → Vercel/CI config → docs).

---

## Deploying to Vercel

### Recommended: Vercel's native Git integration
1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** this repo.
3. Framework preset: Vercel auto-detects **Vite** (confirmed by `vercel.json`'s `"framework": "vite"`) — build command and output directory are already set in `vercel.json`, no manual entry needed.
4. Add the two environment variables from "Environment Configuration" above, pointing at your live backend.
5. Deploy. Every push to `main` auto-deploys to production; every PR gets its own preview URL automatically.
6. **Copy the resulting `https://your-app.vercel.app` URL into the backend's `CORS_ALLOWED_ORIGINS`** (and redeploy the backend) — otherwise the browser will block API calls with a CORS error.

### Alternative: Actions-driven deploy (`.github/workflows/ci.yml`)
If you'd rather trigger Vercel deploys from GitHub Actions instead of the dashboard integration, set these repo secrets and the workflow's `deploy-preview`/`deploy-production` jobs take over automatically:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Run `vercel link` locally once — writes `.vercel/project.json` with both IDs |

Without these secrets set, the workflow's deploy jobs are harmless no-ops and Vercel's own git integration handles everything.

### Optional: self-hosted via Docker (skip Vercel entirely)
```bash
docker build -t task-tracker-frontend .
docker run -p 5173:80 task-tracker-frontend
```
Builds the app and serves it via Nginx (`nginx.conf` includes the same SPA fallback as `vercel.json`).