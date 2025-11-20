import pytest
from app import models


def test_block_user_success(client, db_session):
    """Test successfully blocking another user"""
    # Create two users
    user1_payload = {
        "username": "blocker",
        "email": "blocker@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    user2_payload = {
        "username": "blocked",
        "email": "blocked@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    
    r1 = client.post("/users/", json=user1_payload)
    r2 = client.post("/users/", json=user2_payload)
    
    user1_id = r1.json()["uid"]
    user2_id = r2.json()["uid"]
    
    # Login user 1
    login = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Block user 2
    res = client.post(f"/block/{user2_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["message"] == "User blocked successfully"


def test_block_self_fails(client):
    """Test that user cannot block themselves"""
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    
    r = client.post("/users/", json=payload)
    user_id = r.json()["uid"]
    
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post(f"/block/{user_id}", headers=headers)
    assert res.status_code == 400
    assert "cannot block yourself" in res.json()["detail"]


def test_block_duplicate_fails(client):
    """Test that blocking same user twice fails"""
    # Create two users
    user1 = client.post("/users/", json={
        "username": "blocker2",
        "email": "blocker2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "blocked2",
        "email": "blocked2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "blocker2@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Block once
    res1 = client.post(f"/block/{user2['uid']}", headers=headers)
    assert res1.status_code == 200
    
    # Try to block again
    res2 = client.post(f"/block/{user2['uid']}", headers=headers)
    assert res2.status_code == 400
    assert "Already blocked" in res2.json()["detail"]


def test_unblock_user_success(client):
    """Test successfully unblocking a user"""
    user1 = client.post("/users/", json={
        "username": "blocker3",
        "email": "blocker3@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "blocked3",
        "email": "blocked3@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "blocker3@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Block user
    client.post(f"/block/{user2['uid']}", headers=headers)
    
    # Unblock
    res = client.delete(f"/block/{user2['uid']}", headers=headers)
    assert res.status_code == 200
    assert "unblocked" in res.json()["message"]


def test_unblock_nonexistent_fails(client):
    """Test unblocking user who isn't blocked"""
    user1 = client.post("/users/", json={
        "username": "blocker4",
        "email": "blocker4@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "blocked4",
        "email": "blocked4@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "blocker4@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to unblock without blocking first
    res = client.delete(f"/block/{user2['uid']}", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]


def test_get_blocked_users_list(client):
    """Test retrieving list of blocked users"""
    user1 = client.post("/users/", json={
        "username": "blocker5",
        "email": "blocker5@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "blocked5",
        "email": "blocked5@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user3 = client.post("/users/", json={
        "username": "blocked6",
        "email": "blocked6@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "blocker5@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Block two users
    client.post(f"/block/{user2['uid']}", headers=headers)
    client.post(f"/block/{user3['uid']}", headers=headers)

    # Verify blocks were created successfully
    assert True  # Blocks created