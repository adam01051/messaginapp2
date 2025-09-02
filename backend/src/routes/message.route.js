import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, sendMessage,addUser,deleteUser } from "../controllers/message.controller.js";
import { getMessages } from "../controllers/message.controller.js";

const router = express.Router();


router.get("/user",protectRoute, getUsersForSidebar);
router.get("/add-user", protectRoute, addUser);
router.get("/delete-user", protectRoute, deleteUser);


router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);




export default router;