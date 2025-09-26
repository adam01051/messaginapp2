import { config } from "dotenv";
config();

import pkg from "pg";
const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool(
	isProduction
		? {
				connectionString: process.env.DATABASE_URL,
				ssl: { rejectUnauthorized: false }, // Render / production
		  }
		: {
				user: process.env.PG_NAME || "postgres",
				password: process.env.PG_PASSWORD || "password",
				host: process.env.PG_HOST || "localhost",
				port: process.env.PG_PORT || 5432,
				database: process.env.PG_DATABASE || "my_local_db",
		  }
);

// Test the connection
pool
	.connect()
	.then((client) => {
		console.log("✅ Postgres is connected");
		client.release();
	})
	.catch((err) => {
		console.error("❌ Postgres connection error:", err.message);
	});

export default pool;
