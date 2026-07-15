import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { readAuthCookie, verifyToken } from "../lib/jwt.js";
import { getSessionUser } from "../modules/auth/auth.service.js";

export const protectRoute: RequestHandler = async (req, _res, next) => {
  try {
    const token = readAuthCookie(req.headers.cookie);
    if (!token) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    const { userId } = verifyToken(token);
    req.user = await getSessionUser(Number(userId));
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, "Unauthorized", "INVALID_TOKEN"));
  }
};
