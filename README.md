# Task Tracker - Frontend

React + Vite + Tailwind CSS frontend for the Task Tracker app: JWT auth, role-based dashboard, real-time task updates over WebSocket.

**Companion repo:** the Spring Boot backend lives in a separate repository, deployed to AWS EC2 (Docker, pulling from ECR) with RDS MySQL. This repo is frontend-only, deployed to **Vercel**.

## Stack

React 18 · Vite 5 · Tailwind CSS · React Router · Axios · @stomp/stompjs + sockjs-client

## Project Structure

```
.
├── .github/workflows/ci.yml   # lint + build on every push/PR; optional Actions-driven Vercel deploy
├── vercel.json                 # SPA rewrite so client-side routes don't 404 on refresh
├── Dockerfile                  # OPTIONAL - only needed if self-hosting instead of Vercel
├── public/                     # favicon etc.
└── src/
    ├── components/    Layout (sidebar), TaskTable, TaskModal, Filters, SummaryCards,
    │                  SearchableSelect, ConfirmDialog, Spinner, Pagination, route guards
    ├── context/       AuthContext
    ├── pages/         Login, Register, Dashboard, AdminUsers
    └── services/      apiClient (axios + interceptors), authService, taskService, userService
```

## Local Development

1. Copy the env file and point it at your local backend:
   ```bash
   cp .env.example .env
   ```
2. Install & run:

   ```bash
   npm install
   npm run dev
   ```

   App starts at `http://localhost:5173`. Make sure the backend is running (see the backend repo's README) and its `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`.

3. Lint:
   ```bash
   npm run lint
   ```

## Environment Variables

| Variable            | Local default                  | Production (Vercel)                            |
| ------------------- | ------------------------------ | ---------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Your deployed backend's public URL + `/api/v1` |
| `VITE_WS_URL`       | `http://localhost:8080/ws`     | Your deployed backend's public URL + `/ws`     |

**Set production values in the Vercel dashboard** (Project → Settings → Environment Variables), not in a committed file.

---

## Deploying to Vercel

### Recommended: Vercel's native Git integration

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** this repo.
3. Framework preset: Vercel auto-detects **Vite** (confirmed by `vercel.json`'s `"framework": "vite"`). Build command `npm run build`, output directory `dist` — both already set in `vercel.json`, no manual entry needed.
4. Add the two environment variables above (`VITE_API_BASE_URL`, `VITE_WS_URL`) pointing at your live backend.
5. Deploy. Every push to `main` auto-deploys to production; every PR gets its own preview URL automatically.
6. **Copy the resulting `https://your-app.vercel.app` URL into the backend's `CORS_ALLOWED_ORIGINS`** (and redeploy the backend) — otherwise the browser will block API calls with a CORS error.

### Alternative: Actions-driven deploy (`.github/workflows/ci.yml`)

If you'd rather trigger Vercel deploys from GitHub Actions instead of the dashboard integration (e.g. to gate on the lint/build job explicitly), set these repo secrets and the workflow's `deploy-preview`/`deploy-production` jobs take over automatically:

| Secret                                | Where to get it                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `VERCEL_TOKEN`                        | Vercel → Account Settings → Tokens                                           |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Run `vercel link` locally once — writes `.vercel/project.json` with both IDs |

Without these secrets set, the workflow's deploy jobs are harmless no-ops and Vercel's own git integration handles everything.

### Optional: self-hosted via Docker (skip Vercel entirely)

```bash
docker build -t task-tracker-frontend .
docker run -p 5173:80 task-tracker-frontend
```

Builds the app and serves it via Nginx (`nginx.conf` includes the same SPA fallback as `vercel.json`). Only useful if you specifically want to run this outside Vercel — the CI/CD pipeline above assumes Vercel as the deploy target.

## Bugs Fixed / Notable Implementation Details

- **`global is not defined` crash**: `sockjs-client` (a `@stomp/stompjs` fallback transport) expects Node's `global` object, which Vite doesn't polyfill by default. Fixed via `define: { global: 'window' }` in `vite.config.js`.
- **401 handling is split by intent**: a wrong password on the Login page shows "Invalid username or password" (handled locally by that page); an expired token anywhere else clears storage and redirects to `/login?reason=expired`, which pre-fills the last-used username so only the password needs retyping. These two cases share the same HTTP status code but very different meanings, so the Axios interceptor in `apiClient.js` explicitly excludes `/auth/login` and `/auth/register` from the auto-redirect logic.
- **Edit-only-if-changed**: `TaskModal` snapshots the task's original values on open and diffs against the form on submit — no network call at all if nothing changed.
- **Confirmation before destructive/consequential actions**: task delete, user deactivate, and task assignment all go through the reusable `ConfirmDialog` rather than acting immediately on click.
- **Assignment dropdowns only ever show active, non-admin users** — mirrors a rule enforced server-side too (defense in depth: the backend rejects assigning to a deactivated or admin account regardless of what the UI sends).
- **A task's status can't be changed while Unassigned** — the inline status picker and the Edit modal's status field are both disabled with an explanatory tooltip until an Admin has assigned the task to someone.

## Future Improvements

- Keyboard navigation (arrow keys/Enter) in `SearchableSelect` — currently mouse/click-driven only.
- Optimistic UI updates instead of a full refetch on every WebSocket event.
- A proper "reassign from the Edit modal" flow (currently reassignment happens via the inline Owner-column picker on the Unassigned/assigned rows, not from within the Edit modal itself).
