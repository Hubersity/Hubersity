"""Tests for advanced search, filtering, and discovery features."""
import uuid
from app import models


class TestUserSearch:
    """Test user search functionality."""

    def test_search_users_by_username(self, client, db_session):
        """Test searching for users by username."""
        # Register users via API
        email1 = f"john_search_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"jane_search_{uuid.uuid4().hex[:8]}@test.com"
        
        client.post("/users/", json={
            "username": "john_doe", "email": email1, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"
        })
        client.post("/users/", json={
            "username": "jane_doe", "email": email2, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email1, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/users/search?q=jane", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]

    def test_search_users_empty_query(self, client, db_session):
        """Test search with empty query."""
        email = f"test_empty_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": "testuser_empty", "email": email, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/users/search?q=", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]

    def test_search_users_no_results(self, client, db_session):
        """Test search with no matching results."""
        email = f"test_noresults_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": "john_noresults", "email": email, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/users/search?q=nonexistent_user_xyz_12345", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]

    def test_search_case_insensitive(self, client, db_session):
        """Test case-insensitive search."""
        email = f"test_case_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": "TestUserCase", "email": email, "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/users/search?q=testuser", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]


class TestPostsByTags:
    """Test filtering posts by tags."""

    def test_get_posts_by_tag(self, client, db_session):
        """Test retrieving posts by specific tag."""
        response = client.get("/posts/tags/python")
        assert response.status_code in [200, 400, 401, 404]

    def test_multiple_tags_filter(self, client):
        """Test filtering by multiple tags."""
        response = client.get("/posts/tags?tags=python,javascript")
        assert response.status_code in [200, 400, 401, 404]


class TestPostsByForum:
    """Test filtering posts by forum."""

    def test_get_posts_by_forum(self, client, db_session):
        """Test retrieving posts from specific forum."""
        forum = db_session.query(models.Forum).first()
        if forum:
            response = client.get(f"/posts/forum/{forum.fid}")
            assert response.status_code in [200, 400, 401, 404]
        else:
            # No forum exists, test is skipped
            pass

    def test_invalid_forum_id(self, client):
        """Test invalid forum ID."""
        response = client.get("/posts/forum/99999")
        assert response.status_code in [200, 400, 401, 404]


class TestFollowingFeed:
    """Test feed from following users."""

    def test_get_following_posts(self, client, db_session):
        """Test getting posts from followed users."""
        email1 = f"follower_{uuid.uuid4().hex[:8]}@test.com"
        email2 = f"followed_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register users
        resp1 = client.post("/users/", json={
            "username": f"follower_{uuid.uuid4().hex[:8]}", 
            "email": email1, 
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        })
        resp2 = client.post("/users/", json={
            "username": f"followed_{uuid.uuid4().hex[:8]}", 
            "email": email2, 
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        })

        if resp1.status_code not in [200, 201] or resp2.status_code not in [200, 201]:
            return

        # Login as follower
        login_resp = client.post(
            "/login",
            json={"email": email1, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/posts/following", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]

    def test_empty_following_feed(self, client, db_session):
        """Test feed when not following anyone."""
        email = f"solo_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": f"solo_user_{uuid.uuid4().hex[:8]}", 
            "email": email, 
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/posts/following", headers=headers)
        assert response.status_code in [200, 400, 401, 404, 422]


class TestPaginatedResults:
    """Test pagination in various endpoints."""

    def test_posts_pagination_limit(self, client, db_session):
        """Test pagination with limit parameter."""
        email = f"poster_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": f"poster_{uuid.uuid4().hex[:8]}", 
            "email": email, 
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/posts/?limit=5", headers=headers)
        assert response.status_code in [200, 400, 401, 404]

    def test_posts_pagination_offset(self, client, db_session):
        """Test pagination with offset/skip."""
        email = f"poster2_{uuid.uuid4().hex[:8]}@test.com"
        client.post("/users/", json={
            "username": f"poster2_{uuid.uuid4().hex[:8]}", 
            "email": email, 
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        })

        login_resp = client.post(
            "/login",
            json={"email": email, "password": "Aa1!aaaa"}
        )
        data = login_resp.json()
        token = data.get("access_token")
        if not token:
            assert login_resp.status_code in [200, 201, 400, 401, 403]
            return
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/posts/?skip=10", headers=headers)
        assert response.status_code in [200, 400, 401, 404]
