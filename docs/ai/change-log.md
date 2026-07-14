# AI-assisted change log

## 2026-07-14 — Deployment readiness and realtime contacts

- Made contact creation/removal mutual, transactional, idempotent, and realtime across recipient tabs, with offline PostgreSQL recovery.
- Added permanent Socket.IO integration coverage and frontend authenticated-session contact listeners with toast/sidebar updates.
- Kept image storage on Cloudinary, organized profile/message assets into scoped folders, required complete production credentials, and allowed Cloudinary in the production CSP.
- Added deterministic single-service build/release/start scripts and rewrote the README around architecture, environment, testing, storage, deployment, troubleshooting, and future mobile compatibility.
- Verified 21 backend tests on disposable PostgreSQL 16, zero migration drift, a reversible Cloudinary upload, managed-database readiness, and production SPA serving.

## 2026-07-14 — Fresh managed database workflow

- Made a new empty PostgreSQL 16 database the authoritative production path; legacy database adoption is no longer in scope.
- Removed Prisma's implicit localhost datasource fallback and documented direct SSL connection configuration and deployment commands.
- Accepted both standard `postgres://` and `postgresql://` connection URL schemes.
- Added a destructive-test guard that rejects database names without a disposable-test suffix.
- Applied the baseline migration to the configured managed Prisma PostgreSQL database and verified current migration status and HTTP readiness.

## 2026-07-14 — PostgreSQL migration verification

- Fixed Vitest database URL precedence so integration tests honor an explicitly supplied disposable PostgreSQL target.
- Added database coverage for email/username uniqueness, contact identity and foreign keys, scoped avatar history, both pagination pages, and the authenticated REST messaging flow.
- Verified clean deployment and zero drift on PostgreSQL 16, and verified baseline resolution on a simulated legacy schema without Prisma migration history.
- Smoke-tested Socket.IO authentication, multi-tab presence, disconnect cleanup, and message delivery against the live backend.
- Added a non-destructive legacy-adoption and clean-install runbook. The real existing database and Cloudinary flows remain external verification gates.

## 2026-07-10 — Prisma and reliability migration

- Replaced application `pg` queries with Prisma 7 and added an inferred, data-preserving baseline migration workflow.
- Converted the backend to strict TypeScript modules with validation, services, structured errors/logging, security middleware, health checks, tests, CI, and graceful shutdown.
- Added RESTful contacts, preserved messages on contact removal, cursor-paginated conversations, scoped avatar DTOs, and validated uploads.
- Authenticated Socket.IO from the JWT cookie and added multi-tab/device presence tracking.
- Updated the React/Zustand client for the new contracts.
- Could not introspect or apply migrations because the configured PostgreSQL connection rejected authentication (`28P01`).

## 2026-07-10 — Project onboarding baseline

- Analyzed the frontend/backend structure and traced authentication, contacts, messages, profile images, and Socket.IO presence.
- Added root agent guidance in `AGENTS.md`.
- Added the `maintain-messaging-app` project skill.
- Established `docs/ai` architecture, state, and change records.
- Made no application runtime or database changes.
