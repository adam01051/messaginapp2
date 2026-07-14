import { z } from "zod";

const dataImage = z.string().max(8_000_000).regex(/^data:image\/(png|jpe?g|webp|gif);base64,/i, "A valid image is required");

export const signupSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  username: z.string().trim().min(3).max(100),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const profileImageSchema = z.object({ profilePic: dataImage });

export const editProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(3).max(100),
  number: z.string().trim().min(1).max(30),
});

export const searchUserSchema = z.object({
  username: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
