import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,addUser,initGoogleAuth, googleAuthCallback,editProfileData,getImages} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();


 

router.get("/google", initGoogleAuth);
router.get("/google/callback", googleAuthCallback);


router.post("/login", login);
router.post("/signup", signup);
router.get("/images", protectRoute, getImages);

router.post("/logout", logout);

router.put("/edit-profile", protectRoute, editProfileData);
router.put("/update-profilepic", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.get("/usersearch", protectRoute, searchUser);
router.get("/add-user", protectRoute, addUser);

export default router;
    

  