# tests/conftest.py
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app as fastapi_app
from app.database import Base, get_db
import app.database
from app import models

VALID_PASSWORD = "ValidPass123!"

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(monkeypatch):
    """
    Fixture for the test client.
    - Overrides the database engine and session.
    - Overrides the get_db dependency.
    - Creates all tables before each test.
    - Drops all tables after each test.
    """
    
    monkeypatch.setattr(app.database, 'engine', engine)
    monkeypatch.setattr(app.database, 'SessionLocal', TestingSessionLocal)
    
    fastapi_app.dependency_overrides[get_db] = override_get_db

    Base.metadata.create_all(bind=engine)
    
    with TestClient(fastapi_app) as test_client:
        yield test_client
    
    Base.metadata.drop_all(bind=engine)
    
    fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def test_user(client):
    """A fixture to create one user that other tests can use."""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    }
    res = client.post("/users/", json=user_data)
    assert res.status_code == 201, f"Failed to create test_user in fixture. Response: {res.json()}"
    
    login_res = client.post("/login/", data={
        "username": "test@example.com", 
        "password": VALID_PASSWORD
    })
    
    assert login_res.status_code == 200, f"Failed to log in test_user. Response: {login_res.json()}"
    
    token = login_res.json()["access_token"]
    
    return {"user": user_data, "token": f"Bearer {token}"}