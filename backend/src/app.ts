import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { healthRouter } from "./health.routes.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { blockRouter } from "./modules/blocks/block.routes.js";
import { contactRouter } from "./modules/contacts/contact.routes.js";
import { messageRouter } from "./modules/messages/message.routes.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.id = req.header("x-request-id") ?? randomUUID();
    res.setHeader("x-request-id", req.id);
    next();
  });
  app.use(pinoHttp({ logger }));
  app.use(
    helmet({
      contentSecurityPolicy:
        env.NODE_ENV === "production"
          ? { directives: { imgSrc: ["'self'", "data:", "https://res.cloudinary.com"] } }
          : false,
    }),
  );
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.use(cookieParser());

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/blocks", blockRouter);
  app.use("/api/contacts", contactRouter);
  app.use("/api/messages", messageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
