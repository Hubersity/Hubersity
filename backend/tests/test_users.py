# tests/test_users.py
import pytest

VALID_PASSWORD = "ValidPass123!"

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
    assert res.status_code == 201
    
    login_res = client.post("/login/", data={
        "username": "test@example.com", 
        "password": VALID_PASSWORD
    })
    token = login_res.json()["access_token"]
    
    return {"user": user_data, "token": f"Bearer {token}"}


def test_create_user_success(client):
    res = client.post("/users/", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "newuser@example.com"


def test_create_user_duplicate_email(client, test_user):
    res = client.post("/users/", json={
        "email": "test@example.com",
        "username": "user2",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    })
    assert res.status_code == 400
    assert res.json()["detail"] == "Email is already in use"


def test_create_user_duplicate_username(client, test_user):
    res = client.post("/users/", json={
        "email": "newemail@example.com",
        "username": "testuser",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    })
    assert res.status_code == 400
    assert res.json()["detail"] == "Username is already taken"


def test_password_hashed_in_db(client, test_user):
    assert test_user["token"] is not None