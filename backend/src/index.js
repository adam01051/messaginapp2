import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import pool from "./lib/postgres.js";
import path from "path";
import passport from "passport";
import session from "express-session";

 

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();



// Increase payload size limits
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const allowedOrigins = [
	"http://localhost:5173",
	"https://app1-zaix.onrender.com/api", // ✅ replace with actual frontend URL
];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
// **ADD session middleware here**
app.use(
	session({
	  secret: process.env.SESSION_SECRET || "your-secret-key", // put secret in .env
	  resave: false,
	  saveUninitialized: false,
	  cookie: { secure: false }, // set to true if using HTTPS
	})
  );
  
  // **INITIALIZE passport and passport session**
  app.use(passport.initialize());
  app.use(passport.session());



app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
	});
}

server.listen(PORT, () => {
	console.log("server is running on PORT:" + PORT);
	
});
