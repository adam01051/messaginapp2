import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/live", (_req, res) => res.json({ status: "ok" }));
healthRouter.get("/ready", async (_req, res) => {
  try {
    await Promise.all([
      prisma.user.findFirst({ select: { id: true } }),
      prisma.blockedUser.findFirst({ select: { blockerId: true } }),
      prisma.message.findFirst({ select: { imagePublicId: true } }),
    ]);
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});
