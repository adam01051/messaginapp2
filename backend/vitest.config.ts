import { defineConfig } from "vitest/config";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/messaging_app_test?schema=public";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "test-only-secret-key",
      CLIENT_ORIGIN: "http://localhost:6002",
      COOKIE_SECURE: "false",
      LOG_LEVEL: "silent",
    },
    coverage: { reporter: ["text", "html"] },
  },
});
