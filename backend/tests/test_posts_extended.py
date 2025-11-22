"""Extended tests for post endpoints covering more edge cases"""
import pytest
from app import models


def test_update_post_success(client, db_session):
    """Test updating a post"""
    # Create forum and user
    forum = models.Forum(fid=200, forum_name="Update Test Forum")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "postupdate",
        "email": "postupdate@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Original content", "forum_id": "200"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    assert post_res.status_code == 200
    post = post_res.json()
    post_id = post["pid"]

    # Update post
    update_data = {"post_content": "Updated content"}
    update_res = client.put(f"/posts/{post_id}", json=update_data, headers=headers)
    if update_res.status_code not in [200, 201, 204]:
        # Try with form data if JSON doesn't work
        update_res = client.put(f"/posts/{post_id}", data=update_data, headers=headers)
    assert update_res.status_code in [200, 201, 204]
    if update_res.status_code in [200, 201]:
        assert update_res.json()["post_content"] == "Updated content"


def test_update_post_not_owner(client, db_session):
    """Test that non-owners cannot update posts"""
    # Create forum
    forum = models.Forum(fid=201, forum_name="Update Auth Test")
    db_session.add(forum)
    db_session.commit()

    # Create two users
    user1_payload = {
        "username": "postowner",
        "email": "postowner@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r1 = client.post("/users/", json=user1_payload)
    user1 = r1.json()

    user2_payload = {
        "username": "notowner",
        "email": "notowner@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r2 = client.post("/users/", json=user2_payload)
    user2 = r2.json()

    # Login as user1
    login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Create post
    post_data = {"post_content": "Owner's post", "forum_id": "201"}
    post_res = client.post("/posts/", data=post_data, headers=headers1)
    post = post_res.json()
    post_id = post["pid"]

    # Try to update as user2
    login2 = client.post("/login", json={"email": user2_payload["email"], "password": "Aa1!aaaa"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    update_data = {"post_content": "Hacked content"}
    update_res = client.put(f"/posts/{post_id}", json=update_data, headers=headers2)
    if update_res.status_code not in [403, 401, 422]:
        # Try with form data if JSON doesn't work
        update_res = client.put(f"/posts/{post_id}", data=update_data, headers=headers2)
    assert update_res.status_code in [403, 401, 422]


def test_get_post_detail(client, db_session):
    """Test getting a single post detail"""
    # Create forum and user
    forum = models.Forum(fid=202, forum_name="Detail Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "postdetail",
        "email": "postdetail@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Test post detail", "forum_id": "202"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    post = post_res.json()
    post_id = post["pid"]

    # Get post detail
    detail_res = client.get(f"/posts/{post_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["post_content"] == "Test post detail"


def test_get_user_posts(client, db_session):
    """Test getting user's own posts"""
    # Create forum and user
    forum = models.Forum(fid=203, forum_name="User Posts Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "userposts",
        "email": "userposts@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create posts
    for i in range(3):
        post_data = {"post_content": f"Post {i}", "forum_id": "203"}
        client.post("/posts/", data=post_data, headers=headers)

    # Get user's posts
    res = client.get("/posts/me", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 3


def test_get_forum_posts(client, db_session):
    """Test getting posts from a specific forum"""
    # Create forum
    forum = models.Forum(fid=204, forum_name="Forum Posts Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "forumposts",
        "email": "forumposts@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create posts in forum
    for i in range(2):
        post_data = {"post_content": f"Forum post {i}", "forum_id": "204"}
        client.post("/posts/", data=post_data, headers=headers)

    # Get forum posts
    res = client.get("/posts/forum/204", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_get_following_feed(client, db_session):
    """Test getting feed from followed users"""
    # Create forum
    forum = models.Forum(fid=205, forum_name="Following Feed Test")
    db_session.add(forum)
    db_session.commit()

    # Create two users
    user1_payload = {
        "username": "follower",
        "email": "follower@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r1 = client.post("/users/", json=user1_payload)
    user1 = r1.json()

    user2_payload = {
        "username": "followee",
        "email": "followee@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r2 = client.post("/users/", json=user2_payload)
    user2 = r2.json()

    # User2 creates a post
    login2 = client.post("/login", json={"email": user2_payload["email"], "password": "Aa1!aaaa"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    post_data = {"post_content": "Followed post", "forum_id": "205"}
    client.post("/posts/", data=post_data, headers=headers2)

    # User1 follows user2
    login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    follow_res = client.post(f"/users/{user2['uid']}/follow", headers=headers1)
    assert follow_res.status_code in [200, 201]

    # Get following feed
    feed_res = client.get("/posts/following", headers=headers1)
    assert feed_res.status_code == 200


def test_comment_delete_by_owner(client, db_session):
    """Test deleting a comment by owner"""
    # Create forum and user
    forum = models.Forum(fid=206, forum_name="Comment Delete Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "commenter",
        "email": "commenter@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Comment test post", "forum_id": "206"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    post = post_res.json()
    post_id = post["pid"]

    # Add comment
    comment_data = {"content": "Test comment"}
    comment_res = client.post(f"/posts/{post_id}/comments", data=comment_data, headers=headers)
    assert comment_res.status_code == 200
    comment = comment_res.json()
    comment_id = comment["cid"]

    # Delete comment
    delete_res = client.delete(f"/posts/comments/{comment_id}", headers=headers)
    assert delete_res.status_code in [200, 204]


def test_get_post_comments(client, db_session):
    """Test getting all comments on a post"""
    # Create forum and user
    forum = models.Forum(fid=207, forum_name="Comments Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "commentstest",
        "email": "commentstest@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Comments post", "forum_id": "207"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    post = post_res.json()
    post_id = post["pid"]

    # Add multiple comments
    for i in range(3):
        comment_data = {"content": f"Comment {i}"}
        client.post(f"/posts/{post_id}/comments", data=comment_data, headers=headers)

    # Get comments
    comments_res = client.get(f"/posts/{post_id}/comments", headers=headers)
    assert comments_res.status_code == 200
    assert len(comments_res.json()) == 3


def test_report_post(client, db_session):
    """Test reporting a post"""
    # Create forum and user
    forum = models.Forum(fid=208, forum_name="Report Post Test")
    db_session.add(forum)
    db_session.commit()

    user1_payload = {
        "username": "posteruser",
        "email": "posteruser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r1 = client.post("/users/", json=user1_payload)
    user1 = r1.json()

    user2_payload = {
        "username": "reporteruser",
        "email": "reporteruser@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r2 = client.post("/users/", json=user2_payload)
    user2 = r2.json()

    # User1 creates post
    login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    post_data = {"post_content": "Bad post", "forum_id": "208"}
    post_res = client.post("/posts/", data=post_data, headers=headers1)
    post = post_res.json()
    post_id = post["pid"]

    # User2 reports post
    login2 = client.post("/login", json={"email": user2_payload["email"], "password": "Aa1!aaaa"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    report_data = {"reason": "Inappropriate content"}
    report_res = client.post(f"/posts/{post_id}/report", json=report_data, headers=headers2)
    assert report_res.status_code in [200, 201]


def test_report_comment(client, db_session):
    """Test reporting a comment"""
    # Create forum and user
    forum = models.Forum(fid=209, forum_name="Report Comment Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "reportcomment",
        "email": "reportcomment@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Post for comments", "forum_id": "209"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    post = post_res.json()
    post_id = post["pid"]

    # Add comment
    comment_data = {"content": "Bad comment"}
    comment_res = client.post(f"/posts/{post_id}/comments", data=comment_data, headers=headers)
    comment = comment_res.json()
    comment_id = comment["cid"]

    # Report comment
    report_data = {"reason": "Offensive"}
    report_res = client.post(f"/posts/comments/{comment_id}/report", json=report_data, headers=headers)
    assert report_res.status_code in [200, 201]


def test_like_unlike_toggle(client, db_session):
    """Test liking and unliking a post"""
    # Create forum and user
    forum = models.Forum(fid=210, forum_name="Like Test")
    db_session.add(forum)
    db_session.commit()

    user_payload = {
        "username": "liker",
        "email": "liker@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=user_payload)
    user = r.json()

    # Login
    login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_data = {"post_content": "Like this", "forum_id": "210"}
    post_res = client.post("/posts/", data=post_data, headers=headers)
    post = post_res.json()
    post_id = post["pid"]

    # Like post
    like_res = client.post(f"/posts/{post_id}/like", headers=headers)
    assert like_res.status_code == 200

    # Unlike (toggle off)
    unlike_res = client.post(f"/posts/{post_id}/like", headers=headers)
    assert unlike_res.status_code == 200

    # Like again
    like_res2 = client.post(f"/posts/{post_id}/like", headers=headers)
    assert like_res2.status_code == 200
