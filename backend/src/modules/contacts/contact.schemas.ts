import { z } from "zod";

export const addContactSchema = z.object({ username: z.string().trim().min(3).max(100) });
export const contactParamsSchema = z.object({ contactId: z.coerce.number().int().positive() });
