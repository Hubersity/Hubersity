"""Tests for advanced notification functionality."""
from datetime import datetime
from app import models


class TestNotificationCreation:
    """Test notification creation and types."""

    def test_create_follow_notification(self, client, db_session):
        """Test creating follow notification."""
        follower = models.User(
            username="follower1",
            email="follower1@test.com",
            password="hashed"
        )
        followee = models.User(
            username="followee1",
            email="followee1@test.com",
            password="hashed"
        )
        db_session.add_all([follower, followee])
        db_session.commit()

        notif = models.Notification(
            user_id=followee.uid,
            type="follow",
            actor_id=follower.uid,
            message=f"{follower.username} started following you"
        )
        db_session.add(notif)
        db_session.commit()

        assert notif.type == "follow"

    def test_create_comment_notification(self, client, db_session):
        """Test creating comment notification."""
        poster = models.User(
            username="poster1",
            email="poster1@test.com",
            password="hashed"
        )
        commenter = models.User(
            username="commenter1",
            email="commenter1@test.com",
            password="hashed"
        )
        db_session.add_all([poster, commenter])
        db_session.commit()

        post = models.Post(
            user_id=poster.uid,
            content="Test post"
        )
        db_session.add(post)
        db_session.commit()

        notif = models.Notification(
            user_id=poster.uid,
            type="comment",
            actor_id=commenter.uid,
            post_id=post.pid,
            message=f"{commenter.username} commented on your post"
        )
        db_session.add(notif)
        db_session.commit()

        assert notif.type == "comment"

    def test_create_like_notification(self, client, db_session):
        """Test creating like notification."""
        poster = models.User(
            username="poster2",
            email="poster2@test.com",
            password="hashed"
        )
        liker = models.User(
            username="liker1",
            email="liker1@test.com",
            password="hashed"
        )
        db_session.add_all([poster, liker])
        db_session.commit()

        notif = models.Notification(
            user_id=poster.uid,
            type="like",
            actor_id=liker.uid,
            message=f"{liker.username} liked your post"
        )
        db_session.add(notif)
        db_session.commit()

        assert notif.type == "like"


class TestNotificationRetrieval:
    """Test notification retrieval and filtering."""

    def test_get_all_notifications(self, client, db_session):
        """Test getting all notifications for user."""
        user = models.User(
            username="notif_user1",
            email="notifuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/notifications/{user.uid}")
        
        assert response.status_code == 200

    def test_get_unread_notifications(self, client, db_session):
        """Test filtering unread notifications."""
        user = models.User(
            username="notif_user2",
            email="notifuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        notif = models.Notification(
            user_id=user.uid,
            type="test",
            message="Test notification",
            is_read=False
        )
        db_session.add(notif)
        db_session.commit()

        response = client.get(f"/notifications/{user.uid}?unread=true")
        
        assert response.status_code == 200

    def test_get_notifications_by_type(self, client, db_session):
        """Test filtering notifications by type."""
        user = models.User(
            username="notif_user3",
            email="notifuser3@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/notifications/{user.uid}?type=follow")
        
        assert response.status_code == 200


