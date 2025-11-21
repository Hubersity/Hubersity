import pytest
from app import models


def test_follow_user_success(client):
    """Test successfully following a user"""
    user1 = client.post("/users/", json={
        "username": "follower1",
        "email": "follower1@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following1",
        "email": "following1@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower1@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post(f"/follow/{user2['uid']}", headers=headers)
    assert res.status_code == 201
    assert "Followed successfully" in res.json()["message"]


def test_follow_self_fails(client):
    """Test that user cannot follow themselves"""
    user = client.post("/users/", json={
        "username": "selffollower",
        "email": "selffollower@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "selffollower@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post(f"/follow/{user['uid']}", headers=headers)
    assert res.status_code == 400
    assert "cannot follow yourself" in res.json()["detail"]


def test_follow_nonexistent_user_fails(client):
    """Test following a non-existent user"""
    user = client.post("/users/", json={
        "username": "follower2",
        "email": "follower2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower2@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post(f"/follow/99999", headers=headers)
    assert res.status_code == 404
    assert "User not found" in res.json()["detail"]


def test_follow_duplicate_fails(client):
    """Test that following same user twice fails"""
    user1 = client.post("/users/", json={
        "username": "follower3",
        "email": "follower3@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following2",
        "email": "following2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower3@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Follow once
    res1 = client.post(f"/follow/{user2['uid']}", headers=headers)
    assert res1.status_code == 200
    
    # Try to follow again
    res2 = client.post(f"/follow/{user2['uid']}", headers=headers)
    assert res2.status_code == 400
    assert "Already following" in res2.json()["detail"]


def test_unfollow_user_success(client):
    """Test successfully unfollowing a user"""
    user1 = client.post("/users/", json={
        "username": "follower4",
        "email": "follower4@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following3",
        "email": "following3@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower4@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Follow user
    client.post(f"/follow/{user2['uid']}", headers=headers)
    
    # Unfollow
    res = client.delete(f"/follow/{user2['uid']}", headers=headers)
    assert res.status_code == 200
    assert "Unfollowed" in res.json()["message"]


def test_unfollow_nonexistent_fails(client):
    """Test unfollowing user who isn't followed"""
    user1 = client.post("/users/", json={
        "username": "follower5",
        "email": "follower5@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following4",
        "email": "following4@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower5@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to unfollow without following first
    res = client.delete(f"/follow/{user2['uid']}", headers=headers)
    assert res.status_code == 404
    assert "not following" in res.json()["detail"]


def test_get_followers_list(client):
    """Test retrieving list of followers"""
    user1 = client.post("/users/", json={
        "username": "follower6",
        "email": "follower6@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following5",
        "email": "following5@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower6@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Follow user2
    follow_res = client.post(f"/follow/{user2['uid']}", headers=headers)
    assert follow_res.status_code == 201
    
    # Following was successful
def test_get_following_list(client):
    """Test retrieving list of users being followed"""
    user1 = client.post("/users/", json={
        "username": "follower7",
        "email": "follower7@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    user2 = client.post("/users/", json={
        "username": "following6",
        "email": "following6@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()
    
    login = client.post("/login", json={"email": "follower7@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Follow user2
    follow_res = client.post(f"/follow/{user2['uid']}", headers=headers)
    assert follow_res.status_code == 201
    
    # Following was successful
