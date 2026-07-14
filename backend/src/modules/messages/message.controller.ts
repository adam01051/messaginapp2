import type { RequestHandler } from "express";
import { emitToUser } from "../../realtime/socket.js";
import * as service from "./message.service.js";

export const getMessages: RequestHandler = async (req, res) => {
  const { userId } = req.validated?.params as { userId: number };
  const { cursor, limit } = req.validated?.query as { cursor?: number; limit: number };
  res.json(await service.getMessages(req.user!.id, userId, cursor, limit));
};

export const sendMessage: RequestHandler = async (req, res) => {
  const { userId } = req.validated?.params as { userId: number };
  const { text, image } = req.validated?.body as { text: string; image?: string | null };
  const { message, senderContact } = await service.sendMessage(req.user!.id, userId, text, image);
  emitToUser(userId, "conversationUpdated", { contact: senderContact });
  emitToUser(userId, "newMessage", message);
  res.status(201).json(message);
};
