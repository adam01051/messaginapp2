import { config } from "dotenv";
config();

import pkg from "pg";
const { Pool } = pkg;



const pool = new Pool({
	user: process.env.PG_NAME || "adam",
	password: process.env.PG_PASSWORD || "password",
	host: process.env.PG_HOST || "localhost",
	port: process.env.PG_PORT || 5432,
	database: process.env.PG_DATABASE || "messaging_app2",
});


pool
	.connect()
	.then((client) => {
		console.log(" Postgres is connected");
		client.release();
	})
	.catch((err) => {
		console.error(" Postgres connection error:", err.message);
	});

export default pool;
