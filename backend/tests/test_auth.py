from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login():
    response = client.post("/auth/login", data={"username": "test", "password": "test"})
    assert response.status_code == 200
    assert "access_token" in response.json()
