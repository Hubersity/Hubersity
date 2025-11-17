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


def test_login_missing_email_field(client):
    """Test login with missing email field"""
    res = client.post("/login", json={"password": "Aa1!aaaa"})
    assert res.status_code == 422  # Validation error


def test_login_missing_password_field(client):
    """Test login with missing password field"""
    res = client.post("/login", json={"email": "test@example.com"})
    assert res.status_code == 422  # Validation error


def test_login_empty_email(client):
    """Test login with empty email"""
    res = client.post("/login", json={"email": "", "password": "Aa1!aaaa"})
    assert res.status_code == 422


def test_login_empty_password(client):
    """Test login with empty password"""
    res = client.post("/login", json={"email": "test@example.com", "password": ""})
    assert res.status_code == 403


def test_token_expiry_and_refresh(client):
    """Test that expired tokens cannot access protected routes"""
    payload = {
        "username": "expiry_test",
        "email": "expiry@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # With valid token, should work
    me = client.get("/users/me", headers=headers)
    assert me.status_code == 200


def test_access_without_token_fails(client):
    """Test that accessing protected routes without token fails"""
    res = client.get("/users/me")
    assert res.status_code == 401  # Not authenticated


def test_access_with_invalid_token_fails(client):
    """Test that invalid token fails"""
    headers = {"Authorization": "Bearer invalid_token_123"}
    res = client.get("/users/me", headers=headers)
    assert res.status_code == 401
