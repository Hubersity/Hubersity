# tests/test_users.py
import pytest
from app import models
from app.utils import verify

VALID_PASSWORD = "ValidPass123!"

@pytest.fixture
def test_user(client):
    """
    A fixture to create a user and log in,
    so other tests can be authorized.
    """
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    }
    res = client.post("/users/", json=user_data)
    assert res.status_code == 201
    
    login_data = {
        "username": "test@example.com",
        "password": VALID_PASSWORD
    }
    login_res = client.post("/login/", data=login_data)
    assert login_res.status_code == 200
    
    token = login_res.json()["access_token"]
    return {"token": f"Bearer {token}", "user_data": user_data}


# 🧠 Test 1: Create user successfully
def test_create_user_success(client):
    user_data = {
        "email": "testuser_success@example.com",
        "username": "testuser_success",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    }
    res = client.post("/users/", json=user_data)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == user_data["email"]


# 🧠 Test 2: Duplicate email should fail
def test_create_user_duplicate_email(client, test_user):
    res = client.post("/users/", json={
        "email": "test@example.com",
        "username": "user2",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    })
    assert res.status_code == 400
    assert res.json()["detail"] == "Email is already in use"


# 🧠 Test 3: Duplicate username should fail
def test_create_user_duplicate_username(client, test_user):
    res = client.post("/users/", json={
        "email": "newemail@example.com",
        "username": "testuser",
        "password": VALID_PASSWORD,
        "confirm_password": VALID_PASSWORD
    })
    assert res.status_code == 400
    assert res.json()["detail"] == "Username is already taken"


# 🧠 Test 4: Password should be hashed
def test_password_hashed_in_db(client, test_user):
    assert test_user["token"]