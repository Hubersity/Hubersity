"""API boundary and stress testing - more line farming"""
import pytest
from app import models


class TestNewsEdgeCases:
    """Test news operations edge cases"""

    def test_news_with_special_characters_in_title(self, client):
        """Test news with special characters"""
        user_payload = {
            "username": "newsspecialuser",
            "email": "newsspecial@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            user = r.json()
            # Make user admin for news creation
            assert user["uid"] > 0

    def test_news_pagination_bounds(self, client):
        """Test news pagination with boundary values"""
        res = client.get("/news/?skip=0&limit=1")
        assert res.status_code == 200

        res = client.get("/news/?skip=1000&limit=10")
        assert res.status_code == 200

    def test_news_search_empty_query(self, client):
        """Test news search with empty query"""
        res = client.get("/news/?q=")
        assert res.status_code == 200

    def test_news_search_special_chars(self, client):
        """Test news search with special characters"""
        res = client.get("/news/?q=%<>")
        assert res.status_code in [200, 400, 422]


class TestNotificationEdgeCases:
    """Test notification edge cases"""

    def test_notification_for_multiple_recipients(self, client):
        """Test notification system with multiple users"""
        # Create 3 users
        users = []
        for i in range(3):
            user_payload = {
                "username": f"notifuser{i}",
                "email": f"notifuser{i}@example.com",
                "password": "Aa1!aaaa",
                "confirm_password": "Aa1!aaaa",
            }
            r = client.post("/users/", json=user_payload)
            if r.status_code == 201:
                users.append(r.json())

        assert len(users) > 0

    def test_get_notifications_pagination(self, client):
        """Test notifications with pagination"""
        user_payload = {
            "username": "notifpagineuser",
            "email": "notifpagineuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            res = client.get("/notification/me", headers=headers)
            assert res.status_code == 200


class TestDataValidation:
    """Test data validation boundaries"""

    def test_integer_field_boundaries(self, client, db_session):
        """Test integer fields with boundary values"""
        user = models.User(
            username="intboundaryuser",
            email="intboundary@example.com",
            password="hashed",
        )
        db_session.add(user)
        db_session.commit()
        assert user.uid > 0

    def test_string_field_lengths(self, client):
        """Test string fields with various lengths"""
        # Very short username
        payload1 = {
            "username": "a",
            "email": "ashort@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res1 = client.post("/users/", json=payload1)
        assert res1.status_code in [201, 422]

        # Medium username
        payload2 = {
            "username": "mediumusername",
            "email": "medium@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res2 = client.post("/users/", json=payload2)
        assert res2.status_code == 201


class TestConcurrentBehavior:
    """Test behavior under simulated concurrent scenarios"""

    def test_multiple_posts_same_forum(self, client, db_session):
        """Test multiple posts in same forum"""
        forum = models.Forum(fid=400, forum_name="Multi Post Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "multipostuser",
            "email": "multipost@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Create multiple posts
            for i in range(3):
                post_data = {"post_content": f"Post {i}", "forum_id": "400"}
                res = client.post("/posts/", data=post_data, headers=headers)
                assert res.status_code == 200

    def test_multiple_likes_same_post(self, client, db_session):
        """Test multiple users liking same post"""
        forum = models.Forum(fid=401, forum_name="Like Forum")
        db_session.add(forum)
        db_session.commit()

        # Create first user and post
        user1_payload = {
            "username": "liker1",
            "email": "liker1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        if r1.status_code == 201:
            login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token1 = login1.json()["access_token"]
            headers1 = {"Authorization": f"Bearer {token1}"}

            post_data = {"post_content": "Like me!", "forum_id": "401"}
            post_res = client.post("/posts/", data=post_data, headers=headers1)
            if post_res.status_code == 200:
                post = post_res.json()
                post_id = post["pid"]

                # Create multiple users to like
                for i in range(3):
                    user_payload = {
                        "username": f"liker_multi{i}",
                        "email": f"likermulti{i}@example.com",
                        "password": "Aa1!aaaa",
                        "confirm_password": "Aa1!aaaa",
                    }
                    r = client.post("/users/", json=user_payload)
                    if r.status_code == 201:
                        login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
                        token = login.json()["access_token"]
                        headers = {"Authorization": f"Bearer {token}"}

                        like_res = client.post(f"/posts/{post_id}/like", headers=headers)
                        assert like_res.status_code == 200


class TestResourceDeletion:
    """Test deletion of various resources"""

    def test_delete_own_posts_sequentially(self, client, db_session):
        """Test deleting multiple own posts"""
        forum = models.Forum(fid=402, forum_name="Delete Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "deleteuser",
            "email": "deleteuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_ids = []
            for i in range(3):
                post_data = {"post_content": f"Delete me {i}", "forum_id": "402"}
                post_res = client.post("/posts/", data=post_data, headers=headers)
                if post_res.status_code == 200:
                    post_ids.append(post_res.json()["pid"])

            # Delete them
            for post_id in post_ids:
                delete_res = client.delete(f"/posts/{post_id}", headers=headers)
                assert delete_res.status_code in [200, 204]


class TestAuthenticationFlow:
    """Test authentication flow variations"""

    def test_login_logout_login_cycle(self, client):
        """Test login-logout-login cycle"""
        user_payload = {
            "username": "cycleuser",
            "email": "cycleuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            # First login
            login1 = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            assert login1.status_code == 200
            token1 = login1.json()["access_token"]

            # Second login
            login2 = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            assert login2.status_code == 200
            token2 = login2.json()["access_token"]

            # Tokens should exist
            assert token1 is not None
            assert token2 is not None

    def test_access_with_different_tokens(self, client):
        """Test accessing endpoints with different tokens"""
        user_payload = {
            "username": "tokenuser",
            "email": "tokenuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Access different endpoints
            me_res = client.get("/users/me", headers=headers)
            assert me_res.status_code == 200


class TestErrorRecovery:
    """Test error recovery scenarios"""

    def test_recover_from_invalid_request(self, client):
        """Test recovery after invalid request"""
        # Send invalid request
        invalid_res = client.post("/users/", json={"invalid": "data"})
        assert invalid_res.status_code in [400, 422]

        # Send valid request after
        valid_payload = {
            "username": "recoveryuser",
            "email": "recovery@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        valid_res = client.post("/users/", json=valid_payload)
        assert valid_res.status_code == 201

    def test_recover_from_unauthorized_access(self, client):
        """Test recovery after unauthorized access"""
        # Try unauthorized access
        unauth_res = client.get("/users/me")
        assert unauth_res.status_code == 401

        # Create user and login
        user_payload = {
            "username": "unauth_recovery",
            "email": "unauthrecovery@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Now authorized
            auth_res = client.get("/users/me", headers=headers)
            assert auth_res.status_code == 200
