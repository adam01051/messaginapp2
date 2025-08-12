import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,addUser,initGoogleAuth, googleAuthCallback} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import passport from "passport"; 
import pass from "../lib/passport.js";
const router = express.Router();
import { generateToken } from "../lib/utils.js";
router.post("/signup", signup);
 

router.get("/google", initGoogleAuth);
router.get("/google/callback", googleAuthCallback);


router.post("/login", login);

router.post("/logout", logout);
router.put("/update-profile",protectRoute  ,updateProfile);
router.get("/check", protectRoute, checkAuth);
router.get("/usersearch", protectRoute, searchUser);
router.get("/add-user", protectRoute, addUser);

export default router;
    

  