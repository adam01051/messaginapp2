import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/errors.js";
import * as controller from "./contact.controller.js";
import { addContactSchema, contactParamsSchema } from "./contact.schemas.js";

export const contactRouter = Router();

contactRouter.use(protectRoute);
contactRouter.get("/", asyncHandler(controller.list));
contactRouter.post("/", validate({ body: addContactSchema }), asyncHandler(controller.add));
contactRouter.delete("/:contactId", validate({ params: contactParamsSchema }), asyncHandler(controller.remove));
