import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/live", (_req, res) => res.json({ status: "ok" }));
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.user.count({ take: 1 });
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});
