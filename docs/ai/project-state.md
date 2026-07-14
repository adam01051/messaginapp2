# Project state

Last reviewed: 2026-07-14

## Verified baseline

- Prisma migrations, backend Vitest tests, and a CI workflow are present. CI provisions PostgreSQL 16, applies migrations, and runs database integration tests; seed data is still pending.
- Frontend lint and production build pass after dependency installation.
- The root, frontend, and backend each have package metadata/lockfiles; dependencies are managed separately by the current scripts.
- Prisma uses camelCase application fields mapped onto existing snake_case table/column names.
- The baseline migration deploys cleanly to disposable PostgreSQL 16, reports no migration drift, and the complete backend suite passes 21 database/REST/Socket.IO scenarios.
- The baseline migration is applied to the new managed Prisma PostgreSQL database; migration status is current and `/health/ready` successfully queried it.
- Live Socket.IO smoke testing verified cookie authentication, unauthenticated rejection, multi-tab presence, last-tab cleanup, and `newMessage` delivery.
- Mutual contact add/remove events are transaction-backed, idempotent, delivered to all recipient tabs, and recover correctly after an offline login.
- Cloudinary credentials completed a reversible upload/delete check; production static serving, SPA fallback, Cloudinary CSP, and managed-database readiness are deployment gates.

## Material risks to consider before feature work

- The project will start on a new empty managed PostgreSQL database; no legacy database or data-copy workflow is in scope.
- Socket authentication, multi-tab presence, shared CORS configuration, realtime mutual contacts, message-preserving contact deletion, scoped avatars, and JWT 401 handling are implemented.
- Frontend store error paths tolerate network failures that do not contain an Axios response.
- Image data URLs are validated and the request limit is 10 MB; direct-to-cloud signed uploads would still scale better.
- Database uniqueness, foreign-key, contact, avatar, and pagination behavior is verified on disposable PostgreSQL 16.
- The frontend production dependency audit is clear. The backend omit-dev audit reports three moderate findings through Prisma's tooling dependency path; npm's proposed forced fix would downgrade Prisma to v6, so no forced downgrade was applied.

## Unverified without external services

- End-to-end login, contact, messaging, presence, and upload behavior.
- Full browser-level production cookie and realtime UI behavior on the eventual public domain.
- Visual browser smoke testing; no browser backend was available during the 2026-07-14 verification run.

These are observations, not authorization to fix unrelated issues. Address them only when they fall within the requested change or the user asks for hardening.
