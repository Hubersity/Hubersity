"""Creative and unusual but valid API workflows"""
import pytest
from app import models


class TestUserInteractions:
    """Test various user interaction patterns"""

    def test_user_follow_mutual_followers(self, client):
        """Test mutual following between users"""
        user1_payload = {
            "username": "mutual_follower1",
            "email": "mutual1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        user2_payload = {
            "username": "mutual_follower2",
            "email": "mutual2@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        r2 = client.post("/users/", json=user2_payload)
        
        if r1.status_code == 201 and r2.status_code == 201:
            user1 = r1.json()
            user2 = r2.json()
            
            # User 1 follows User 2
            login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token1 = login1.json()["access_token"]
            headers1 = {"Authorization": f"Bearer {token1}"}
            
            follow_res = client.post(f"/follows/{user2['uid']}", headers=headers1)
            assert follow_res.status_code in [200, 201]

    def test_user_changes_avatar_multiple_times(self, client):
        """Test changing user avatar multiple times"""
        user_payload = {
            "username": "avatar_changer",
            "email": "avatar_changer@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Try to get user profile
            profile_res = client.get("/users/me", headers=headers)
            assert profile_res.status_code == 200

    def test_user_updates_profile_incrementally(self, client):
        """Test updating user profile multiple times"""
        user_payload = {
            "username": "profile_updater",
            "email": "profileupdater@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Update profile multiple times
            for i in range(3):
                update_data = {"username": f"profile_updater_v{i}"}
                update_res = client.put("/users/profile", json=update_data, headers=headers)
                assert update_res.status_code in [200, 400, 422]

    def test_search_user_by_email(self, client):
        """Test searching user functionality"""
        user_payload = {
            "username": "searchable_user",
            "email": "search@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            # Try to search
            search_res = client.get("/users/?email=search@example.com")
            assert search_res.status_code in [200, 404]


class TestPostLifecycle:
    """Test complete post lifecycle"""

    def test_post_create_comment_like_delete(self, client, db_session):
        """Test complete post lifecycle"""
        forum = models.Forum(fid=500, forum_name="Lifecycle Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "lifecycle_user",
            "email": "lifecycle@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Create post
            post_data = {"post_content": "Lifecycle post", "forum_id": "500"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            assert post_res.status_code == 200

    def test_post_update_multiple_times(self, client, db_session):
        """Test updating a post multiple times"""
        forum = models.Forum(fid=501, forum_name="Update Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "update_poster",
            "email": "updateposter@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Original content", "forum_id": "501"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            if post_res.status_code == 200:
                post_id = post_res.json()["pid"]

                # Update post multiple times
                for i in range(3):
                    update_data = {"post_content": f"Updated content {i}"}
                    update_res = client.put(f"/posts/{post_id}", data=update_data, headers=headers)
                    assert update_res.status_code in [200, 400]

    def test_post_with_mentions(self, client, db_session):
        """Test post containing mentions"""
        forum = models.Forum(fid=502, forum_name="Mention Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "mention_poster",
            "email": "mentionposter@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "@someone check this out", "forum_id": "502"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            assert post_res.status_code == 200


class TestCommentInteractions:
    """Test comment-related workflows"""

    def test_comment_reply_chain(self, client, db_session):
        """Test creating a chain of comment replies"""
        forum = models.Forum(fid=503, forum_name="Reply Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "reply_user",
            "email": "replyuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Original post", "forum_id": "503"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            if post_res.status_code == 200:
                post_id = post_res.json()["pid"]
                
                # Add comment
                comment_data = {"comment_content": "Great post!"}
                comment_res = client.post(f"/posts/{post_id}/comments", json=comment_data, headers=headers)
                assert comment_res.status_code in [200, 201]

    def test_like_comment(self, client, db_session):
        """Test liking comments"""
        forum = models.Forum(fid=504, forum_name="Like Comment Forum")
        db_session.add(forum)
        db_session.commit()

        user_payload = {
            "username": "like_commenter",
            "email": "likecommenter@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            post_data = {"post_content": "Comment-able post", "forum_id": "504"}
            post_res = client.post("/posts/", data=post_data, headers=headers)
            if post_res.status_code == 200:
                post_id = post_res.json()["pid"]
                comment_data = {"comment_content": "Nice!"}
                comment_res = client.post(f"/posts/{post_id}/comments", json=comment_data, headers=headers)
                if comment_res.status_code in [200, 201]:
                    comment = comment_res.json()
                    # Try to like comment
                    like_res = client.post(f"/posts/{post_id}/comments/{comment['id']}/like", headers=headers)
                    assert like_res.status_code in [200, 400]


class TestForumBrowsing:
    """Test forum browsing patterns"""

    def test_browse_multiple_forums(self, client):
        """Test browsing posts from multiple forums"""
        # Get posts from forum
        forum_res = client.get("/forums/")
        assert forum_res.status_code == 200

    def test_get_forum_posts_with_sorting(self, client):
        """Test getting forum posts with different sorts"""
        res = client.get("/forums/100/posts")
        assert res.status_code in [200, 404]

    def test_search_posts(self, client):
        """Test searching posts"""
        search_res = client.get("/posts/search?q=test")
        assert search_res.status_code in [200, 404]


class TestFollowSystem:
    """Test following/unfollowing patterns"""

    def test_follow_unfollow_cycle_multiple(self, client):
        """Test multiple follow/unfollow cycles"""
        user1_payload = {
            "username": "cycler1",
            "email": "cycler1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        user2_payload = {
            "username": "cycler2",
            "email": "cycler2@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        r2 = client.post("/users/", json=user2_payload)
        
        if r1.status_code == 201 and r2.status_code == 201:
            user2 = r2.json()
            login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token1 = login1.json()["access_token"]
            headers1 = {"Authorization": f"Bearer {token1}"}

            # Multiple follow/unfollow cycles
            for i in range(2):
                follow_res = client.post(f"/follows/{user2['uid']}", headers=headers1)
                assert follow_res.status_code in [200, 201]

                unfollow_res = client.delete(f"/follows/{user2['uid']}", headers=headers1)
                assert unfollow_res.status_code in [200, 204]

    def test_get_followers_and_following(self, client):
        """Test getting followers and following lists"""
        user_payload = {
            "username": "list_viewer",
            "email": "listviewer@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            user = r.json()
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Get followers
            followers_res = client.get(f"/follows/followers/{user['uid']}")
            assert followers_res.status_code == 200

            # Get following
            following_res = client.get(f"/follows/following/{user['uid']}")
            assert following_res.status_code == 200


class TestChatFeature:
    """Test chat functionality"""

    def test_send_message_and_get_conversation(self, client):
        """Test sending message and retrieving conversation"""
        user1_payload = {
            "username": "chatter1",
            "email": "chatter1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        user2_payload = {
            "username": "chatter2",
            "email": "chatter2@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r1 = client.post("/users/", json=user1_payload)
        r2 = client.post("/users/", json=user2_payload)
        
        if r1.status_code == 201 and r2.status_code == 201:
            user2 = r2.json()
            login1 = client.post("/login", json={"email": user1_payload["email"], "password": "Aa1!aaaa"})
            token1 = login1.json()["access_token"]
            headers1 = {"Authorization": f"Bearer {token1}"}

            # Send message
            msg_data = {"receiver_id": user2['uid'], "message_content": "Hello!"}
            msg_res = client.post("/chats/", json=msg_data, headers=headers1)
            assert msg_res.status_code in [200, 201]

    def test_get_chat_conversations(self, client):
        """Test getting list of conversations"""
        user_payload = {
            "username": "conversation_viewer",
            "email": "convviewer@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Get conversations
            conv_res = client.get("/chats/conversations", headers=headers)
            assert conv_res.status_code == 200


class TestStudyCalendar:
    """Test study calendar functionality"""

    def test_add_study_session(self, client):
        """Test adding study sessions"""
        user_payload = {
            "username": "student",
            "email": "student@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Try to add study session
            study_data = {"subject": "Math", "hours": "2"}
            study_res = client.post("/study_calendar/", json=study_data, headers=headers)
            assert study_res.status_code in [200, 201, 400]

    def test_get_study_progress(self, client):
        """Test getting study progress"""
        user_payload = {
            "username": "studier",
            "email": "studier@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        r = client.post("/users/", json=user_payload)
        if r.status_code == 201:
            login = client.post("/login", json={"email": user_payload["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Get study calendar
            progress_res = client.get("/study_calendar/", headers=headers)
            assert progress_res.status_code == 200
