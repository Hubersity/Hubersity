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
    cre = client.post(f"/posts/{pid}/comments", json=comment, headers=headers)
    assert cre.status_code == 200
    assert cre.json()["content"] == "Nice post"

    # like the post
    lk = client.post(f"/posts/{pid}/like", headers=headers)
    assert lk.status_code == 200

    # unlike (calling like again will remove)
    lk2 = client.post(f"/posts/{pid}/like", headers=headers)
    assert lk2.status_code == 200
