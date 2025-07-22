import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { connectPS } from "../lib/postgres.js";

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

		const db = await connectPS();

		const checkEmail = await db.query("select * from users where email = $1", [
			email,
		]);

		if (checkEmail.length > 0)
			return res.status(400).json({ message: "Email already exists" });

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const result = await db.query(
			"insert into users (name, email,username, password_) values ($1, $2, $3, $4) RETURNING id, name AS fullName, email,username",
			[fullName, email, username, hashedPassword]
		);
		const newUser = result.rows[0];
		console.log(newUser);
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

export const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const db = await connectPS();
		const userDetails = await db.query(
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

	///generateToken(user.id, res);

		res.status(200).json({
			id: user.id,
			fullName: user.fullName,
			email: user.email,
			profilePic: user.profilePic,
			username : user.username,

		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
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
		const userId = req.user._id;

		if (!profilePic) {
			return res.status(400).json({ message: "Profile pic is required" });
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic);
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: uploadResponse.secure_url },
			{ new: true }
		);

		res.status(200).json(updatedUser);
	} catch (error) {
		console.log("error in update profile:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const checkAuth = (req, res) => {
	try {
		res.status(200).json(req.user);
	} catch (error) {
		console.log("Error in checkAuth controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};
