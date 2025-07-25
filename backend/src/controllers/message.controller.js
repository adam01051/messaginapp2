import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { connectPS } from "../lib/postgres.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user.id;
		const db = await connectPS();
		const result = await db.query(
			"select id,name, email, profileimage,username from users where id != $1",
			[loggedInUserId]
		);

		const filteredUsers = result.rows;
		

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const myId = req.user.id;
	
		const db = await connectPS();
		const result = await db.query(
			"select * from messages where (sender_id =$1 and receiver_id =$2 ) or (sender_id =$2 and receiver_id =$1 ) ORDER BY created_at ASC",
			[myId, userToChatId]
		);
		const messages = result.rows;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { text, image } = req.body;
		const { id: receiverId } = req.params;
		const myId = req.user.id;

		let imageUrl;
		if (image) {
			
			const uploadResponse = await cloudinary.uploader.upload(image);
			imageUrl = uploadResponse.secure_url;
		}

		const db = await connectPS();
		const result = await db.query(
			"insert into messages  (sender_id , receiver_id, content, image) values ($1,$2,$3,$4) returning *",
			[myId, receiverId, text, imageUrl]
		);
		
		const newMessage = result.rows[0];
		
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};




