import type { RequestHandler } from "express";
import * as service from "./contact.service.js";

export const list: RequestHandler = async (req, res) => res.json(await service.listContacts(req.user!.id));

export const add: RequestHandler = async (req, res) => {
  const { username } = req.validated?.body as { username: string };
  res.status(201).json(await service.addContact(req.user!.id, req.user!.username, username));
};

export const remove: RequestHandler = async (req, res) => {
  const { contactId } = req.validated?.params as { contactId: number };
  res.json(await service.deleteContact(req.user!.id, contactId));
};
