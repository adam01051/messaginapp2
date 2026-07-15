# Fresh managed PostgreSQL setup

PostgreSQL stores the application data. Prisma is the ORM and migration client that connects the backend to PostgreSQL.

## Create the database

Create a new PostgreSQL 16 service with the managed provider and configure:

- an empty database named `messaging_app`;
- an application user that owns the database;
- required SSL connections;
- network access from the deployed backend and from the developer IP used for the initial migration.

Copy the provider's direct or session connection string. Do not use a transaction-pooler URL for migrations. URL-encode special characters in the username and password.

```text
postgresql://APP_USER:URL_ENCODED_PASSWORD@HOST:5432/messaging_app?schema=public&sslmode=require
```

## Configure and initialize

Copy `backend/.env.example` to the ignored `backend/.env`, set `DATABASE_URL` to the real connection string, and replace `JWT_SECRET`. Do not commit or print the file.

From the repository root, run:

```sh
npm ci --prefix backend
npm run prisma:validate --prefix backend
npm run prisma:migrate:deploy --prefix backend
npm run prisma:migrate:status --prefix backend
```

`prisma migrate deploy` applies `00000000000000_baseline` to the empty database and creates the application tables, constraints, indexes, sequences, and Prisma migration history. Do not use `prisma migrate resolve` on an empty database.

Start the application and check database readiness:

```sh
npm run dev --prefix backend
npm run dev --prefix frontend
curl http://localhost:6001/health/ready
```

The readiness response must be `{"status":"ready"}`.

## Deploy and operate

Store `DATABASE_URL`, optional `DIRECT_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `COOKIE_SECURE`, Cloudinary values, and `NODE_ENV=production` in `backend/.env`. Configure `frontend/.env` with the public `VITE_BACKEND_ORIGIN`. Use `COOKIE_SECURE=false` only for temporary direct-HTTP testing and restore `true` when HTTPS is available. Deploy both services and backend migrations with:

```sh
./deploy.sh
```

Create every future schema change as a new Prisma migration and deploy it with the same release command. Do not edit production tables manually. When runtime `DATABASE_URL` uses a pooler, set `DIRECT_URL` to the provider's direct/session connection so Prisma CLI operations avoid pooler advisory-lock contention.

## Production safety

- Do not set `SHADOW_DATABASE_URL` for migration deployment; Prisma only needs it for development/diff workflows.
- Never run with `RUN_DATABASE_TESTS=true` against `messaging_app`. Integration tests delete all application records and enforce a disposable database name ending in `_test`, `_testing`, `_ci`, or `_verify`.
- Use a separate disposable database if database integration testing is needed.
- Keep connection strings, database dumps, JWT secrets, and Cloudinary secrets outside version control.
