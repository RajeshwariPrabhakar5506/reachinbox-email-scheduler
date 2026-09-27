# ReachInbox Email Scheduler

A full-stack email scheduling web application built with Next.js, Express.js, TypeScript, PostgreSQL (via Prisma ORM), Redis, and BullMQ. The platform enables users to compose emails with rich text and file attachments, deliver them instantly or schedule them for future execution, and track real-time delivery statuses.

## Architecture Overview

### Graphical Flow (Mermaid)

```
flowchart TD
    subgraph FRONTEND["Frontend (Next.js App Router)"]
        LoginPage["/login Page"] --> DashboardPage["/dashboard Page"]
        DashboardPage --> ComposeModal["Compose Modal"]
    end

    subgraph BACKEND["Backend (Express.js Engine)"]
        AuthCtrl["Auth Controller (JWT + Bcrypt)"]
        EmailCtrl["Email Controller (PostgreSQL CRUD)"]
        Multer["Multer Engine (Memory Buffer)"]
    end

    subgraph INFRA["Data & Queue Infrastructure"]
        PG[(PostgreSQL Database)]
        Redis[(Redis Database)]
        Queue[BullMQ Queue]
    end

    subgraph WORKER["Background Processing & Delivery"]
        Worker[Email Worker]
        Mailer[Nodemailer SMTP]
        Inbox[Recipient Inbox]
    end

    LoginPage -->|Auth Request| AuthCtrl
    DashboardPage -->|Fetch Emails| EmailCtrl
    ComposeModal -->|Schedule & Upload| Multer

    AuthCtrl --> PG
    EmailCtrl --> PG
    Multer --> Queue
    Queue <---> Redis
    Queue --> Worker
    Worker --> Mailer
    Mailer --> Inbox

```

### Text Diagram (ASCII)

```
+-----------------------------------------------------------------------+
|                            FRONTEND                                   |
|                       (Next.js App Router)                            |
|                                                                       |
|   +-----------------+      +-----------------+     +--------------+   |
|   |   /login Page   | ---> | /dashboard Page | --->| ComposeModal |   |
|   +-----------------+      +-----------------+     +--------------+   |
|            |                        |                     |           |
+------------|------------------------|---------------------|-----------+
             | (Auth)                 | (Fetch Data)        | (Schedule + File)
             v                        v                     v
+-----------------------------------------------------------------------+
|                            BACKEND                                    |
|                        (Express.js Engine)                            |
|                                                                       |
|   +-----------------+     +-------------------+    +--------------+   |
|   | Auth Controller |     | Email Controller  |    | Multer Engine|   |
|   | (JWT + Bcrypt)  |     | (Postgres CRUD)   |    | (Memory)     |   |
|   +-----------------+     +-------------------+    +--------------+   |
|            |                        |                     |           |
+------------|------------------------|---------------------|-----------+
             |                        |                     |
             v                        v                     v
  +-------------------+     +-------------------+    +--------------+
  | PostgreSQL DB     |     | Redis DB          |    | BullMQ Queue |
  | (Prisma ORM)      |     | (Job Store)       |    | (email-queue)|
  +-------------------+     +-------------------+    +--------------+
                                                            |
                                                            v
                                                    +--------------+
                                                    | Email Worker |
                                                    | (BullMQ)     |
                                                    +--------------+
                                                            |
                                                            v
                                                    +--------------+
                                                    |  Nodemailer  |
                                                    | (SMTP Server)|
                                                    +--------------+
                                                            |
                                                            v
                                                    +--------------+
                                                    |  Recipient   |
                                                    |    Inbox     |
                                                    +--------------+

```

## Core Features

* **User Authentication**: Secure JWT-based registration and login system with password hashing (`bcryptjs`).

* **Email Scheduling**: Postpone email delivery to any specific time in the future using delay queues backed by Redis and BullMQ.

* **File Attachments**: Upload and attach files to scheduled or instant emails handled via `multer` in-memory buffering.

* **Automatic Recovery**: Startup background checks query PostgreSQL for overdue scheduled emails stuck in `SCHEDULED` state and auto-re-queue them.

* **Dashboard Views**: Separate tabbed navigation for `Scheduled` and `Sent` email logs per user session.

## Tech Stack

* **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS

* **Backend**: Node.js, Express.js, TypeScript

* **Database**: PostgreSQL, Prisma ORM

* **Queue System**: Redis, BullMQ

* **Email Delivery**: Nodemailer (SMTP transport)

* **File Uploads**: Multer

## Project Structure

```
reachinbox-email-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma and Redis client setups
│   │   ├── controllers/     # Auth and Email handlers
│   │   ├── queues/          # BullMQ queue and worker definitions
│   │   ├── routes/          # Express API route declarations
│   │   └── server.ts        # Express server entry point
│   ├── prisma/              # Schema and migration files
│   ├── .env.example         # Template for backend environment variables
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js App Router pages (/login, /dashboard)
│   ├── components/          # Reusable UI components
│   ├── .env.example         # Template for frontend environment variables
│   └── package.json
└── README.md

```

## Environment Variables Configuration

Create a `.env` file in the `backend/` directory and a `.env.local` file in the `frontend/` directory.

### 1. Backend (`backend/.env`)

```
# Server Port
PORT=5000

# PostgreSQL Connection String (Prisma)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/reachinbox_db?schema=public"

# Redis Instance Configuration
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"

# SMTP Server Details (e.g., Gmail App Password or Ethereal)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

```

### 2. Frontend (`frontend/.env.local`)

```
# API Endpoint for Next.js to communicate with Express backend
NEXT_PUBLIC_API_URL="http://127.0.0.1:5000/api"

```

## Prerequisites

Before running the application, ensure you have the following installed and running locally:

1. **Node.js**: `v18.x` or higher

2. **PostgreSQL Service**: Running on port `5432` with a database created (`reachinbox_db`).

3. **Redis Server**: Running on port `6379` (via local install, Docker, or WSL).

## How to Run

### Step 1: Clone the Repository & Configure `.env`

```
git clone https://github.com/RajeshwariPrabhakar5506/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler

```

*Create `backend/.env` and `frontend/.env.local` using the template values above.*

### Step 2: Start the Backend Server

```
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev

```

*The Express API will start on `http://localhost:5000`.*

### Step 3: Start the Frontend Application

Open a new terminal window:

```
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev

```

*The Next.js client will start on `http://localhost:3000`.*

## API Endpoints

| Method | Endpoint | Auth Required | Description | 
| ----- | ----- | ----- | ----- | 
| `POST` | `/api/auth/register` | No | Register a new user | 
| `POST` | `/api/auth/login` | No | Authenticate user and issue JWT | 
| `POST` | `/api/emails/schedule` | Yes (Bearer/Query) | Send or schedule an email (`multipart/form-data`) | 
| `GET` | `/api/emails/scheduled` | Yes | Retrieve user's scheduled email logs | 
| `GET` | `/api/emails/sent` | Yes | Retrieve user's sent email logs | 
