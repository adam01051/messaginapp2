import { config } from "dotenv";
config();

import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false,
});

pool
	.connect()
	.then((client) => {
		console.log("✅ Postgres is connected");
		client.release();
	})
	.catch((error) => {
		console.error("❌ Postgres connection error:", error.message);
	});

export default pool;

// -- Users table
// CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     name TEXT NOT NULL,
//     username TEXT UNIQUE NOT NULL,
//     password_ TEXT NOT NULL,
//     profileImage TEXT,
//     email TEXT UNIQUE,
//     number TEXT
// );

// -- Contacts table
// CREATE TABLE contacts (
//     id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     contact_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     UNIQUE (user_id, contact_id)
// );

//create user_contacts

// -- Messages table
// CREATE TABLE messages (
//     id SERIAL PRIMARY KEY,
//     sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     content TEXT NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
