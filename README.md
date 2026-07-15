# Chatty Messaging Application

Chatty is a full-stack realtime messaging application built with React, Express, Socket.IO, Prisma, PostgreSQL, and Cloudinary. Development and VPS deployment run two independent services from this repository: the frontend on port `6002` and the backend on port `6001`.

## Features

- JWT authentication in an HTTP-only cookie
- Realtime presence across multiple tabs and devices
- Directional contacts, realtime message requests, and persistent user blocking
- Cursor-paginated conversations and realtime message delivery
- Message images and profile-picture history stored in Cloudinary
- PostgreSQL persistence through Prisma ORM and versioned migrations
- Request validation, structured errors/logging, security headers, rate limiting, and health checks
- Responsive React interface with persisted themes

## Architecture

```text
React + Zustand (:6002)
   ├── REST /api ────────┐
   └── Socket.IO ────────┤
                         ▼
             Express + Socket.IO (:6001)
                 ├── Prisma ─────── PostgreSQL
                 └── Cloudinary ─── Image assets
```

PostgreSQL stores users, contact/block relationships, messages, Cloudinary URLs, and attachment public IDs. Image bytes are never written to the application filesystem or PostgreSQL.

```text
Browser file → data URL → Express → Cloudinary → secure URL → PostgreSQL
```

New Cloudinary assets are organized under:

- `messaging-app/profiles`
- `messaging-app/messages`

This avoids local `uploads/` storage, which is unreliable on hosts with ephemeral filesystems.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 6, React Router, Zustand, Axios, Tailwind CSS, DaisyUI |
| Backend | Node.js, TypeScript, Express 4, Socket.IO, Zod, Pino |
| Database | PostgreSQL 16, Prisma 7, `@prisma/adapter-pg` |
| Media | Cloudinary |
| Tests | Vitest, Supertest, PostgreSQL integration tests, Socket.IO client |

## Requirements

- Node.js 20.19 or newer; Node.js 22 LTS is recommended
- npm 10 or newer
- A new PostgreSQL database
- A Cloudinary account for image features and all production deployments
- Git, Docker Engine, and the Docker Compose plugin on the VPS

## Local setup

Install each package from the repository root:

```sh
npm ci --prefix backend
npm ci --prefix frontend
```

Copy both environment templates and replace every placeholder:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL runtime URL; direct/session is preferred |
| `DIRECT_URL` | Pooled databases | Direct/session PostgreSQL URL used only by Prisma CLI migrations |
| `JWT_SECRET` | Yes | Signs authentication cookies; use a long random secret |
| `CLIENT_ORIGIN` | Production | Public application origin used by Express and Socket.IO CORS |
| `CLOUDINARY_NAME` | Production/images | Cloudinary cloud name |
| `CLOUDINARY_KEY` | Production/images | Cloudinary API key |
| `CLOUDINARY_SECRET` | Production/images | Cloudinary API secret |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | Backend port; defaults to `6001` |
| `LOG_LEVEL` | No | Pino log level; defaults to `info` |
| `SHADOW_DATABASE_URL` | Prisma development only | Separate disposable shadow database for migration development/diffs |
| `VITE_BACKEND_ORIGIN` | Frontend | Browser-visible backend origin, without `/api`; defaults to `http://localhost:6001` |

Cloudinary variables must be configured together. Production startup fails early if they are missing.

Initialize the new empty database:

```sh
npm run prisma:validate --prefix backend
npm run prisma:migrate:deploy --prefix backend
npm run prisma:migrate:status --prefix backend
```

Start both development servers in separate terminals:

```sh
npm run dev --prefix backend
npm run dev --prefix frontend
```

Open `http://localhost:6002`. The API and Socket.IO server run on `http://localhost:6001`.

## API and realtime contracts

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account and authentication cookie |
| `POST` | `/api/auth/login` | Authenticate and create a cookie |
| `POST` | `/api/auth/logout` | Clear the cookie |
| `GET` | `/api/auth/check` | Load the authenticated user and profile pictures |
| `PUT` | `/api/auth/edit-profile` | Update profile data |
| `PUT` | `/api/auth/update-profile` | Upload a profile picture to Cloudinary |
| `GET` | `/api/auth/usersearch` | Search for users by username |
| `GET` | `/api/contacts` | List the user's contacts and inbound conversations |
| `POST` | `/api/contacts` | Add a one-way contact for the authenticated user |
| `DELETE` | `/api/contacts/:contactId` | Remove the directional contact and permanently delete the shared conversation |
| `GET` | `/api/blocks` | List users blocked by the authenticated user |
| `POST` | `/api/blocks/:userId` | Block a user and delete both contacts and the shared conversation |
| `DELETE` | `/api/blocks/:userId` | Unblock a user without restoring contacts or messages |
| `GET` | `/api/messages/:userId` | Load a cursor-paginated conversation |
| `POST` | `/api/messages/send/:userId` | Persist and emit a text/image message |

Server-to-client Socket.IO events:

