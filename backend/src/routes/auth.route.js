import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,addUser,signupgoogle} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/signupgoogle", signupgoogle);
router.post("/login", login);

router.post("/logout", logout);
router.put("/update-profile",protectRoute  ,updateProfile);
router.get("/check", protectRoute, checkAuth);
router.get("/usersearch", protectRoute, searchUser);
router.get("/add-user", protectRoute, addUser);

export default router;
    

  