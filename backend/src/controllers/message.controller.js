
import pool from "../lib/postgres.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


export const getUsersForSidebar = async (req, res) => {
	try {
		const myId = req.user.id;

		const result = await pool.query(
			`
			-- Get users from your contacts
			SELECT 
			  u.id,
			  u.name,
			  u.email,
			  u.username,
			  MAX(m.created_at) AS last_message_time,
			  true AS is_contact
			FROM contacts c
			JOIN users u 
			  ON c.contact_id = u.id
			LEFT JOIN messages m 
			  ON (u.id = m.sender_id AND m.receiver_id = $1) 
			  OR (u.id = m.receiver_id AND m.sender_id = $1)
			WHERE c.user_id = $1
			GROUP BY u.id
		  
			UNION
		  
			-- Get users who messaged you, but are NOT in your contacts
			SELECT 
			  u.id,
			  u.name,
			  u.email,
			  u.username,
			  MAX(m.created_at) AS last_message_time,
			  false AS is_contact
			FROM messages m
			JOIN users u 
			  ON u.id = m.sender_id
			WHERE m.receiver_id = $1
			  AND u.id NOT IN (
				SELECT contact_id FROM contacts WHERE user_id = $1
			  )
			GROUP BY u.id
		  
			ORDER BY last_message_time DESC NULLS LAST
			`,
			[myId]
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};


export const addUser = async (req, res) => {

	const { username } = req.query;
	const myId = req.user.id;
	const myUsername = req.user.username;
	try {
		

		if (username === myUsername) {
			return res
				.status(404)
				.json({ message: "new contact and current user id is identical)" });
		}

		const result = await pool.query(
			"SELECT id FROM users WHERE username = $1", 
			[username]
		);

		const newContactID = result.rows[0]?.id;
				if (!newContactID) {
					return res.status(404).json({ message: "User not found" });
				}
		const result2 = await pool.query("insert into contacts (user_id, contact_id) values ($1,$2) returning *", [myId, newContactID]);


		res.json({ success: true, contactId: newContactID });

	} catch (error) {
		console.log("Error in add users:", error.message);
		res.status(500).json({ message: "problem in finding user" });
	}
}


export const deleteUser = async (req, res) => {
	const { user } = req.query;
	const myId = req.user.id;


	try {
		await pool.query(
			"delete from contacts where (user_id = $1 and contact_id =$2)",
			[myId, Number(user.id)]
		);
		await pool.query(
			"DELETE FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
			[myId, Number(user.id)]
		);
		
	
		
	
		
		res.json({ success: true, contactId: Number(user.id) });
	} catch (error) {
		console.log("Error in add users:", error.message);
		res.status(500).json({ message: "problem in finding user" });
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




