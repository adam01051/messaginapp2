# Project state

Last reviewed: 2026-07-14

## Verified baseline

- Prisma migrations, backend Vitest tests, and a CI workflow are present. CI provisions PostgreSQL 16, applies migrations, and runs database integration tests; seed data is still pending.
- Frontend lint and production build pass after dependency installation.
- The root, frontend, and backend each have package metadata/lockfiles; dependencies are managed separately by the current scripts.
- Prisma uses camelCase application fields mapped onto existing snake_case table/column names.
- The baseline migration deploys cleanly to disposable PostgreSQL 16, reports no migration drift, and passes six database/REST integration scenarios.
- A simulated legacy database with the baseline schema and no Prisma history was introspected, diffed without drift, marked as baselined, and reported current migration status.
- Live Socket.IO smoke testing verified cookie authentication, unauthenticated rejection, multi-tab presence, last-tab cleanup, and `newMessage` delivery.

## Material risks to consider before feature work

- The checked-in baseline was inferred from code because no valid existing-database clone is available. Compare non-destructive introspection and drift output against a valid restored clone before marking the baseline applied outside disposable verification databases.
- Socket authentication, multi-tab presence, shared CORS configuration, RESTful contact mutations, message-preserving contact deletion, scoped avatars, and JWT 401 handling are implemented.
- Frontend store error paths tolerate network failures that do not contain an Axios response.
- Image data URLs are validated and the request limit is 10 MB; direct-to-cloud signed uploads would still scale better.
- Database uniqueness, foreign-key, contact, avatar, and pagination behavior is verified on disposable PostgreSQL 16 but remains unverified against the inaccessible existing database.
- The frontend production dependency audit is clear. The backend production audit is clear; three moderate findings remain in Prisma CLI's development-only dependency, and npm's proposed forced fix would downgrade Prisma to v6.

## Unverified without external services

- The exact production PostgreSQL schema, indexes, and constraints.
- End-to-end login, contact, messaging, presence, and upload behavior.
- Cloudinary upload configuration and production cookie/CORS behavior.
- Visual browser smoke testing; no browser backend was available during the 2026-07-14 verification run.

These are observations, not authorization to fix unrelated issues. Address them only when they fall within the requested change or the user asks for hardening.
