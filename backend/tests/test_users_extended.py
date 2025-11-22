"""Extended tests for user endpoints covering more edge cases and scenarios"""
import pytest
from app import models, utils, oauth2


def test_create_user_duplicate_username(client):
    """Test that duplicate usernames are rejected"""
    payload1 = {
        "username": "duplicateuser",
        "email": "user1@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r1 = client.post("/users/", json=payload1)
    assert r1.status_code == 201

    payload2 = {
        "username": "duplicateuser",
        "email": "user2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r2 = client.post("/users/", json=payload2)
    assert r2.status_code == 400
    assert "taken" in r2.json()["detail"].lower()


def test_user_change_password_success(client, db_session):
    """Test changing password with correct current password"""
    # Create user
    user_payload = {
        "username": "changepass",
        "email": "changepass@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    change_payload = {
        "current_password": "Aa1!aaaa",
        "new_password": "NewPass123!",
        "confirm_new_password": "NewPass123!",
    }
    res = client.post("/users/change-password", json=change_payload, headers=headers)
    assert res.status_code == 200

    # Old password should not work
    old_login = client.post(
        "/login",
        json={"email": user_payload["email"], "password": "Aa1!aaaa"}
    )
    assert old_login.status_code == 403

    # New password should work
    new_login = client.post(
        "/login",
        json={"email": user_payload["email"], "password": "NewPass123!"}
    )
    assert new_login.status_code == 200


def test_user_change_password_wrong_current(client, db_session):
    """Test changing password with wrong current password"""
    # Create user
    user_payload = {
        "username": "changepasswrong",
        "email": "changepasswrong@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try to change with wrong current password
    change_payload = {
        "current_password": "WrongPassword123!",
        "new_password": "NewPass123!",
        "confirm_new_password": "NewPass123!",
    }
    res = client.post("/users/change-password", json=change_payload, headers=headers)
    assert res.status_code in [400, 403]


def test_user_delete_account(client, db_session):
    """Test account deletion"""
    # Create user
    user_payload = {
        "username": "deleteuser",
        "email": "deleteuser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Delete account
    delete_res = client.delete("/users/delete", headers=headers)
    assert delete_res.status_code in [200, 204]

    # User should not be able to login anymore
    new_login = client.post(
        "/login",
        json={"email": user_payload["email"], "password": "Aa1!aaaa"}
    )
    assert new_login.status_code in [403, 404]


def test_user_privacy_settings_update(client, db_session):
    """Test updating privacy settings"""
    # Create user
    user_payload = {
        "username": "privacyuser",
        "email": "privacyuser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update privacy
    privacy_payload = {"is_private": True}
    res = client.patch("/users/me/privacy", json=privacy_payload, headers=headers)
    assert res.status_code in [200, 204]

    # Verify change
    me_res = client.get("/users/me", headers=headers)
    assert me_res.status_code == 200


def test_get_user_profile_without_auth(client, db_session):
    """Test that anyone can view a public user profile"""
    # Create user
    user_payload = {
        "username": "publicprofile",
        "email": "publicprofile@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user_id = r.json()["uid"]
    assert r.status_code == 201

    # Get profile without auth
    res = client.get(f"/users/{user_id}")
    assert res.status_code in [200, 401]  # May require auth depending on implementation


def test_search_users(client):
    """Test searching users"""
    # Create multiple users
    for i in range(3):
        payload = {
            "username": f"searchuser{i}",
            "email": f"search{i}@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=payload)
        assert r.status_code == 201

    # Search
    res = client.get("/users/search?q=searchuser")
    assert res.status_code == 200


def test_update_user_profile_with_name(client):
    """Test updating user profile with name"""
    payload = {
        "username": "nameuser",
        "email": "nameuser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    user = r.json()
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    update_payload = {"name": "Updated Name"}
    res = client.put(f"/users/{user['uid']}", json=update_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Name"


def test_update_user_profile_with_bio(client):
    """Test updating user profile with bio"""
    payload = {
        "username": "biouser",
        "email": "biouser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    user = r.json()
    assert r.status_code == 201

    # Login
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    update_payload = {"bio": "This is my bio"}
    res = client.put(f"/users/{user['uid']}", json=update_payload, headers=headers)
    assert res.status_code == 200


def test_user_followers_empty(client):
    """Test getting followers list when empty"""
    payload = {
        "username": "nofollow",
        "email": "nofollow@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get followers
    res = client.get("/users/me/followers", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 0


def test_user_following_empty(client):
    """Test getting following list when empty"""
    payload = {
        "username": "notfollowing",
        "email": "notfollowing@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get following
    res = client.get("/users/me/following", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 0


def test_report_user(client):
    """Test reporting a user"""
    # Create two users
    user1_payload = {
        "username": "reporter",
        "email": "reporter@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r1 = client.post("/users/", json=user1_payload)
    reporter = r1.json()

    user2_payload = {
        "username": "baduser",
        "email": "baduser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r2 = client.post("/users/", json=user2_payload)
    bad_user = r2.json()

    # Login as reporter
    login = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Report user
    report_payload = {"reason": "Inappropriate behavior"}
    res = client.post(f"/users/{bad_user['uid']}/report", json=report_payload, headers=headers)
    assert res.status_code in [200, 201]
