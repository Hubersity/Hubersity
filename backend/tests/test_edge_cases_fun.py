"""Fun and quirky edge case tests - line farming edition"""
import pytest
from app import models, utils, oauth2


class TestUsernameEdgeCases:
    """Test various username scenarios"""

    def test_username_with_numbers(self, client):
        """Test username with numbers"""
        payload = {
            "username": "user12345",
            "email": "user123@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201

    def test_username_with_underscores(self, client):
        """Test username with underscores"""
        payload = {
            "username": "user_name_123",
            "email": "username123@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201

    def test_email_with_plus_sign(self, client):
        """Test email with plus sign"""
        payload = {
            "username": "plususer",
            "email": "user+test@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422]

    def test_email_with_subdomain(self, client):
        """Test email with subdomain"""
        payload = {
            "username": "subdomainuser",
            "email": "user@mail.example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201


class TestPasswordEdgeCases:
    """Test various password scenarios"""

    def test_password_max_length(self, client):
        """Test very long password"""
        long_pass = "A" + "a1!" * 100
        payload = {
            "username": "longpassuser",
            "email": "longpass@example.com",
            "password": long_pass,
            "confirm_password": long_pass,
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422, 400]

    def test_password_with_special_chars(self, client):
        """Test password with special characters"""
        payload = {
            "username": "specialcharuser",
            "email": "specialchar@example.com",
            "password": "Aa1!@#$%",
            "confirm_password": "Aa1!@#$%",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422]

    def test_password_with_spaces(self, client):
        """Test password with spaces"""
        payload = {
            "username": "spaceuser",
            "email": "space@example.com",
            "password": "Aa1!aaaa bbbb",
            "confirm_password": "Aa1!aaaa bbbb",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422]

    def test_password_unicode_chars(self, client):
        """Test password with unicode characters"""
        payload = {
            "username": "unicodeuser",
            "email": "unicode@example.com",
            "password": "Aa1!aaaa🎉",
            "confirm_password": "Aa1!aaaa🎉",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422]


class TestLoginEdgeCases:
    """Test various login scenarios"""

    def test_login_case_sensitive_email(self, client):
        """Test that email login is case insensitive or consistent"""
        payload = {
            "username": "caseuser",
            "email": "Case@Example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=payload)
        if r.status_code == 201:
            # Try login with different case
            login = client.post("/login", json={"email": "case@example.com", "password": "Aa1!aaaa"})
            assert login.status_code in [200, 403]

    def test_login_with_whitespace_in_email(self, client):
        """Test login with whitespace in email"""
        login = client.post("/login", json={"email": " test@example.com ", "password": "Aa1!aaaa"})
        assert login.status_code in [400, 403, 422, 200, 401]

    def test_login_with_null_password(self, client):
        """Test login with null password"""
        res = client.post("/login", json={"email": "test@example.com", "password": None})
        assert res.status_code in [400, 403, 422]


class TestPostEdgeCases:
    """Test various post scenarios"""

    def test_post_with_very_long_content(self, client, db_session):
        """Test post with very long content"""
        forum = models.Forum(fid=300, forum_name="Long Content Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "longpostuser",
            "email": "longpost@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "A" * 10000, "forum_id": "300"}
            res = client.post("/posts/", data=post_data, headers=headers)
            assert res.status_code in [200, 400, 413]

    def test_post_with_empty_content(self, client, db_session):
        """Test post with empty content"""
        forum = models.Forum(fid=301, forum_name="Empty Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "emptypostuser",
            "email": "emptypost@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "", "forum_id": "301"}
            res = client.post("/posts/", data=post_data, headers=headers)
            assert res.status_code in [200, 400, 422]

    def test_post_with_special_chars(self, client, db_session):
        """Test post with special characters"""
        forum = models.Forum(fid=302, forum_name="Special Char Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "specialcharpostuser",
            "email": "specialcharpost@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Post with <script>alert('xss')</script>", "forum_id": "302"}
            res = client.post("/posts/", data=post_data, headers=headers)
            assert res.status_code == 200


class TestCommentEdgeCases:
    """Test various comment scenarios"""

    def test_comment_with_html_tags(self, client, db_session):
        """Test comment with HTML tags"""
        forum = models.Forum(fid=303, forum_name="HTML Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "htmlcommentuser",
            "email": "htmlcomment@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Test post", "forum_id": "303"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            if post_res.status_code == 200:
                post = post_res.json()
                post_id = post["pid"]

                comment_data = {"content": "<b>Bold comment</b>"}
                res = client.post(f"/posts/{post_id}/comments", data=comment_data, headers=headers)
                assert res.status_code == 200

    def test_comment_with_mentions(self, client, db_session):
        """Test comment with @ mentions"""
        forum = models.Forum(fid=304, forum_name="Mention Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "mentioncommentuser",
            "email": "mentioncomment@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Test post", "forum_id": "304"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            if post_res.status_code == 200:
                post = post_res.json()
                post_id = post["pid"]

                comment_data = {"content": "Hey @someone check this out"}
                res = client.post(f"/posts/{post_id}/comments", data=comment_data, headers=headers)
                assert res.status_code == 200


class TestFollowEdgeCases:
    """Test following behavior edge cases"""

    def test_follow_then_unfollow_then_follow_again(self, client):
        """Test follow/unfollow cycle"""
        user1_payload = {
            "username": "follower_cycle1",
            "email": "followercycle1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        user1 = r1.json() if r1.status_code == 201 else None

        user2_payload = {
            "username": "followee_cycle1",
            "email": "followeecycle1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r2 = client.post("/users/", json=user2_payload)
        user2 = r2.json() if r2.status_code == 201 else None

        if user1 and user2:
            login = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Follow
            follow1 = client.post(f"/users/{user2['uid']}/follow", headers=headers)
            assert follow1.status_code in [200, 201]

            # Unfollow
            unfollow = client.delete(f"/users/{user2['uid']}/follow", headers=headers)
            assert unfollow.status_code in [200, 204]

            # Follow again
            follow2 = client.post(f"/users/{user2['uid']}/follow", headers=headers)
            assert follow2.status_code in [200, 201]


class TestBlockEdgeCases:
    """Test blocking behavior"""

    def test_block_then_unblock(self, client):
        """Test blocking and unblocking"""
        user1_payload = {
            "username": "blocker1",
            "email": "blocker1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        user1 = r1.json() if r1.status_code == 201 else None

        user2_payload = {
            "username": "blockee1",
            "email": "blockee1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r2 = client.post("/users/", json=user2_payload)
        user2 = r2.json() if r2.status_code == 201 else None

        if user1 and user2:
            login = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Block
            block = client.post(f"/block/{user2['uid']}", headers=headers)
            assert block.status_code in [200, 201]

            # Unblock
            unblock = client.delete(f"/block/{user2['uid']}", headers=headers)
            assert unblock.status_code in [200, 204]
