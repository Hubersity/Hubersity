# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app as fastapi_app
from app.database import Base, get_db
import app.database
from app import models

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
    
    monkeypatch.setattr(app.database, 'engine', engine)
    monkeypatch.setattr(app.database, 'SessionLocal', TestingSessionLocal)
    
    fastapi_app.dependency_overrides[get_db] = override_get_db

    Base.metadata.create_all(bind=engine)
    
    with TestClient(fastapi_app) as test_client:
        yield test_client
    
    Base.metadata.drop_all(bind=engine)
    
    fastapi_app.dependency_overrides.pop(get_db, None)