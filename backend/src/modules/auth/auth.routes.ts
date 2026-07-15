import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/errors.js";
import * as controller from "./auth.controller.js";
import { editProfileSchema, loginSchema, profileImageSchema, searchUserSchema, signupSchema } from "./auth.schemas.js";

export const authRouter = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

authRouter.post("/signup", authLimiter, validate({ body: signupSchema }), asyncHandler(controller.signup));
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(controller.login));
authRouter.post("/logout", controller.logout);
authRouter.get("/check", protectRoute, asyncHandler(controller.checkAuth));
authRouter.get("/usersearch", protectRoute, validate({ query: searchUserSchema }), asyncHandler(controller.searchUser));
authRouter.put("/edit-profile", protectRoute, validate({ body: editProfileSchema }), asyncHandler(controller.editProfile));
authRouter.put("/update-profile", protectRoute, validate({ body: profileImageSchema }), asyncHandler(controller.updateProfile));
