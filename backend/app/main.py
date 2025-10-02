from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from . import models
from .database import engine
from .routers import users, auth, posts

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",      
    "http://127.0.0.1:5173",      
    "https://your-frontend.com"  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   
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
app.include_router(posts.router)

@app.get("/")
def root():
    return {"msg": "Welcome to Hubersity"}