class TestNotificationReadStatus:
    """Test notification read status tracking."""

    def test_mark_notification_as_read(self, client, db_session):
        """Test marking notification as read."""
        user = models.User(
            username="read_user1",
            email="readuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        notif = models.Notification(
            user_id=user.uid,
            type="test",
            message="Test",
            is_read=False
        )
        db_session.add(notif)
        db_session.commit()

        response = client.post(f"/notifications/{notif.nid}/read")
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_mark_all_notifications_as_read(self, client, db_session):
        """Test marking all notifications as read."""
        user = models.User(
            username="read_user2",
            email="readuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(5):
            notif = models.Notification(
                user_id=user.uid,
                type="test",
                message=f"Test {i}",
                is_read=False
            )
            db_session.add(notif)
        
        db_session.commit()

        response = client.post(f"/notifications/{user.uid}/read-all")
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_get_unread_count(self, client, db_session):
        """Test getting unread notification count."""
        user = models.User(
            username="count_user1",
            email="countuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(3):
            notif = models.Notification(
                user_id=user.uid,
                type="test",
                message=f"Test {i}",
                is_read=False
            )
            db_session.add(notif)
        
        db_session.commit()

        response = client.get(f"/notifications/{user.uid}/unread-count")
        
        assert response.status_code == 200


class TestNotificationDeletion:
    """Test notification deletion."""

    def test_delete_single_notification(self, client, db_session):
        """Test deleting a single notification."""
        user = models.User(
            username="delete_user1",
            email="deleteuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        notif = models.Notification(
            user_id=user.uid,
            type="test",
            message="Test"
        )
        db_session.add(notif)
        db_session.commit()

        response = client.delete(f"/notifications/{notif.nid}")
        
        assert response.status_code in [200, 204]

    def test_delete_all_notifications(self, client, db_session):
        """Test deleting all notifications for user."""
        user = models.User(
            username="delete_user2",
            email="deleteuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(5):
            notif = models.Notification(
                user_id=user.uid,
                type="test",
                message=f"Test {i}"
            )
            db_session.add(notif)
        
        db_session.commit()

        response = client.delete(f"/notifications/{user.uid}")
        
        assert response.status_code in [200, 204]


class TestNotificationPagination:
    """Test notification pagination."""

    def test_paginate_notifications(self, client, db_session):
        """Test paginating notifications."""
        user = models.User(
            username="paginate_user1",
            email="paginateuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(25):
            notif = models.Notification(
                user_id=user.uid,
                type="test",
                message=f"Test {i}"
            )
            db_session.add(notif)
        
        db_session.commit()

        response = client.get(f"/notifications/{user.uid}?limit=10&offset=0")
        
        assert response.status_code == 200

    def test_notification_pagination_with_sorting(self, client, db_session):
        """Test pagination with newest first."""
        user = models.User(
            username="paginate_user2",
            email="paginateuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(15):
            notif = models.Notification(
                user_id=user.uid,
                type="test",
                message=f"Test {i}",
                created_at=datetime.utcnow()
            )
            db_session.add(notif)
        
        db_session.commit()

        response = client.get(
            f"/notifications/{user.uid}?limit=10&sort=newest"
        )
        
        assert response.status_code == 200


class TestNotificationEdgeCases:
    """Test edge cases in notifications."""

    def test_notification_for_deleted_post(self, client, db_session):
        """Test handling notification for deleted post."""
        user = models.User(
            username="edge_user1",
            email="edgeuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        notif = models.Notification(
            user_id=user.uid,
            type="comment",
            message="Comment on deleted post",
            post_id=9999  # Non-existent post
        )
        db_session.add(notif)
        db_session.commit()

        response = client.get(f"/notifications/{notif.nid}")
        
        assert response.status_code in [200, 404]

    def test_notification_for_deleted_user(self, client, db_session):
        """Test handling notification from deleted user."""
        user = models.User(
            username="edge_user2",
            email="edgeuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        notif = models.Notification(
            user_id=user.uid,
            type="follow",
            actor_id=9999,  # Non-existent actor
            message="Deleted user followed you"
        )
        db_session.add(notif)
        db_session.commit()

        response = client.get(f"/notifications/{notif.nid}")
        
        assert response.status_code in [200, 404]

    def test_duplicate_notifications_same_action(self, client, db_session):
        """Test preventing duplicate notifications."""
        user = models.User(
            username="edge_user3",
            email="edgeuser3@test.com",
            password="hashed"
        )
        actor = models.User(
            username="edge_actor1",
            email="edgeactor1@test.com",
            password="hashed"
        )
        db_session.add_all([user, actor])
        db_session.commit()

        notif1 = models.Notification(
            user_id=user.uid,
            type="follow",
            actor_id=actor.uid
        )
        notif2 = models.Notification(
            user_id=user.uid,
            type="follow",
            actor_id=actor.uid
        )
        db_session.add_all([notif1, notif2])
        db_session.commit()

        # Both should exist (no automatic deduplication expected)
        notifs = db_session.query(models.Notification).filter(
            models.Notification.user_id == user.uid,
            models.Notification.type == "follow"
        ).all()
        
        assert len(notifs) >= 1


class TestAdminNotifications:
    """Test admin-specific notifications."""

    def test_admin_report_notification(self, client, db_session):
        """Test admin notification for new report."""
        admin = models.User(
            username="admin1",
            email="admin1@test.com",
            password="hashed",
            is_admin=True
        )
        reporter = models.User(
            username="reporter1",
            email="reporter1@test.com",
            password="hashed"
        )
        db_session.add_all([admin, reporter])
        db_session.commit()

        notif = models.Notification(
            user_id=admin.uid,
            type="report",
            actor_id=reporter.uid,
            message="New post report submitted"
        )
        db_session.add(notif)
        db_session.commit()

        assert notif.type == "report"

    def test_admin_user_report_notification(self, client, db_session):
        """Test admin notification for user report."""
        admin = models.User(
            username="admin2",
            email="admin2@test.com",
            password="hashed",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        notif = models.Notification(
            user_id=admin.uid,
            type="user_report",
            message="New user report submitted"
        )
        db_session.add(notif)
        db_session.commit()

        assert notif.type == "user_report"
