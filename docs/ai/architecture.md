# Architecture

Last reviewed: 2026-07-14 (Prisma/PostgreSQL verification)

## Runtime topology

The application has two packages:

- The Vite/React single-page application runs on port 5173 in development. Axios calls `http://localhost:5001/api` with credentials, and the Socket.IO client connects to `http://localhost:5001`.
- The Express/Socket.IO server defaults to port 5001. In production it serves `frontend/dist` and falls back to `index.html` for client routes.
- PostgreSQL is the system of record and Prisma 7 is the only application data-access layer. Cloudinary stores profile and message images; PostgreSQL stores their returned URLs.

## Frontend

`frontend/src/App.jsx` performs the initial auth check and protects the home, profile, and search routes. `/themeset` is public.

State is split across Zustand stores:

- `useAuthStore`: session user, the current user's profile-picture history, auth actions, user search, online-user IDs, and socket lifecycle.
- `useChatStore`: sidebar users, selected conversation, messages, contact changes, and the `newMessage` subscription.
- `useThemeStore`: persisted DaisyUI theme selection.

The main chat path is `HomePage` -> `Sidebar`/`ChatContainer` -> `useChatStore` -> Axios/Socket.IO.

## Backend

`backend/src/app.ts` builds a testable Express app. `backend/src/index.ts` creates the HTTP server, initializes Socket.IO, and owns graceful shutdown. Domain requests follow route -> validation/auth -> controller -> service -> Prisma.

Authentication uses a JWT named `jwt` in an HTTP-only cookie. `protectRoute` verifies it, loads the user from PostgreSQL, and assigns `req.user`. This is token-cookie authentication, despite older README wording about sessions.

API surface:

| Method | Path | Protected | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | No | Create user and cookie |
| POST | `/api/auth/login` | No | Validate credentials and create cookie |
| POST | `/api/auth/logout` | No | Clear cookie |
| GET | `/api/auth/check` | Yes | Return current user plus profile pictures |
| PUT | `/api/auth/update-profile` | Yes | Upload and add a profile picture |
| PUT | `/api/auth/edit-profile` | Yes | Update name, username, and number |
| GET | `/api/auth/usersearch` | Yes | Search by username expression |
| GET | `/api/contacts` | Yes | List contacts and inbound senders with current avatars |
| POST | `/api/contacts` | Yes | Add a contact by username |
| DELETE | `/api/contacts/:contactId` | Yes | Remove a contact without deleting messages |
| GET | `/api/messages/:userId` | Yes | Load a cursor-paginated conversation |
| POST | `/api/messages/send/:userId` | Yes | Store a message and then emit `newMessage` |

## Versioned data model

The Prisma schema and migrations define:

- `users`: `id`, `name`, `email`, `username`, `password_`, `number`
- `profile_pics`: `profile_id`, `profile_url`, `user_ref`
- `contacts`: `user_id`, `contact_id`
- `messages`: `id`, `sender_id`, `receiver_id`, `content`, `image`, `created_at`

The baseline migration creates unique user emails/usernames, a composite contact primary key, foreign keys with cascading user deletion, and conversation/profile lookup indexes. These constraints were verified against a disposable PostgreSQL 16 database; the existing production schema still requires reconciliation against a restored clone.

## Real-time flow

Socket.IO verifies the JWT cookie during its handshake and maps each user to a set of socket IDs, supporting multiple tabs/devices. Sending a message first commits through Prisma; only then does the server emit `newMessage`.

## Environment

Backend configuration: `PORT`, `CLIENT_ORIGIN`, `DATABASE_URL`, optional `SHADOW_DATABASE_URL` for Prisma, Cloudinary credentials, `JWT_SECRET`, `LOG_LEVEL`, and `NODE_ENV`. Express and Socket.IO share `CLIENT_ORIGIN`.

`RUN_DATABASE_TESTS=true` enables destructive integration-test cleanup and must only be used with a disposable test database. Database adoption and clean-install procedures are documented in `docs/database-migration.md`.
