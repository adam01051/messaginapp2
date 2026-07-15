import { z } from "zod";

const dataImage = z.string().max(8_000_000).regex(/^data:image\/(png|jpe?g|webp|gif);base64,/i, "A valid image is required");

export const messageParamsSchema = z.object({ userId: z.coerce.number().int().positive() });
export const messageQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const sendMessageSchema = z.object({
  text: z.string().trim().max(4000).optional().default(""),
  image: dataImage.nullish(),
}).refine((value) => value.text.length > 0 || Boolean(value.image), { message: "A message or image is required" });
