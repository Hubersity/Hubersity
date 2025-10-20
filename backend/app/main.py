from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from . import models, database
from .database import engine
from .routers import users, auth, study_calendar, posts

# สร้างตารางทั้งหมดในฐานข้อมูล
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ให้โหลดไฟล์จากโฟลเดอร์ uploads ได้
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ตรวจสอบการเชื่อมต่อฐานข้อมูล
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection OK ")
except Exception as e:
    print("Database connection failed :", e)

# รวมทุก router
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(study_calendar.router)
app.include_router(posts.router)

# Seed forum data อัตโนมัติเมื่อ start server
@app.on_event("startup")
def seed_forum_data():
    db: Session = next(database.get_db())
    existing = db.query(models.Forum).all()
    if len(existing) == 0:
        forums = [
            models.Forum(fid=1, forum_name="University Talk"),
            models.Forum(fid=2, forum_name="Follow Talk"),
        ]
        db.add_all(forums)
        db.commit()
        print("Forum table seeded with default data.")
    else:
        print("ℹForum table already has data.")

@app.get("/")
def root():
    return {"msg": "Welcome to Hubersity"}