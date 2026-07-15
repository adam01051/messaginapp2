import type { AuthUser } from "../modules/auth/auth.dto.js";

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthUser;
      validated?: {
        body: unknown;
        query: unknown;
        params: unknown;
      };
    }
  }
}

export {};
