import io
import os
from app import models


def create_user(client, username, email):
    payload = {"username": username, "email": email, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    return r.json()


def test_open_chat_requires_friends(client):
    a = create_user(client, "chat_a", "chat_a@example.com")
    b = create_user(client, "chat_b", "chat_b@example.com")

    r = client.post(f"/chats/with/{b['uid']}", params={"me_id": a['uid']})
    assert r.status_code == 403


def test_open_chat_with_friends_and_send_message(client, db_session):
    a = create_user(client, "chat_a2", "chat_a2@example.com")
    b = create_user(client, "chat_b2", "chat_b2@example.com")

    # create mutual follows directly
    db_session.add(models.Follow(follower_id=a['uid'], following_id=b['uid']))
    db_session.add(models.Follow(follower_id=b['uid'], following_id=a['uid']))
    db_session.commit()

    # open chat
    r = client.post(f"/chats/with/{b['uid']}", params={"me_id": a['uid']})
    assert r.status_code == 200
    chat_id = r.json()['chat_id']

    # send message
    send = client.post(f"/chats/{chat_id}/messages", params={"me_id": a['uid']}, json={"text": "Hello"})
    assert send.status_code == 200
    body = send.json()
    assert body['text'] == 'Hello'

    # get messages
    get = client.get(f"/chats/{chat_id}/messages", params={"me_id": a['uid']})
    assert get.status_code == 200
    msgs = get.json()
    assert any(m['text'] == 'Hello' for m in msgs)


def test_upload_attachment_saves_file_and_returns_meta(client, db_session):
    a = create_user(client, "chat_uploader", "chat_upload@example.com")
    b = create_user(client, "chat_partner", "chat_partner@example.com")

    # make them mutual friends
    db_session.add(models.Follow(follower_id=a['uid'], following_id=b['uid']))
    db_session.add(models.Follow(follower_id=b['uid'], following_id=a['uid']))
    db_session.commit()

    r = client.post(f"/chats/with/{b['uid']}", params={"me_id": a['uid']})
    chat_id = r.json()['chat_id']

    # small in-memory file
    file_content = b"hello world"
    fp = io.BytesIO(file_content)
    fp.name = "hello.txt"

    files = {"files": (fp.name, fp, "text/plain")}

    up = client.post(f"/chats/{chat_id}/upload", params={"me_id": a['uid']}, files=files)
    assert up.status_code == 200
    data = up.json()
    assert 'attachments' in data and len(data['attachments']) == 1

    # assert file exists in the uploads folder
    saved = data['attachments'][0]['url']  # like /uploads/chat/<id>/filename
    rel = saved.replace('/uploads/', '')
    # the app stores files under /app/uploads/<rel>
    abs_path = os.path.join(os.sep, "app", "uploads", rel)
    assert os.path.exists(abs_path)
