import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { closeSocket, initializeSocket } from "./realtime/socket.js";

const app = createApp();
const server = http.createServer(app);
initializeSocket(server);

server.listen(env.PORT, () => logger.info({ port: env.PORT }, "server listening"));

let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "graceful shutdown started");
  server.close();
  await closeSocket();
  await prisma.$disconnect();
  logger.info("graceful shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (error) => logger.error({ err: error }, "unhandled rejection"));
process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "uncaught exception");
  void shutdown("uncaughtException");
});
