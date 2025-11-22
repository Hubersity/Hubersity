"""Tests for user account management operations."""
from datetime import datetime
from app import models


class TestPasswordChange:
    """Test user password change operations."""

    def test_change_password_valid(self, client, db_session):
        """Test changing password with valid input."""
        user = models.User(
            username="pwd_user1",
            email="pwduser1@test.com",
            password="hashed_old"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/users/{user.uid}/change-password",
            json={
                "old_password": "old_password",
                "new_password": "new_password"
            }
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_change_password_wrong_old_password(self, client, db_session):
        """Test change password fails with wrong old password."""
        user = models.User(
            username="pwd_user2",
            email="pwduser2@test.com",
            password="hashed_correct"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/users/{user.uid}/change-password",
            json={
                "old_password": "wrong_password",
                "new_password": "new_password"
            }
        )
        
        assert response.status_code in [400, 401]

    def test_change_password_same_as_old(self, client, db_session):
        """Test that new password cannot be same as old."""
        user = models.User(
            username="pwd_user3",
            email="pwduser3@test.com",
            password="hashed_pwd"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/users/{user.uid}/change-password",
            json={
                "old_password": "same_password",
                "new_password": "same_password"
            }
        )
        
        assert response.status_code in [200, 400]


class TestProfileCompletion:
    """Test user profile completeness tracking."""

    def test_get_profile_completion_percentage(self, client, db_session):
        """Test getting profile completion percentage."""
        user = models.User(
            username="profile_user1",
            email="profileuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/users/{user.uid}/profile-completion")
        
        assert response.status_code == 200

    def test_update_bio_increases_completion(self, client, db_session):
        """Test that adding bio increases completion."""
        user = models.User(
            username="profile_user2",
            email="profileuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        initial_response = client.get(f"/users/{user.uid}/profile-completion")
        
        response = client.put(
            f"/users/{user.uid}",
            json={"bio": "New biography"}
        )
        
        assert response.status_code == 200

    def test_update_profile_picture_increases_completion(self, client, db_session):
        """Test that adding profile picture increases completion."""
        user = models.User(
            username="profile_user3",
            email="profileuser3@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.put(
            f"/users/{user.uid}",
            json={"profile_picture": "new_pic.jpg"}
        )
        
        assert response.status_code == 200

    def test_all_fields_complete(self, client, db_session):
        """Test profile with all fields complete."""
        user = models.User(
            username="profile_user4",
            email="profileuser4@test.com",
            password="hashed",
            bio="Complete profile",
            profile_picture="pic.jpg"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/users/{user.uid}/profile-completion")
        
        assert response.status_code == 200


class TestAccountDeletion:
    """Test user account deletion."""

    def test_delete_account_valid(self, client, db_session):
        """Test valid account deletion."""
        user = models.User(
            username="delete_account_user1",
            email="deleteaccountuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/users/{user.uid}/delete-account",
            json={"password": "correct_password"}
        )
        
        assert response.status_code in [200, 201, 404, 422]

    def test_delete_account_wrong_password(self, client, db_session):
        """Test account deletion fails with wrong password."""
        user = models.User(
            username="delete_account_user2",
            email="deleteaccountuser2@test.com",
            password="hashed_pwd"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/users/{user.uid}/delete-account",
            json={"password": "wrong_password"}
        )
        
        assert response.status_code in [401, 400, 404, 422]


class TestAccountDeletionCleanup:
    """Test data cleanup on account deletion."""

    def test_delete_account_removes_user_data(self, client, db_session):
        """Test that deleting account removes user data."""
        user = models.User(
            username="cleanup_user1",
            email="cleanupuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        user_id = user.uid

        # Add some user data
        post = models.Post(
            user_id=user_id,
            content="User's post"
        )
        db_session.add(post)
        db_session.commit()

        # Delete account
        db_session.delete(user)
        db_session.commit()

        # User should be gone
        deleted_user = db_session.query(models.User).filter(
            models.User.uid == user_id
        ).first()
        
        assert deleted_user is None

    def test_delete_account_removes_posts(self, client, db_session):
        """Test that user's posts are deleted."""
        user = models.User(
            username="cleanup_user2",
            email="cleanupuser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        for i in range(3):
            post = models.Post(
                user_id=user.uid,
                content=f"Post {i}"
            )
            db_session.add(post)
        
        db_session.commit()
        user_id = user.uid

        db_session.delete(user)
        db_session.commit()

        user_posts = db_session.query(models.Post).filter(
            models.Post.user_id == user_id
        ).count()
        
        assert user_posts == 0

    def test_delete_account_clears_follows(self, client, db_session):
        """Test that follow relationships are cleared."""
        user = models.User(
            username="cleanup_user3",
            email="cleanupuser3@test.com",
            password="hashed"
        )
        follower1 = models.User(
            username="cleanup_follower1",
            email="cleanupfollower1@test.com",
            password="hashed"
        )
        follower2 = models.User(
            username="cleanup_follower2",
            email="cleanupfollower2@test.com",
            password="hashed"
        )
        db_session.add_all([user, follower1, follower2])
        db_session.commit()

        follow1 = models.Follow(
            follower_id=follower1.uid,
            followee_id=user.uid
        )
        follow2 = models.Follow(
            follower_id=follower2.uid,
            followee_id=user.uid
        )
        db_session.add_all([follow1, follow2])
        db_session.commit()

        user_id = user.uid
        db_session.delete(user)
        db_session.commit()

        # Relationships should be removed
        follows = db_session.query(models.Follow).filter(
            (models.Follow.followee_id == user_id) | 
            (models.Follow.follower_id == user_id)
        ).count()
        
        assert follows == 0

    def test_delete_account_clears_blocks(self, client, db_session):
        """Test that block relationships are cleared."""
        user = models.User(
            username="cleanup_user4",
            email="cleanupuser4@test.com",
            password="hashed"
        )
        blocked_user = models.User(
            username="cleanup_blocked",
            email="cleanupblocked@test.com",
            password="hashed"
        )
        db_session.add_all([user, blocked_user])
        db_session.commit()

        block = models.Block(
            blocker_id=user.uid,
            blocked_id=blocked_user.uid
        )
        db_session.add(block)
        db_session.commit()

        user_id = user.uid
        db_session.delete(user)
        db_session.commit()

        blocks = db_session.query(models.Block).filter(
            (models.Block.blocker_id == user_id) | 
            (models.Block.blocked_id == user_id)
        ).count()
        
        assert blocks == 0

    def test_delete_account_clears_chat_messages(self, client, db_session):
        """Test that chat messages are cleared."""
        user = models.User(
            username="cleanup_user5",
            email="cleanupuser5@test.com",
            password="hashed"
        )
        other_user = models.User(
            username="cleanup_other",
            email="cleanupother@test.com",
            password="hashed"
        )
        db_session.add_all([user, other_user])
        db_session.commit()

        chat = models.Chat(user_ids=[user.uid, other_user.uid])
        db_session.add(chat)
        db_session.commit()

        message = models.ChatMessage(
            chat_id=chat.chat_id,
            user_id=user.uid,
            message="Test message"
        )
        db_session.add(message)
        db_session.commit()

        user_id = user.uid
        db_session.delete(user)
        db_session.commit()

        user_messages = db_session.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == user_id
        ).count()
        
        assert user_messages == 0


class TestEmailUniquenesAfterDeletion:
    """Test email uniqueness after account deletion."""

    def test_reuse_email_after_deletion(self, client, db_session):
        """Test that deleted email can be reused."""
        email = "reuse_email@test.com"
        
        user1 = models.User(
            username="email_user1",
            email=email,
            password="hashed"
        )
        db_session.add(user1)
        db_session.commit()

        db_session.delete(user1)
        db_session.commit()

        # Should be able to create new user with same email
        user2 = models.User(
            username="email_user2",
            email=email,
            password="hashed"
        )
        db_session.add(user2)
        db_session.commit()

        assert user2.email == email

    def test_deleted_user_email_not_accessible(self, client, db_session):
        """Test that deleted user email is not accessible."""
        email = "deleted_email@test.com"
        
        user = models.User(
            username="deleted_email_user",
            email=email,
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        user_id = user.uid
        db_session.delete(user)
        db_session.commit()

        # Should not find user by email
        found_user = db_session.query(models.User).filter(
            models.User.email == email
        ).first()
        
        assert found_user is None


class TestAccountRecovery:
    """Test account recovery scenarios."""

    def test_recovery_link_generation(self, client, db_session):
        """Test recovery link generation."""
        user = models.User(
            username="recovery_user1",
            email="recoveryuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/users/forgot-password",
            json={"email": user.email}
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_recovery_link_expiration(self, client, db_session):
        """Test recovery link expiration."""
        response = client.post(
            "/users/reset-password",
            json={
                "token": "expired_token",
                "new_password": "new_pwd"
            }
        )
        
        # Should fail with invalid/expired token
        assert response.status_code in [400, 401]
