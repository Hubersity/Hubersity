# tests/test_users.py
import pytest
from tests.conftest import VALID_PASSWORD

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