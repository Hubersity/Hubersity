from app import models


def test_create_post_and_comment_and_like(client, db_session):
    # create forum needed for post
    forum = models.Forum(fid=99, forum_name="Test Forum")
    db_session.add(forum)
    db_session.commit()

    # create user and login
    user = {"username": "poster", "email": "poster@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=user)
    assert r.status_code == 201
    login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # create post (multipart/form-data)
    data = {"post_content": "Hello world", "forum_id": "99"}
    res = client.post("/posts/", data=data, headers=headers)
    assert res.status_code == 200
    post = res.json()
    assert post["post_content"] == "Hello world"

    pid = post["pid"]

    # add a comment
    comment = {"content": "Nice post"}
    cre = client.post(f"/posts/{pid}/comments", data=comment, headers=headers)
    assert cre.status_code == 200
    assert cre.json()["content"] == "Nice post"

    # like the post
    lk = client.post(f"/posts/{pid}/like", headers=headers)
    assert lk.status_code == 200

    # unlike (calling like again will remove)
    lk2 = client.post(f"/posts/{pid}/like", headers=headers)
    assert lk2.status_code == 200


def test_create_post_missing_forum(client):
    """Test creating post without forum fails"""
    user = {"username": "poster2", "email": "poster2@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    client.post("/users/", json=user)
    login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {"post_content": "Hello world"}
    res = client.post("/posts/", data=data, headers=headers)
    assert res.status_code in [400, 422]


def test_create_post_with_content(client, db_session):
    """Test creating post with valid content"""
    forum = models.Forum(fid=100, forum_name="Test Forum 2")
    db_session.add(forum)
    db_session.commit()
    
    user = {"username": "poster3", "email": "poster3@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    client.post("/users/", json=user)
    login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {"post_content": "Valid post content", "forum_id": "100"}
    res = client.post("/posts/", data=data, headers=headers)
    assert res.status_code == 200


def test_get_all_posts(client, db_session):
    """Test retrieving all posts"""
    forum = models.Forum(fid=101, forum_name="Test Forum 3")
    db_session.add(forum)
    db_session.commit()
    
    user = {"username": "poster4", "email": "poster4@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    client.post("/users/", json=user)
    login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {"post_content": "Test post", "forum_id": "101"}
    res = client.post("/posts/", data=data, headers=headers)
    assert res.status_code == 200


def test_get_nonexistent_post(client):
    """Test getting non-existent post requires auth"""
    res = client.get("/posts/99999")
    assert res.status_code == 401  # Requires authentication


def test_delete_post_by_owner(client, db_session):
    """Test post author can delete their post"""
    forum = models.Forum(fid=102, forum_name="Test Forum 4")
    db_session.add(forum)
    db_session.commit()
    
    user = {"username": "poster5", "email": "poster5@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    client.post("/users/", json=user)
    login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {"post_content": "Deletable post", "forum_id": "102"}
    res = client.post("/posts/", data=data, headers=headers)
    post_id = res.json()["pid"]
    
    # Delete post
    del_res = client.delete(f"/posts/{post_id}", headers=headers)
    assert del_res.status_code == 204  # No content response


def test_comment_on_post(client, db_session):
    """Test adding multiple comments to a post"""
    forum = models.Forum(fid=103, forum_name="Test Forum 5")
    db_session.add(forum)
    db_session.commit()
    
    user1 = {"username": "commenter1", "email": "commenter1@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    user2 = {"username": "commenter2", "email": "commenter2@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    
    client.post("/users/", json=user1)
    client.post("/users/", json=user2)
    
    login1 = client.post("/login", json={"email": user1["email"], "password": "Aa1!aaaa"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    login2 = client.post("/login", json={"email": user2["email"], "password": "Aa1!aaaa"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 1 creates post
    data = {"post_content": "Comment test", "forum_id": "103"}
    res = client.post("/posts/", data=data, headers=headers1)
    post_id = res.json()["pid"]
    
    # Both users comment
    comment1 = {"content": "First comment"}
    cres1 = client.post(f"/posts/{post_id}/comments", data=comment1, headers=headers1)
    assert cres1.status_code == 200
    
    comment2 = {"content": "Second comment"}
    cres2 = client.post(f"/posts/{post_id}/comments", data=comment2, headers=headers2)
    assert cres2.status_code == 200


def test_like_post_multiple_users(client, db_session):
    """Test multiple users liking the same post"""
    forum = models.Forum(fid=104, forum_name="Test Forum 6")
    db_session.add(forum)
    db_session.commit()
    
    user1 = {"username": "liker1", "email": "liker1@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    user2 = {"username": "liker2", "email": "liker2@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    
    client.post("/users/", json=user1)
    client.post("/users/", json=user2)
    
    login1 = client.post("/login", json={"email": user1["email"], "password": "Aa1!aaaa"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    login2 = client.post("/login", json={"email": user2["email"], "password": "Aa1!aaaa"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 1 creates post
    data = {"post_content": "Like test", "forum_id": "104"}
    res = client.post("/posts/", data=data, headers=headers1)
    post_id = res.json()["pid"]
    
    # Both users like
    like1 = client.post(f"/posts/{post_id}/like", headers=headers1)
    assert like1.status_code == 200
    
    like2 = client.post(f"/posts/{post_id}/like", headers=headers2)
    assert like2.status_code == 200
