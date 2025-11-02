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
3. Build and start the server with Docker Compose
```
docker-compose up -d --build
```

## Services

- Frontend (Home Page):  
  http://localhost:5173

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


## Planning & Tracking
- **Project Document** – https://docs.google.com/document/d/1shQYve-ymTHfc__mhLfEjZmU7iCq36rVfYSqH0JG084/edit?tab=t.0#heading=h.c508vnuhfzms
- **Jira Board** – https://hubersity.atlassian.net/jira/software/projects/HUB/boards/1/backlog

  
