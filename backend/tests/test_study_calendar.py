from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_calendar():
    response = client.get("/study_calendar/")
    assert response.status_code == 200
