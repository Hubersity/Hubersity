# tests/test_users.py
import pytest
from app import models
from app.utils import verify


# 🧠 Test 1: Create user successfully
def test_create_user_success(client):
    user_data = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "123456",
        "confirm_password": "123456"
    }

    res = client.post("/users/", json=user_data)

    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "testuser@example.com"
    assert data["username"] == "testuser"
    assert "uid" in data


# 🧠 Test 2: Duplicate email should fail
def test_create_user_duplicate_email(client):
    user_data = {
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "123456",
        "confirm_password": "123456"
    }

    # First create user
    client.post("/users/", json=user_data)

    # Try again with same email
    res = client.post("/users/", json={
        "email": "duplicate@example.com",
        "username": "user2",
        "password": "123456",
        "confirm_password": "123456"
    })

    assert res.status_code == 400
    assert res.json()["detail"] == "Email is already in use"


# 🧠 Test 3: Duplicate username should fail
def test_create_user_duplicate_username(client):
    user_data = {
        "email": "userunique@example.com",
        "username": "uniqueuser",
        "password": "123456",
        "confirm_password": "123456"
    }

    # Create user once
    client.post("/users/", json=user_data)

    # Try again with same username
    res = client.post("/users/", json={
        "email": "newemail@example.com",
        "username": "uniqueuser",
        "password": "123456",
        "confirm_password": "123456"
    })

    assert res.status_code == 400
    assert res.json()["detail"] == "Username is already taken"


# 🧠 Test 4: Password should be hashed
def test_password_hashed_in_db(client):
    user_data = {
        "email": "secure@example.com",
        "username": "secureuser",
        "password": "mypassword",
        "confirm_password": "mypassword"
    }

    res = client.post("/users/", json=user_data)
    assert res.status_code == 201

    # Check DB content manually
    from app.database import get_db
    db = next(get_db())
    user = db.query(models.User).filter(models.User.email == "secure@example.com").first()

    assert user is not None
    assert user.password != "mypassword"  # ensure hashing worked
    assert verify("mypassword", user.password)
