# HackBuddy Frontend

![React Router](https://img.shields.io/badge/React_Router-7.x-CA4245?logo=reactrouter)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)
![License](https://img.shields.io/badge/License-Proprietary-red)

Frontend application for HackBuddy, built with React Router 7, TypeScript, Tailwind CSS, Zustand, and TanStack Query.

## What This App Covers

- Public landing experience
- Authentication flows (email/password + OAuth callback handling)
- User dashboard for sessions, sources, analysis, and chat
- Admin views for usage, users, sessions, and model controls

## Tech Stack

- React 19 + React Router 7
- TypeScript + Vite 7
- Tailwind CSS 4 + shadcn/ui components
- Zustand (client state)
- TanStack Query (server state)

## Prerequisites

- Bun (recommended) or npm
- Backend API running (default expected: `http://localhost:8080/api/v1`)

## Environment Setup

Create `frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:8080/api/v1
```

`VITE_API_URL` is used as the base URL for all API requests.

## Local Development

```bash
cd frontend
bun install
bun run dev
```

App runs at `http://localhost:5173`.

If you prefer npm:

```bash
npm install
npm run dev
```

## Scripts

```bash
bun run dev        # start dev server
bun run typecheck  # router typegen + tsc
bun run build      # production build
bun run start      # serve build/server/index.js
```

Equivalent npm scripts exist (`npm run dev`, `npm run build`, etc.).

## Build Output

```text
build/
  client/   # static client assets
  server/   # server bundle (react-router-serve target)
```

## API Integration

- Base path expected by frontend: `/api/v1`
- Auth uses `Authorization: Bearer <token>` when token cookie exists
- Full endpoint matrix and payload contracts: `frontend/integration-docs.md`

## Docker Note

`frontend/Dockerfile` currently expects `package-lock.json` and uses `npm ci`.
If you standardize on Bun-only workflows, update Docker packaging accordingly.

## Contributing (Internal)

- Branch from `dev` with `feature/*`, `fix/*`, or `chore/*`
- Open PRs to `dev` for regular changes
- Keep `main` for release/hotfix promotion PRs
- Ensure Frontend CI is passing before merge

## License

This project is proprietary and confidential. It is not open source and not MIT licensed.
