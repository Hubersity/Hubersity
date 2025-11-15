def test_root_returns_welcome_message(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"msg": "Welcome to Hubersity"}
