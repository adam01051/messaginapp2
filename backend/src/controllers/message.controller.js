
import pool from "../lib/postgres.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user.id;

		
		const result = await pool.query(
			`SELECT 
				u.id,
				u.name,
				u.email,
				
				u.username,
				MAX(m.created_at) AS last_message_time
			 FROM contacts c
			 JOIN users u 
			   ON c.contact_id = u.id   -- ✅ get user details of contacts
			 LEFT JOIN messages m 
			   ON (u.id = m.sender_id AND m.receiver_id = $1) 
			   OR (u.id = m.receiver_id AND m.sender_id = $1)
			 WHERE c.user_id = $1        -- ✅ only my contacts
			 GROUP BY u.id
			 ORDER BY last_message_time DESC NULLS LAST`,
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
	

		const result = await pool.query(
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


		const result = await pool.query(
			"insert into messages  (sender_id , receiver_id, content, image) values ($1,$2,$3,$4) returning *",
			[myId, receiverId, text, imageUrl]
		);
		
		const newMessage = result.rows[0]
		
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




