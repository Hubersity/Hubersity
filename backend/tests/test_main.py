from fastapi.testclient import TestClient

def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"msg": "Welcome to Hubersity"}
