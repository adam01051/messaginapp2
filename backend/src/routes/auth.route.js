import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,editProfileData,getImages} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();


// Start Google auth


router.post("/login", login);
router.post("/signup", signup);
router.get("/images", protectRoute, getImages);

router.post("/logout", logout);

router.put("/edit-profile", protectRoute, editProfileData);
router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.get("/usersearch", protectRoute, searchUser);


export default router;