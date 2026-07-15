import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasource = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
    }
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Generate/validate do not need a connection. Database commands fail safely
  // until DATABASE_URL explicitly identifies the intended PostgreSQL database.
  datasource,
});
