import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { ZodError } from "zod";
import { logger } from "./logger.js";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "APP_ERROR",
  ) {
    super(message);
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, "Route not found", "ROUTE_NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let status = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_ERROR";

  if (error instanceof AppError) {
    ({ status, message, code } = error);
  } else if (error instanceof ZodError) {
    status = 400;
    message = error.issues[0]?.message ?? "Invalid request";
    code = "VALIDATION_ERROR";
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      status = 409;
      message = "A record with this value already exists";
      code = "CONFLICT";
    } else if (error.code === "P2025") {
      status = 404;
      message = "Record not found";
      code = "NOT_FOUND";
    }
  }

  if (status >= 500) {
    logger.error({ err: error, requestId: req.id }, "request failed");
  }

  res.status(status).json({ message, code, requestId: req.id });
};
