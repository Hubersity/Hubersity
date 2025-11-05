# tests/test_auth.py
import pytest

def test_login_success(client, test_user):
    login_data = {
        "username": test_user["user_data"]["email"],
        "password": test_user["user_data"]["password"]
    }
    res = client.post("/login/", data=login_data)
    
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client, test_user):
    login_data = {
        "username": test_user["user_data"]["email"],
        "password": "wrongpassword"
    }
    res = client.post("/login/", data=login_data)
    
    assert res.status_code == 403
    assert res.json()["detail"] == "Invalid credentials"


def test_login_nonexistent_user(client):
    login_data = {
        "username": "nonexistent@user.com",
        "password": "ValidPass123!"
    }
    res = client.post("/login/", data=login_data)
    
    assert res.status_code == 403
    assert res.json()["detail"] == "Invalid credentials"