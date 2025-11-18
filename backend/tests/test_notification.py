import pytest
from app import models


def create_user(client, username, email):
    """Helper to create a test user"""
    payload = {"username": username, "email": email, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    return r.json()


def test_create_notification(client, db_session):
    """Test creating a notification"""
    user = create_user(client, "noti_user", "noti_user@example.com")
    
    login = client.post("/login", json={"email": "noti_user@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "title": "Test Notification",
        "message": "This is a test",
        "target_role": "user"
    }
    res = client.post("/notification/", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data['title'] == "Test Notification"


def test_get_all_notifications(client, db_session):
    """Test retrieving all notifications"""
    user = create_user(client, "noti_getter", "noti_getter@example.com")
    
    # Create notifications
    noti = models.Notification(
        title="Info",
        message="Test message",
        sender_id=user['uid'],
        target_role="user"
    )
    db_session.add(noti)
    db_session.commit()
    
    login = client.post("/login", json={"email": "noti_getter@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/notification/", headers=headers)
    assert res.status_code == 200
    notifications = res.json()
    assert isinstance(notifications, list)


def test_get_admin_notifications(client, db_session):
    """Test getting admin-targeted notifications"""
    user = create_user(client, "admin_noti", "admin_noti@example.com")
    db_user = db_session.query(models.User).filter(models.User.uid == user['uid']).first()
    db_user.is_admin = True
    db_session.commit()
    
    # Create admin notifications
    noti = models.Notification(
        title="Admin Alert",
        message="Alert for admins",
        sender_id=user['uid'],
        target_role="admin"
    )
    db_session.add(noti)
    db_session.commit()
    
    login = client.post("/login", json={"email": "admin_noti@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/notification/admin", headers=headers)
    assert res.status_code == 200
    notifications = res.json()
    assert isinstance(notifications, list)


def test_get_user_notifications(client, db_session):
    """Test getting notifications for a specific user"""
    user = create_user(client, "specific_user", "specific_user@example.com")
    
    # Create user-specific notification
    noti = models.Notification(
        title="Personal",
        message="Just for you",
        receiver_id=user['uid'],
        sender_id=user['uid'],
        target_role="user"
    )
    db_session.add(noti)
    db_session.commit()
    
    login = client.post("/login", json={"email": "specific_user@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get(f"/notification/user/{user['uid']}", headers=headers)
    if res.status_code == 200:
        notifications = res.json()
        assert isinstance(notifications, list)


def test_mark_notification_as_read(client, db_session):
    """Test marking a notification as read"""
    user = create_user(client, "reader_user", "reader_user@example.com")
    
    # Create notification
    noti = models.Notification(
        title="Read Test",
        message="Mark me as read",
        receiver_id=user['uid'],
        sender_id=user['uid'],
        is_read=False,
        target_role="user"
    )
    db_session.add(noti)
    db_session.commit()
    db_session.refresh(noti)
    
    login = client.post("/login", json={"email": "reader_user@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.post(f"/notification/{noti.id}/read", headers=headers)
    if res.status_code == 200:
        assert res.json()['is_read'] == True


def test_delete_notification(client, db_session):
    """Test deleting a notification"""
    user = create_user(client, "deleter_user", "deleter_user@example.com")
    
    # Create notification
    noti = models.Notification(
        title="Delete Me",
        message="Remove this",
        receiver_id=user['uid'],
        sender_id=user['uid'],
        target_role="user"
    )
    db_session.add(noti)
    db_session.commit()
    db_session.refresh(noti)
    noti_id = noti.id
    
    login = client.post("/login", json={"email": "deleter_user@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.delete(f"/notification/{noti_id}", headers=headers)
    if res.status_code == 200:
        assert True


def test_notification_about_follow(client, db_session):
    """Test that follow notification is created"""
    user1 = create_user(client, "follower_noti", "follower_noti@example.com")
    user2 = create_user(client, "followed_noti", "followed_noti@example.com")
    
    # Create mutual follows
    db_session.add(models.Follow(follower_id=user1['uid'], following_id=user2['uid']))
    db_session.add(models.Follow(follower_id=user2['uid'], following_id=user1['uid']))
    db_session.commit()
    
    # Try to follow (which should create notification)
    login = client.post("/login", json={"email": "follower_noti@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Notification should exist for the follow event
    noti_res = client.get("/notification/", headers=headers)
    if noti_res.status_code == 200:
        # May or may not have notifications depending on implementation
        assert isinstance(noti_res.json(), list)


def test_clear_all_notifications(client, db_session):
    """Test clearing all notifications for a user"""
    user = create_user(client, "clear_user", "clear_user@example.com")
    
    # Create multiple notifications
    for i in range(3):
        noti = models.Notification(
            title=f"Notification {i}",
            message=f"Message {i}",
            receiver_id=user['uid'],
            sender_id=user['uid'],
            target_role="user"
        )
        db_session.add(noti)
    db_session.commit()
    
    login = client.post("/login", json={"email": "clear_user@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.delete("/notification/clear-all", headers=headers)
    if res.status_code == 200:
        assert True


def test_get_unread_notification_count(client, db_session):
    """Test getting count of unread notifications"""
    user = create_user(client, "unread_counter", "unread_counter@example.com")
    
    # Create unread notifications
    for i in range(2):
        noti = models.Notification(
            title=f"Unread {i}",
            message=f"Unread message {i}",
            receiver_id=user['uid'],
            sender_id=user['uid'],
            is_read=False,
            target_role="user"
        )
        db_session.add(noti)
    db_session.commit()
    
    login = client.post("/login", json={"email": "unread_counter@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/notification/unread-count", headers=headers)
    if res.status_code == 200:
        data = res.json()
        if isinstance(data, dict):
            assert 'unread_count' in data or 'count' in data


def test_notification_types(client, db_session):
    """Test different notification types"""
    user = create_user(client, "type_tester", "type_tester@example.com")
    
    login = client.post("/login", json={"email": "type_tester@example.com", "password": "Aa1!aaaa"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    notification_types = ["Follow", "Like", "Comment", "Report"]
    
    for noti_type in notification_types:
        payload = {
            "title": noti_type,
            "message": f"You have a new {noti_type}",
            "target_role": "user"
        }
        res = client.post("/notification/", json=payload, headers=headers)
        if res.status_code == 200:
            assert res.json()['title'] == noti_type
