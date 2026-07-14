# Messaging Application

A full-stack real-time messaging application built using TypeScript, Node.js, Express, Prisma, PostgreSQL, Socket.IO, and React.
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
* Prisma ORM and versioned migrations
* JWT cookie authentication

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

Copy `backend/.env.example` to `backend/.env` and replace every placeholder.

Example configuration:

```
PORT=5001
CLIENT_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://postgres:password@localhost:5432/messaging_app2?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:password@localhost:5432/messaging_app2_shadow?schema=public

CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=

JWT_SECRET=replace-with-a-long-random-secret

NODE_ENV=development
```

---

### 4. Database Setup

Ensure PostgreSQL is installed and create development and shadow databases:

```
CREATE DATABASE messaging_app2;
CREATE DATABASE messaging_app2_shadow;
```

For a new empty database, apply the checked-in schema:

```
cd backend
npm run prisma:migrate:deploy
```

For an existing database, do not apply the baseline immediately. Back it up, clone it, run `npm run prisma:pull:print --prefix backend` without overwriting the checked-in schema, compare the introspection output with `prisma/schema.prisma`, reconcile differences, and only then mark the baseline as applied:

```
npx prisma migrate resolve --applied 00000000000000_baseline
```

Follow the complete [PostgreSQL migration runbook](docs/database-migration.md) for non-destructive introspection, drift detection, clone validation, and the production release gate.

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

`backend/prisma/schema.prisma` is the application schema source of truth. Migration SQL is versioned in `backend/prisma/migrations`. The core models are `User`, `ProfilePic`, `Contact`, and `Message`; Prisma field mappings preserve the existing snake_case PostgreSQL names.

---

## Production

Production requires Node.js 20.19 or newer; Node.js 22 LTS is recommended. To build and start the application:

```
npm run build
npm start
```

This will install dependencies, build the frontend, and serve it from the backend.

---

## Screenshots

You can include interface screenshots here.

Login Page
<img width="1440" height="822" alt="Screenshot 2026-02-25 at 1 13 56 AM" src="https://github.com/user-attachments/assets/81c83aaa-8151-49be-962f-2808894d9198" />

Sign up page
<img width="1440" height="822" alt="Screenshot 2026-02-25 at 1 14 03 AM" src="https://github.com/user-attachments/assets/ca41b0e0-d6b3-4362-adf8-7133567c0835" />

Chat Interface
<img width="1440" height="822" alt="Screenshot 2026-02-25 at 1 15 34 AM" src="https://github.com/user-attachments/assets/b8d95360-73f0-4e26-8509-d9a6d2e2837c" />



Profile page
<img width="1440" height="822" alt="Screenshot 2026-02-25 at 1 18 46 AM" src="https://github.com/user-attachments/assets/764fc8f4-a4a9-4a4e-a084-083009dc697d" />

Search page
<img width="1440" height="822" alt="Screenshot 2026-02-25 at 1 18 53 AM" src="https://github.com/user-attachments/assets/710b7f0e-e9f8-462f-bc46-0fa0f2e8f696" />






---
