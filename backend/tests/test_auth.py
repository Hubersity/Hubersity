from app import utils


def test_login_and_access_protected_route(client):
    # create user via API
    payload = {
        "username": "auth_test",
        "email": "auth_test@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201

    # login
    login_payload = {"email": payload["email"], "password": "Aa1!aaaa"}
    res = client.post("/login", json=login_payload)
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    token = body["access_token"]

    # access protected route
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/users/me", headers=headers)
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == payload["email"]


def test_login_invalid_credentials(client):
    res = client.post("/login", json={"email": "no@one.com", "password": "badpwd"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Invalid Credentials"
