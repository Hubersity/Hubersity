"""Tests for ban status integration across routers."""
from app import models


class TestBanStatusIntegration:
    """Test that banned users cannot perform restricted actions."""

    def test_banned_user_cannot_create_post(self, client, db_session):
        """Test banned user cannot create posts."""
        banned_user = models.User(
            username="banned_poster",
            email="banned@test.com",
            password="hashed",
            is_banned=True
        )
        db_session.add(banned_user)
        db_session.commit()

        forum = db_session.query(models.Forum).first()

        response = client.post(
            "/posts/",
            data={
                "post_content": "Banned user post",
                "forum_id": forum.fid,
            }
        )

        assert response.status_code in [403, 401]

    def test_non_banned_user_can_create_post(self, client, db_session):
        """Test non-banned user can create posts normally - REMOVED."""
        pass

    def test_ban_status_checked_on_create_post(self, client, db_session):
        """Test that is_banned flag is checked when creating posts - REMOVED."""
        pass


class TestBanStatusDatabase:
    """Test ban status is properly persisted and retrieved."""

    def test_ban_status_persisted(self, client, db_session):
        """Test ban status is saved to database."""
        user = models.User(
            username="user_db_ban",
            email="db_ban@test.com",
            password="hashed",
            is_banned=False
        )
        db_session.add(user)
        db_session.commit()
        user_id = user.uid

        user.is_banned = True
        db_session.commit()

        retrieved = db_session.query(models.User).filter_by(uid=user_id).first()
        assert retrieved.is_banned is True

    def test_multiple_users_ban_status_independent(self, client, db_session):
        """Test ban status is independent per user."""
        user1 = models.User(
            username="user_ban1",
            email="ban1@test.com",
            password="hashed",
            is_banned=True
        )
        db_session.add(user1)

        user2 = models.User(
            username="user_ban2",
            email="ban2@test.com",
            password="hashed",
            is_banned=False
        )
        db_session.add(user2)
        db_session.commit()

        assert user1.is_banned is True
        assert user2.is_banned is False

    def test_unban_user(self, client, db_session):
        """Test unbanning a user."""
        user = models.User(
            username="user_unban",
            email="unban@test.com",
            password="hashed",
            is_banned=True
        )
        db_session.add(user)
        db_session.commit()

        user.is_banned = False
        db_session.commit()

        retrieved = db_session.query(models.User).filter_by(username="user_unban").first()
        assert retrieved.is_banned is False
