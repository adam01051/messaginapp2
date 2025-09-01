import { generateToken } from "../lib/utils.js";
import passport from "passport"; 
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import pool from "../lib/postgres.js";
import express from "express";





export const initGoogleAuth = passport.authenticate("google", {
	scope: ["email", "profile"],
	session: false,
});

// Google Callback Handler
export const googleAuthCallback = (req, res, next) => {
	passport.authenticate("google", { session: false }, (err, user, info) => {
		if (err || !user) {
			console.error(
				"Authentication error:",
				err || info?.message || "No user found"
			);
			return res.redirect("http://localhost:5173?error=auth_failed");
		}
		generateToken(user.id, res); // Sets JWT cookie
		res.redirect("http://localhost:5173");
	})(req, res, next);
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



export const signup = async (req, res) => {
	const { fullName, email, password, username } = req.body;
	try {
		if (!fullName || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		if (password.length < 6) {
			return res
				.status(400)
				.json({ message: "Password must be at least 6 characters" });
		}

		const checkEmail = await pool.query("select * from users where email = $1", [
			email,
		]);
/* */
		if (checkEmail.rows.length > 0)
			return res.status(400).json({ message: "Email already exists" });

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const result = await pool.query(
			"insert into users (name, email,username, password_, number) values ($1, $2, $3, $4,$5) RETURNING id, name AS fullName, email,username",
			[fullName, email, username, hashedPassword, null]
		);
		const newUser = result.rows[0];
	
	if (newUser) {
			// generate jwt token here
			const r1 = generateToken(newUser.id, res);

			res.status(201).json(newUser);
		} else {
			res.status(400).json({ message: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};
export const searchUser = async (req, res) => {
	const { username } = req.query; // ✅ GET requests should use query
	try {
		const result = await pool.query(
			"SELECT * FROM users WHERE username ILIKE $1", // ILIKE for case-insensitive search
			[username] // % for partial matches
		);

	
		res.json(result.rows); // ✅ return results to frontend
	} catch (error) {
		console.log("Error in searchUser:", error.message);
		res.status(500).json({ message: "problem in finding user" });
	}
};




export const login = async (req, res) => {
	const { email, password } = req.body;
	try {

		const userDetails = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email]
		);
		const user = userDetails.rows[0];
		if (!user) {
			console.log("working login email check");
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password_);
		if (!isPasswordCorrect) {
			console.log("pass incorrect");
			return res.status(400).json({ message: "Invalid credentials" });
		}

		generateToken(user.id, res);

		const allPics = await pool.query(
			`SELECT * FROM profile_pics where user_ref =$1 ORDER BY profile_id DESC`,
			[user.id]
		);
		

		res.status(200).json({ 
			id: user.id,
			fullName: user.name,
			email: user.email,
			username: user.username,
			number: user.number,
			profilePic :allPics.rows
		}); 
		
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};



export const getImages = async (req, res) => {
	try {
		const allPics = await pool.query(
			`SELECT * FROM profile_pics ORDER BY profile_id DESC`
		);
		
		res.status(200).json(allPics.rows);
	} catch (error) {
		console.log("error in getting images:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};





export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });

	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};




export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body;
		const userId = req.user.id;

		if (!profilePic) {
			return res.status(400).json({ message: "Profile pic is required" });
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic);

		/*const updatedUser = await pool.query(
			`UPDATE users SET profileimage = $1 WHERE id = $2 RETURNING id, name AS fullName, email, username, profileimage`,
			[uploadResponse.secure_url, userId]
		);*/ //will change into adding  profile picture on the seperte table so that user can have multiple profile pics
		
		const allPics= await pool.query(
			"insert into profile_pics (profile_url,user_ref) values ($1,$2)  returning *",
			[uploadResponse.secure_url,userId]
		);
	
		res.status(200).json(allPics.rows);
	} catch (error) {
		console.log("error in update profile:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};




export const editProfileData = async (req, res) => {

	try {
		const { name, username, number } = req.body;
		const userId = req.user.id;

		if (!name || !username || !number) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const result = await pool.query(
			`UPDATE users
			 SET name = $1, username = $2, number = $3
			 WHERE id = $4
			 RETURNING *`,
			[name, username, number, userId]
		);//finished  for now

		res.status(200).json(result.rows[0]);

	} catch (error) {
		console.log("error in update profile:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};




export const checkAuth = async (req, res) => {
	try {
		const allPics = await pool.query(
			`SELECT * FROM profile_pics ORDER BY profile_id DESC`,
		);

		res.status(200).json({
			...req.user,
			profilePics: allPics.rows,
		});
	} catch (error) {
		console.log("Error in checkAuth controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

