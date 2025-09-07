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
- The server will be available at http://localhost:8000/
- To access pgadmin go to http://localhost:8080/
