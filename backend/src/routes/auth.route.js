import express from "express";
import { signup, login, logout,updateProfile, checkAuth, searchUser,addUser} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import passport from "passport"; 
import pass from "../lib/passport.js";
const router = express.Router();
import { generateToken } from "../lib/utils.js";
router.post("/signup", signup);
 

router.get(
	"/google",
	passport.authenticate("google", { scope: ["email", "profile"] })
);  


router.get(
	"/google/callback",
	passport.authenticate("google", { failureRedirect: "/" }),
	(req, res) => {
		// user is now attached to req.user by passport
        const user = req.user;
        
        
		// generate JWT token and send cookie or JSON response
		generateToken(user.id, res);

		// Redirect or respond as you wish
		 res.redirect("http://localhost:5173");  // or send JSON with token etc.
	}
);


router.post("/login", login);

router.post("/logout", logout);
router.put("/update-profile",protectRoute  ,updateProfile);
router.get("/check", protectRoute, checkAuth);
router.get("/usersearch", protectRoute, searchUser);
router.get("/add-user", protectRoute, addUser);

export default router;
    

  