import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import MagicMock, patch

client = TestClient(app)

def test_login_success(monkeypatch):
    mock_user = MagicMock()
    mock_user.email = "test@example.com"
    mock_user.password = "hashed_password"
    mock_user.uid = 1

    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = mock_user

    monkeypatch.setattr("app.main.get_db", lambda: mock_db)
    monkeypatch.setattr("app.main.utils.verify", lambda plain, hashed: True)
    monkeypatch.setattr("app.main.oauth2.create_access_token", lambda data: "fake_token")

    response = client.post("/login", json={"email": "test@example.com", "password": "1234"})
    assert response.status_code == 200
    assert response.json() == {"access_token": "fake_token", "token_type": "bearer"}

def test_login_user_not_found(monkeypatch):
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = None

    monkeypatch.setattr("app.main.get_db", lambda: mock_db)

    response = client.post("/login", json={"email": "notfound@example.com", "password": "1234"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid Credentials"

def test_login_wrong_password(monkeypatch):
    mock_user = MagicMock()
    mock_user.email = "test@example.com"
    mock_user.password = "hashed_password"

    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = mock_user

    monkeypatch.setattr("app.main.get_db", lambda: mock_db)
    monkeypatch.setattr("app.main.utils.verify", lambda plain, hashed: False)

    response = client.post("/login", json={"email": "test@example.com", "password": "wrongpass"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid Credentials"