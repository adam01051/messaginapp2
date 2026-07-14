import type { RequestHandler } from "express";
import { emitToUser } from "../../realtime/socket.js";
import * as service from "./block.service.js";

export const list: RequestHandler = async (req, res) => res.json(await service.listBlockedUsers(req.user!.id));

export const block: RequestHandler = async (req, res) => {
  const { userId } = req.validated?.params as { userId: number };
  const response = await service.blockUser(req.user!.id, userId);
  emitToUser(req.user!.id, "conversationReset", { userId, contact: null });
  emitToUser(userId, "conversationReset", { userId: req.user!.id, contact: null });
  res.status(201).json(response);
};

export const unblock: RequestHandler = async (req, res) => {
  const { userId } = req.validated?.params as { userId: number };
  res.json(await service.unblockUser(req.user!.id, userId));
};
