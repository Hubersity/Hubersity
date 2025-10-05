from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from . import models
from .database import engine
from .routers import users, auth, study_calendar, posts

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# ✅ อนุญาตทุก origin (เฉพาะตอนพัฒนา)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection OK")
except Exception as e:
    print("Database connection failed:", e)

# routes
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(study_calendar.router)
app.include_router(posts.router)

@app.get("/")
def root():
    return {"msg": "Welcome to Hubersity"}