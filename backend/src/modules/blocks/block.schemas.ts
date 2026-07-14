import { z } from "zod";

export const blockParamsSchema = z.object({ userId: z.coerce.number().int().positive() });
