import { config } from "dotenv";
import { z } from "zod";

config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(6001),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
      message: "DATABASE_URL must start with postgresql:// or postgres://",
    }),
  JWT_SECRET: z.string().min(12, "JWT_SECRET must contain at least 12 characters"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:6002"),
  COOKIE_SECURE: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  CLOUDINARY_NAME: z.string().optional(),
  CLOUDINARY_KEY: z.string().optional(),
  CLOUDINARY_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
}).superRefine((value, context) => {
  const cloudinaryValues = [value.CLOUDINARY_NAME, value.CLOUDINARY_KEY, value.CLOUDINARY_SECRET];
  const configuredValues = cloudinaryValues.filter(Boolean).length;
  const requiresCloudinary = value.NODE_ENV === "production";

  if (configuredValues !== 0 && configuredValues !== cloudinaryValues.length) {
    context.addIssue({
      code: "custom",
      path: ["CLOUDINARY_NAME"],
      message: "CLOUDINARY_NAME, CLOUDINARY_KEY, and CLOUDINARY_SECRET must be configured together",
    });
  }

  if (requiresCloudinary && configuredValues !== cloudinaryValues.length) {
    context.addIssue({
      code: "custom",
      path: ["CLOUDINARY_NAME"],
      message: "Cloudinary credentials are required in production",
    });
  }
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