| Event | Payload | Purpose |
| --- | --- | --- |
| `getOnlineUsers` | `string[]` | Current online user IDs |
| `newMessage` | `MessageDto` | Newly committed message for the recipient |
| `conversationUpdated` | `{ contact: ContactDto }` | Insert or move the sender in the recipient's sidebar after a committed message |
| `conversationReset` | `{ userId, contact }` | Clear deleted history and remove or retain the peer's remaining contact |

Explicit contacts are directional: adding another user does not add you to their contacts. An incoming message appears as a request with `is_contact: false`; the recipient can accept or block it. Deleting a contact permanently deletes the shared conversation for both users but does not prevent future contact. Blocking removes both contact directions and history and prevents add/load/send operations in either direction until the blocker unblocks the user from the Profile page. Realtime events are emitted only after database commits.

The sidebar combines both relationship types: saved users are labeled `Contact`, while unsaved inbound senders are labeled `New message request`. Active conversations sort by newest message, saved contacts without messages sort alphabetically, and blocked users never appear. Loading failures show a retry state instead of stale contacts.

## Validation

Run the complete non-destructive project checks:

```sh
npm run check
```

Database integration tests delete all application records. Run them only against a disposable database whose name ends in `_test`, `_testing`, `_ci`, or `_verify`:

```sh
RUN_DATABASE_TESTS=true npm test --prefix backend
```

Never enable `RUN_DATABASE_TESTS` against production. CI provisions its own PostgreSQL 16 service and applies migrations before testing.

Health endpoints:

```text
GET /health/live   process liveness
GET /health/ready  PostgreSQL and required application-schema readiness
```

## Deployment

The supported VPS layout uses two Compose services from one Git checkout:

```text
http(s)://SERVER:6002  React static frontend
http(s)://SERVER:6001  Express REST, health, and Socket.IO backend
```

Create both ignored environment files on the VPS:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Use these public values, replacing `SERVER` with the VPS hostname or IP:

```env
# backend/.env
NODE_ENV=production
PORT=6001
CLIENT_ORIGIN=https://SERVER:6002
DATABASE_URL=postgresql://...
# DIRECT_URL=postgresql://...  # recommended when DATABASE_URL is pooled
JWT_SECRET=replace-with-a-long-random-secret
CLOUDINARY_NAME=...
CLOUDINARY_KEY=...
CLOUDINARY_SECRET=...
```

```env
# frontend/.env
VITE_BACKEND_ORIGIN=https://SERVER:6001
```

Deploy from a clean checkout:

```sh
./deploy.sh
docker compose logs -f messaging-backend messaging-frontend
```

Stop any development terminals before deployment because development and Compose use the same host ports. Allow inbound TCP `6002` for the frontend and `6001` for the backend only until a TLS endpoint/firewall policy replaces direct public access.

`deploy.sh` refuses to overwrite tracked changes, runs `git pull --ff-only`, force-recreates both containers, removes obsolete Compose containers, waits for both health checks, and prints status. Increase the wait on a small VPS when needed:

```sh
DEPLOY_WAIT_SECONDS=600 ./deploy.sh
```

The backend container performs a locked install and TypeScript build, deploys Prisma migrations with a bounded retry for transient advisory-lock contention, then starts Express. The frontend container waits for backend readiness, performs its own locked install and Vite build, and serves `frontend/dist` with SPA fallback on port `6002`.

Useful operations:

```sh
docker compose ps
docker compose logs -f messaging-backend messaging-frontend
docker compose down
```

Named `node_modules` volumes keep Linux container dependencies separate from local macOS dependencies. PostgreSQL and Cloudinary remain managed external services; Compose does not create database or upload volumes.

Only one backend container should run. Presence and socket routing currently use process memory, so do not use Compose scaling, PM2 cluster mode, or multiple backend replicas until a shared Socket.IO adapter is introduced.

No reverse proxy is included. Direct HTTP ports are sufficient for health/static smoke checks, but production authentication cookies are secure and therefore require HTTPS for real browser login. Add TLS termination before public launch; do not weaken cookie security.

Open firewall access only for the intended public ports. Keep PostgreSQL private to the backend/provider network whenever possible.

After deployment, verify signup/login/logout, one-way contact addition, realtime first-message requests, conversation deletion, block/unblock in two sessions, text/image messaging, presence/reconnect behavior, SPA route refreshes, and both health endpoints.

## Troubleshooting

- **`DATABASE_URL must start with...`**: use a standard `postgres://` or `postgresql://` connection URL.
- **Database is not ready**: run `npm run prisma:migrate:status --prefix backend` and confirm network/SSL access.
- **Images fail but text works**: confirm all three Cloudinary variables exist in the same runtime environment.
- **Cookies or sockets fail in production**: confirm the browser URL exactly matches `CLIENT_ORIGIN` and that HTTPS/WebSocket proxying is enabled.
- **Do not run destructive tests**: production database names intentionally fail the integration-test safety guard.

## Mobile roadmap

A mobile client is intentionally deferred. The existing REST DTOs, JWT-cookie authentication boundary, Cloudinary URLs, and Socket.IO events are documented and should remain backward compatible when mobile work begins.

## Database documentation

- [Fresh PostgreSQL setup](docs/database-migration.md)
