---
name: maintain-messaging-app
description: Inspect, modify, debug, or extend this repository's React/Vite, Zustand, TypeScript/Express, Prisma/PostgreSQL, Socket.IO, and Cloudinary messaging application. Use for changes to authentication, profiles, contacts, chat messages, presence, image uploads, routes, database models or migrations, UI behavior, configuration, or project documentation in this repository.
---

# Maintain Messaging App

## Establish context

1. Read `/AGENTS.md` and `/docs/ai/README.md` from the repository root.
2. Read only the `docs/ai` pages relevant to the requested change.
3. Inspect the current implementation before trusting the README or historical notes.
4. Check `git status --short` and preserve unrelated user changes.

## Trace changes end to end

- For API work, follow route -> validation/authentication middleware -> controller -> service -> Prisma/Cloudinary/Socket.IO -> frontend store -> component.
- For UI work, follow route/page -> component -> Zustand store -> Axios or socket boundary.
- Keep Prisma camelCase fields aligned with existing physical names through `@map`/`@@map`; do not rename production columns implicitly.
- Treat IDs crossing HTTP and Socket.IO boundaries as potentially string-valued; compare deliberately and parameterize every SQL value.
- Preserve cookie-based authentication by keeping Axios credentials, API CORS credentials, cookie flags, and production origin behavior compatible.

## Implement narrowly

- Keep backend code in strict TypeScript/ES modules and frontend code in JavaScript/JSX unless a task explicitly expands the migration.
- Keep state changes in the appropriate Zustand store; keep components focused on rendering and interaction.
- Do not introduce a new dependency when the existing stack can solve the task clearly.
- Never add secrets or real credentials. Update documented environment variable names when configuration changes.
- Do not use direct `pg` access or raw SQL in application code. Do not claim a schema change is complete without a Prisma migration.

## Validate proportionally

1. Run `npm run lint --prefix frontend` for frontend JavaScript changes.
2. Run `npm run build --prefix frontend` for frontend or production-serving changes.
3. Run `npm run build --prefix backend` and `npm test --prefix backend` for backend changes.
4. Exercise affected endpoints or socket behavior when PostgreSQL and environment configuration are available.
5. If dependencies or services are unavailable, report the exact unrun validation instead of treating it as success.

## Preserve the AI record

- Update `docs/ai/architecture.md` when boundaries, data flow, routes, schema assumptions, or environment variables change.
- Update `docs/ai/project-state.md` when a verified risk is fixed or a new material constraint is discovered.
- Append a concise entry to `docs/ai/change-log.md` after material code or architecture changes. Do not log trivial formatting edits.
- Keep notes factual and dated. Separate verified behavior from assumptions that require a live database or external service.
