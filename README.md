# Hubersity

**Hubersity** is a web-based platform designed to make student life simpler, clearer, and more connected across universities. It provides a centralized space where students can find essential academic information, ask questions, and engage in meaningful discussions with peers from their own and other institutions.

## Purpose

Many students face confusion and repetitive issues due to scattered resources, lack of peer support, and inconsistent communication channels. Hubersity aims to solve this by creating a centralized and intuitive study forum that brings together:

- Shared academic resources
- Course-related Q&A
- Student experiences
- Cross-university collaboration

## Key Features

- University-specific forums and discussion areas
- Login and user authentication system
- University selector and filtering system
- Modern UI with responsive components
- Support for image-based content and resource sharing

## Tech Stack

- **Frontend:** React.js with Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **DevOps:** Docker & Docker Compose

## Running the Server
1. Clone the repository
```
git clone https://github.com/Hubersity/Hubersity.git
```
2. Go into the project directory
```
cd Hubersity
```
3. Setup the .env file 
Follow instructions in the next section ## Environment Setup

3. Build and start the server with Docker Compose
```
docker-compose up -d --build
```

## Environment Setup

This project uses three `.env` files:

- **Root `.env`** → used by Docker Compose (database credentials, shared secrets)
- **Backend `.env`** → FastAPI settings (DB connection, JWT, OAuth)
- **Frontend `.env`** → Vite/React settings (API URL, OAuth client ID)

### 1. Copy example files
Each folder contains an `.env.example`. Copy them:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Example values (dummy values provided for grading)
.env (Root)
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=hubersity
```

backend/.env
```
# Database connection
DB_HOST=db
DB_PORT=5432
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_NAME=${POSTGRES_DB}
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
UPLOAD_ROOT=uploads
API_PORT=8000

# Google OAuth (dummy values for grading)
GOOGLE_CLIENT_ID=723891200198-cmvhl1u69f30t2ch6sisdjo1noc63b93.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_AUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
GOOGLE_TOKEN_URL=https://oauth2.googleapis.com/token
GOOGLE_USERINFO_URL=https://www.googleapis.com/oauth2/v3/userinfo

# JWT / OAuth2 settings
SECRET_KEY=a01bab3de81800ab87a642dfd99209674697704a8eb35e4cd95f78f38f10ee1e
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

frontend/.env
```
# Backend API base URL
VITE_API_URL=http://localhost:8000

# Google OAuth (dummy value for grading)
VITE_GOOGLE_CLIENT_ID=723891200198-cmvhl1u69f30t2ch6sisdjo1noc63b93.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Frontend base URL
VITE_FRONTEND_URL=http://localhost:5173
```

## Services

- Frontend (Home Page):  
  http://localhost:5173

- Frontend (Admin Page):
  http://localhost:5173/app_admin
  
- Backend API Docs (FastAPI Swagger UI):  
  http://localhost:8000/docs

- pgAdmin (Database Management UI):  
  http://localhost:8080
  - Email: admin@admin.com  
  - Password: admin

---

## Stopping the Server
To stop and remove all running containers:
```bash
docker compose down
```

---

## Video Presentation
**Iteration1**
- https://youtu.be/f15uXK-8IpA

**Iteration2**
- https://youtu.be/oUO4O0yiF3g

**Iteration3**
- https://youtu.be/tAIegs1dHJA

**Iteration4**
- https://youtu.be/HN7K8IoAMwo

**Iteration5**
- https://youtu.be/C7fhBJq8zYM


## Planning & Tracking
- **Project Document** – https://docs.google.com/document/d/1shQYve-ymTHfc__mhLfEjZmU7iCq36rVfYSqH0JG084/edit?tab=t.0#heading=h.c508vnuhfzms
- **Jira Board** – https://hubersity.atlassian.net/jira/software/projects/HUB/boards/1/backlog

  
