import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./block.controller.js";
import { blockParamsSchema } from "./block.schemas.js";

export const blockRouter = Router();

blockRouter.use(protectRoute);
blockRouter.get("/", asyncHandler(controller.list));
blockRouter.post("/:userId", validate({ params: blockParamsSchema }), asyncHandler(controller.block));
blockRouter.delete("/:userId", validate({ params: blockParamsSchema }), asyncHandler(controller.unblock));
