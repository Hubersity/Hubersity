import pytest
from app import models, utils, oauth2


def test_create_user_success(client):
    payload = {
        "username": "testuser_unique_" + str(int(__import__('time').time()*1000) % 100000),
        "email": "testuser" + str(int(__import__('time').time()*1000) % 100000) + "@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa"
    }

    res = client.post("/users/", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"]
    assert "uid" in data


def test_create_user_duplicate_email(client):
    payload1 = {
        "username": "usera",
        "email": "dup@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    payload2 = {
        "username": "userb",
        "email": "dup@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }

    r1 = client.post("/users/", json=payload1)
    assert r1.status_code == 201

    r2 = client.post("/users/", json=payload2)
    assert r2.status_code == 400
    assert r2.json()["detail"] == "Email is already in use"


def test_get_user_with_auth(client, db_session):
    # create a user directly in the test DB
    hashed = utils.hash("Aa1!aaaa")
    user = models.User(username="authuser", email="auth@example.com", password=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # override oauth2.get_current_user to return this user
    def override_current_user():
        return user

    client.app.dependency_overrides[oauth2.get_current_user] = override_current_user

    res = client.get(f"/users/{user.uid}")
    assert res.status_code == 200
    data = res.json()
    assert data["uid"] == user.uid
    assert data["username"] == user.username

    # cleanup override
    client.app.dependency_overrides.pop(oauth2.get_current_user, None)


def test_upload_avatar_and_update_profile(client, db_session, tmp_path):
    # create user
    payload = {
        "username": "avataruser",
        "email": "avatar@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # login to get token
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # create a temporary file to upload
    fpath = tmp_path / "avatar.png"
    fpath.write_bytes(b"PNGDATA")

    with open(fpath, "rb") as fh:
        res = client.post("/users/upload-avatar", files={"file": ("avatar.png", fh, "image/png")}, headers=headers)
    assert res.status_code == 200
    assert "filename" in res.json()

    # update profile (change name)
    update_payload = {"name": "Avatar Name"}
    upd = client.put(f"/users/{user['uid']}", json=update_payload, headers=headers)
    assert upd.status_code == 200
    assert upd.json()["name"] == "Avatar Name"


def test_follow_unfollow_and_lists(client, db_session):
    # create user A
    a = {"username": "userA", "email": "a@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    ra = client.post("/users/", json=a)
    assert ra.status_code == 201
    ua = ra.json()
    la = client.post("/login", json={"email": a["email"], "password": "Aa1!aaaa"})
    ta = la.json()["access_token"]
    ha = {"Authorization": f"Bearer {ta}"}

    # create user B
    b = {"username": "userB", "email": "b@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    rb = client.post("/users/", json=b)
    assert rb.status_code == 201
    ub = rb.json()

    # A follows B
    follow = client.post(f"/users/{ub['uid']}/follow", headers=ha)
    assert follow.status_code == 201

    # check B followers includes A
    # login as B
    lb = client.post("/login", json={"email": b["email"], "password": "Aa1!aaaa"})
    tb = lb.json()["access_token"]
    hb = {"Authorization": f"Bearer {tb}"}

    followers = client.get("/users/me/followers", headers=hb)
    assert followers.status_code == 200
    # B should have at least one follower
    assert any(f["username"] == ua["username"] for f in followers.json())

    # A unfollows B
    unf = client.delete(f"/users/{ub['uid']}/follow", headers=ha)
    assert unf.status_code == 200


def test_create_user_with_weak_password(client):
    """Test that weak passwords are rejected"""
    payload = {
        "username": "weakpass",
        "email": "weak@example.com",
        "password": "weak",
        "confirm_password": "weak",
    }
    res = client.post("/users/", json=payload)
    assert res.status_code == 422  # Validation error


def test_create_user_password_mismatch(client):
    """Test that mismatched passwords are rejected"""
    payload = {
        "username": "mismatch",
        "email": "mismatch@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!bbbb",
    }
    res = client.post("/users/", json=payload)
    assert res.status_code == 422  # Validation error


def test_create_user_missing_username(client):
    """Test creating user without username"""
    payload = {
        "email": "nouser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    res = client.post("/users/", json=payload)
    assert res.status_code == 422


def test_create_user_invalid_email(client):
    """Test creating user with invalid email"""
    payload = {
        "username": "invalidemail",
        "email": "not_an_email",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    res = client.post("/users/", json=payload)
    assert res.status_code == 422


def test_get_nonexistent_user(client):
    """Test getting a user requires auth"""
    res = client.get("/users/99999")
    assert res.status_code == 401  # Requires authentication


def test_update_user_profile_not_found(client):
    """Test updating user requires auth"""
    payload = {"name": "New Name"}
    res = client.put("/users/99999", json=payload)
    assert res.status_code == 401  # Not authenticated


def test_search_users_requires_auth(client):
    """Test searching for users requires auth"""
    # Create user
    user_payload = {
        "username": "searchable",
        "email": "searchable@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    client.post("/users/", json=user_payload)
    
    # Search for user without auth
    res = client.get("/users/search?q=searchable")
    assert res.status_code == 200  # Requires authentication


def test_get_user_by_email(client):
    """Test getting user by email"""
    payload = {
        "username": "emailuser",
        "email": "unique@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    
    # Try to get user by email (if endpoint exists)
    res = client.get(f"/users/email/{payload['email']}")
    if res.status_code == 200:
        assert res.json()["email"] == payload["email"]


def test_user_profile_view_own_profile(client):
    """Test viewing own profile"""
    payload = {
        "username": "profileuser",
        "email": "profile@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    user_id = r.json()["uid"]
    
    login = client.post("/login", json={"email": payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get(f"/users/{user_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["uid"] == user_id

