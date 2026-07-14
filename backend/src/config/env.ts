import { config } from "dotenv";
import { z } from "zod";

config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5001),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  JWT_SECRET: z.string().min(12, "JWT_SECRET must contain at least 12 characters"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  CLOUDINARY_NAME: z.string().optional(),
  CLOUDINARY_KEY: z.string().optional(),
  CLOUDINARY_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = schema.safeParse({
  ...process.env,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? process.env.LOCAL_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
