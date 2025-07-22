import jwt from "jsonwebtoken";
import { connectPS } from "../lib/postgres.js";


export const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;

		if (!token) {
			return res
				.status(401)
				.json({ message: "Unauthorized - No Token Provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ message: "Unauthorized - Invalid Token" });
		}

		

		const db = await connectPS();
		const result = await db.query("select id, username, email from users where id = $1",[decoded.userId]);
	
		if (result.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		req.user = result.rows[0];

		next();
	} catch (error) {
		console.log("Error in protectRoute middleware: ", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};
