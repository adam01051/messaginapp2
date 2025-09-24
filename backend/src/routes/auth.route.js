import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,initGoogleAuth, googleAuthCallback,editProfileData,getImages} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import passport from "passport";
import pass from "../lib/passport.js";
const router = express.Router();
import { generateToken } from "../lib/utils.js";

// Start Google auth

router.get("/google", initGoogleAuth);
router.get("/google/callback", googleAuthCallback);


router.post("/login", login);
router.post("/signup", signup);
router.get("/images", protectRoute, getImages);

router.post("/logout", logout);

router.put("/edit-profile", protectRoute, editProfileData);
router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.get("/usersearch", protectRoute, searchUser);


export default router;