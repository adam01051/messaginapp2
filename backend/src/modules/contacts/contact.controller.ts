import type { RequestHandler } from "express";
import { emitToUser } from "../../realtime/socket.js";
import * as service from "./contact.service.js";

export const list: RequestHandler = async (req, res) => res.json(await service.listContacts(req.user!.id));

export const add: RequestHandler = async (req, res) => {
  const { username } = req.validated?.body as { username: string };
  const { recipientId, recipientContact, created, ...response } = await service.addContact(
    req.user!.id,
    req.user!.username,
    username,
  );
  if (created) emitToUser(recipientId, "contactAdded", { contact: recipientContact });
  res.status(201).json(response);
};

export const remove: RequestHandler = async (req, res) => {
  const { contactId } = req.validated?.params as { contactId: number };
  const response = await service.deleteContact(req.user!.id, contactId);
  emitToUser(req.user!.id, "contactRemoved", { contactId });
  emitToUser(contactId, "contactRemoved", { contactId: req.user!.id });
  res.json(response);
};
