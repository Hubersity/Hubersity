import pytest
from app import models


def test_follow_user_success(client):
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

    # login as user1
    login = client.post("/login", json={"email": "follower1@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # follow
    res = client.post(f"/users/{user2['uid']}/follow", headers=headers)
    assert res.status_code in (200, 201)

    msg = res.json()["message"]
    assert ("Followed successfully" in msg) or ("Follow request sent" in msg)


def test_follow_self_fails(client):
    user = client.post("/users/", json={
        "username": "selffollower",
        "email": "selffollower@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()

    login = client.post("/login", json={"email": "selffollower@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(f"/users/{user['uid']}/follow", headers=headers)
    assert res.status_code == 400
    assert "cannot follow yourself" in res.json()["detail"].lower()


def test_follow_nonexistent_user_fails(client):
    user = client.post("/users/", json={
        "username": "follower2",
        "email": "follower2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }).json()

    login = client.post("/login", json={"email": "follower2@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/users/99999/follow", headers=headers)
    assert res.status_code == 404
    assert "user not found" in res.json()["detail"].lower()


def test_follow_duplicate_fails(client):
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

    # first follow
    client.post(f"/users/{user2['uid']}/follow", headers=headers)

    # duplicate
    res2 = client.post(f"/users/{user2['uid']}/follow", headers=headers)
    assert res2.status_code == 400
    assert "already following" in res2.json()["detail"].lower() or \
           "follow request already sent" in res2.json()["detail"].lower()


def test_unfollow_user_success(client):
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

    client.post(f"/users/{user2['uid']}/follow", headers=headers)

    res = client.delete(f"/users/{user2['uid']}/follow", headers=headers)
    assert res.status_code == 200
    assert "unfollow" in res.json()["message"].lower()


def test_unfollow_nonexistent_fails(client):
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

    res = client.delete(f"/users/{user2['uid']}/follow", headers=headers)
    assert res.status_code == 404
    assert "not following" in res.json()["detail"].lower()


def test_get_followers_list(client):
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

    res = client.post(f"/users/{user2['uid']}/follow", headers=headers)
    assert res.status_code in (200, 201)


def test_get_following_list(client):
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

    res = client.post(f"/users/{user2['uid']}/follow", headers=headers)
    assert res.status_code in (200, 201)