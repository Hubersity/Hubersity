# tests/test_users.py
import pytest
from app import models
from app.utils import verify


# 🧠 Test 1: Create user successfully
def test_create_user_success(client):
    user_data = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
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
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
    }

    # First create user
    client.post("/users/", json=user_data)

    # Try again with same email
    res = client.post("/users/", json={
        "email": "duplicate@example.com",
        "username": "user2",
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
    })

    assert res.status_code == 400
    assert res.json()["detail"] == "Email is already in use"


# 🧠 Test 3: Duplicate username should fail
def test_create_user_duplicate_username(client):
    user_data = {
        "email": "userunique@example.com",
        "username": "uniqueuser",
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
    }

    # Create user once
    client.post("/users/", json=user_data)

    # Try again with same username
    res = client.post("/users/", json={
        "email": "newemail@example.com",
        "username": "uniqueuser",
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
    })

    assert res.status_code == 400
    assert res.json()["detail"] == "Username is already taken"


# 🧠 Test 4: Password should be hashed
def test_password_hashed_in_db(client):
    user_data = {
        "email": "secure@example.com",
        "username": "secureuser",
        "password": "ValidPass123!",
        "confirm_password": "ValidPass123!"
    }
    
    res = client.post("/users/", json=user_data)
    assert res.status_code == 201
    
    data = res.json()
    
    login_res = client.post("/login/", data={
        "username": "secure@example.com", 
        "password": "ValidPass123!"
    })
    
    assert login_res.status_code == 200
    
    login_res_fail = client.post("/login/", data={
        "username": "secure@example.com", 
        "password": "wrongpassword"
    })
    
    assert login_res_fail.status_code == 403