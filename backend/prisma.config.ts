import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL;

const datasource = migrationUrl
  ? {
      url: migrationUrl,
      ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
    }
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma CLI commands prefer DIRECT_URL when runtime traffic uses a pooler.
  // Generate/validate still work without either connection variable.
  datasource,
});
