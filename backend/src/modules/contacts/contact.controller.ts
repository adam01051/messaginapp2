import type { RequestHandler } from "express";
import { emitToUser } from "../../realtime/socket.js";
import * as service from "./contact.service.js";

export const list: RequestHandler = async (req, res) => res.json(await service.listContacts(req.user!.id));

export const add: RequestHandler = async (req, res) => {
  const { username } = req.validated?.body as { username: string };
  const result = await service.addContact(
    req.user!.id,
    req.user!.username,
    username,
  );
  res.status(201).json({ success: result.success, contactId: result.contactId, contact: result.contact });
};

export const remove: RequestHandler = async (req, res) => {
  const { contactId } = req.validated?.params as { contactId: number };
  const { peerContact, ...response } = await service.deleteContact(req.user!.id, contactId);
  emitToUser(req.user!.id, "conversationReset", { userId: contactId, contact: null });
  emitToUser(contactId, "conversationReset", { userId: req.user!.id, contact: peerContact });
  res.json(response);
};
