import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/errors.js";
import * as controller from "./message.controller.js";
import { messageParamsSchema, messageQuerySchema, sendMessageSchema } from "./message.schemas.js";

export const messageRouter = Router();

messageRouter.use(protectRoute);
messageRouter.get("/:userId", validate({ params: messageParamsSchema, query: messageQuerySchema }), asyncHandler(controller.getMessages));
messageRouter.post("/send/:userId", validate({ params: messageParamsSchema, body: sendMessageSchema }), asyncHandler(controller.sendMessage));
