import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { readAuthCookie, verifyToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

let io: Server | undefined;
const userSockets = new Map<number, Set<string>>();

const publishPresence = () => io?.emit("getOnlineUsers", [...userSockets.keys()].map(String));

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, { cors: { origin: env.CLIENT_ORIGIN, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const token = readAuthCookie(socket.handshake.headers.cookie);
      if (!token) return next(new Error("Unauthorized"));
      const { userId } = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { id: true } });
      if (!user) return next(new Error("Unauthorized"));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;
    const sockets = userSockets.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    userSockets.set(userId, sockets);
    publishPresence();

    socket.on("disconnect", () => {
      const current = userSockets.get(userId);
      current?.delete(socket.id);
      if (!current?.size) userSockets.delete(userId);
      publishPresence();
    });
  });

  logger.info("Socket.IO initialized with cookie authentication");
  return io;
};

export const emitToUser = (userId: number, event: string, payload: unknown) => {
  for (const socketId of userSockets.get(userId) ?? []) io?.to(socketId).emit(event, payload);
};

export const closeSocket = async () => {
  if (!io) return;
  await new Promise<void>((resolve) => io!.close(() => resolve()));
  io = undefined;
  userSockets.clear();
};
