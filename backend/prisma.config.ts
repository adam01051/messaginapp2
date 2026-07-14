import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Runtime startup still requires DATABASE_URL through src/config/env.ts.
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/messaging_app2?schema=public",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
