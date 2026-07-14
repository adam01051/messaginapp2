# Project guidance

This repository contains a real-time messaging application with independently managed frontend and backend packages. Before changing code, read `docs/ai/README.md` and use the project skill at `skills/maintain-messaging-app/SKILL.md`.

## Repository map

- `frontend/`: React 19 + Vite 6 UI, React Router, Zustand, Axios, Tailwind CSS/DaisyUI, and the Socket.IO client.
- `backend/`: TypeScript Express 4 modular monolith, Prisma/PostgreSQL, JWT authentication in an HTTP-only cookie, Socket.IO, and Cloudinary uploads.
- `docs/ai/`: durable architecture, state, and change records for future work.
- `skills/maintain-messaging-app/`: repeatable workflow for agents modifying this codebase.

## Working rules

- Inspect current code before relying on `README.md`; its database schema is currently incomplete and partly stale.
- Preserve unrelated working-tree changes and never commit secrets or `.env` files.
- Trace cross-layer behavior before editing. Most features span a React component, a Zustand store, an API route/controller, and PostgreSQL; messaging also spans Socket.IO.
- Use Prisma services for database access. Application code must not import `pg`, construct SQL, or expose Prisma records directly through HTTP.
- Keep REST response shapes and database column names consistent with frontend consumers.
- Prefer small, scoped changes over broad rewrites. Do not migrate frameworks, state management, authentication, or database structure unless requested.
- Update the relevant `docs/ai` record after material architecture or behavior changes.

## Validation

- Frontend lint: `npm run lint --prefix frontend`
- Frontend production build: `npm run build --prefix frontend`
- Backend type/build validation: `npm run build --prefix backend`
- Backend tests: `npm test --prefix backend`
- Prisma schema validation: `npm run prisma:validate --prefix backend`
- Full production build/install: `npm run build` (this installs packages and may require network access)
- Backend development: `npm run dev --prefix backend`
- Backend production start: `npm start`

Backend unit and HTTP boundary tests use Vitest. Database integration still requires a dedicated PostgreSQL test database; upload flows require Cloudinary or a mock.

## Environment contract

The backend reads `PORT`, `CLIENT_ORIGIN`, `DATABASE_URL`, `SHADOW_DATABASE_URL` (Prisma CLI), `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, `JWT_SECRET`, `LOG_LEVEL`, and `NODE_ENV`. Never place real values in documentation or source control.
