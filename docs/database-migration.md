# PostgreSQL migration runbook

Use this runbook to adopt the checked-in Prisma baseline without replacing or deleting existing application data. Run every legacy-database step against a restored clone first. Never point a development or shadow URL at production.

## Required configuration

Set these variables in `backend/.env` or the shell running Prisma. Do not commit the file or print credentials in logs.

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/CLONED_DATABASE?schema=public
SHADOW_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/EMPTY_SHADOW_DATABASE?schema=public
```

`DATABASE_URL` must identify the disposable clone during reconciliation. `SHADOW_DATABASE_URL` must identify a separate empty database that Prisma may reset.

## Adopt an existing database

1. Create a PostgreSQL backup with the platform's normal backup process and restore it under a new database name. Confirm the source database is unchanged and the clone contains the expected row counts.
2. Point `DATABASE_URL` at the clone and print introspection output without overwriting the checked-in schema:

   ```sh
   npm run prisma:pull:print --prefix backend > /tmp/messaging-app-introspected.prisma
   ```

3. Compare `/tmp/messaging-app-introspected.prisma` with `backend/prisma/schema.prisma`. Review every table, physical column name, type, length, nullability, default, sequence, unique constraint, index, foreign key, and delete/update action. Preserve physical snake_case names with `@map` and `@@map`.
4. Ask Prisma to detect drift between the clone and the checked-in migration history:

   ```sh
   npm run prisma:verify:database --prefix backend
   ```

   The command exits `0` only when no difference is detected and exits `2` when drift exists. Reconcile drift with a reviewed Prisma migration; do not execute generated diff SQL directly against production.
5. Only after introspection and drift review pass on the clone, record the inferred baseline as applied on that clone:

   ```sh
   cd backend
   npx prisma migrate resolve --applied 00000000000000_baseline
   npm run prisma:migrate:status
   ```

6. Run the database and application checks against the clone:

   ```sh
   RUN_DATABASE_TESTS=true npm test --prefix backend
   npm run build --prefix backend
   npm run lint --prefix frontend
   npm run build --prefix frontend
   ```

Repeat the resolve step in production only during an approved deployment window, after a fresh rollback backup and after the restored clone has passed all checks. `migrate resolve` records migration history; it does not apply the baseline SQL.

## Initialize an empty database

For a new database with no application tables, point `DATABASE_URL` at the empty database and run:

```sh
npm run prisma:migrate:deploy --prefix backend
npm run prisma:migrate:status --prefix backend
npm run prisma:verify:database --prefix backend
RUN_DATABASE_TESTS=true npm test --prefix backend
```

Do not mark the baseline as resolved on an empty database; deploy it so Prisma creates the schema.

## Release gate

A production migration is ready only when the restored legacy clone has no unexplained drift, migration status is current, database integration tests pass, REST and Socket.IO smoke tests pass, rollback has been rehearsed, and no credentials or database dumps are included in version control. Cloudinary image flows require separate test credentials or a mock.
