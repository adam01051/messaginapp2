
import pg from "np";


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "messagin_app",
    password: "4909770",
    port: 5432,
})
db.connect();











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

// -- Messages table
// CREATE TABLE messages (
//     id SERIAL PRIMARY KEY,
//     sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//     content TEXT NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
