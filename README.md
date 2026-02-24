# Messaging Application

A full-stack real-time messaging application built using Node.js, Express, PostgreSQL, Socket.IO, and React.
The system provides secure authentication, real-time communication, and media sharing.

---

## Overview

This project is designed as a scalable messaging platform that supports user authentication, session management, and real-time chat functionality. The application follows a modular architecture with separate backend and frontend services.

---

## Features

* User authentication and authorization
* Real-time messaging using WebSockets
* Image upload and storage
* PostgreSQL relational database
* RESTful API
* Secure cookies and session handling
* Cross-origin resource sharing (CORS)
* Responsive user interface

---

## Technology Stack

### Backend

* Node.js
* Express
* PostgreSQL
* Socket.IO
* Cloudinary
* Session-based authentication

### Frontend

* React
* Vite
* Tailwind CSS


## Installation and Setup

### 1. Clone the repository

```
git clone <repository-url>
cd messaging_app
```

---

### 2. Install dependencies

#### Backend

```
cd backend
npm install
```

#### Frontend

```
cd ../frontend
npm install
```

---

### 3. Environment Configuration

Create a `.env` file inside the backend directory.

Example configuration:

```
PORT=5001
LOCAL_URL=http://localhost:5173

PG_NAME=your_pg_username
PG_PASSWORD=your_pg_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=your_database_name

CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=

SESSION_SECRET=your_secret_key

NOT_LOCALURL=https://your-production-url/api

NODE_ENV=development
```

---

### 4. Database Setup

Ensure PostgreSQL is installed and running.

Create a new database:

```
CREATE DATABASE your_database_name;
```

---

### 5. Run Backend

```
cd backend
npm run dev
```

The server will run at:

```
http://localhost:5001
```

---

### 6. Run Frontend

Open a new terminal:

```
cd frontend
npm run dev
```

The frontend will run at:

```
http://localhost:5173
```

---

## PostgreSQL Schema

### Users Table

```
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Messages Table

```
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Sessions Table (Optional)

```
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

---

## Production

To build and start the application:

```
npm run build
npm start
```

This will install dependencies, build the frontend, and serve it from the backend.

---

## Screenshots

You can include interface screenshots here.

Login Page
(Add image)

Chat Interface
(Add image)

Mobile View
(Add image)

---

