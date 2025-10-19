import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app import models, database

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[database.get_db] = override_get_db

client = TestClient(app)

# --------------------
# TESTS BEGIN HERE
# --------------------

def test_start_session():
    response = client.post("/study/start?user_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "sid" in data
    assert "start_time" in data


def test_stop_session():
    start_response = client.post("/study/start?user_id=1")
    sid = start_response.json()["sid"]

    stop_response = client.post(f"/study/stop/{sid}")
    assert stop_response.status_code == 200
    data = stop_response.json()
    assert "total_minutes" in data
    assert "badge" in data


def test_get_calendar_empty():
    response = client.get("/study/calendar/1/2025/10")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_get_daily_progress_empty():
    response = client.get("/study/progress/1/2025/10/19")
    assert response.status_code == 200
    data = response.json()
    assert "date" in data
    assert "total_minutes" in data
    assert "badge_level" in data
