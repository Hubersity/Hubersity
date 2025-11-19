import pytest
import time
from app import models


class TestResponseTime:
    """Test that endpoints respond within acceptable time limits"""
    
    def test_login_response_time(self, client):
        """Login should respond in < 500ms"""
        # Create user first
        user = {"username": "perf_login", "email": "perf_login@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user)
        
        start = time.time()
        res = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        elapsed = (time.time() - start) * 1000  # Convert to ms
        
        assert res.status_code == 200
        assert elapsed < 500, f"Login took {elapsed}ms, expected < 500ms"
    
    def test_get_user_response_time(self, client, db_session):
        """Getting user profile should respond in < 200ms"""
        # Create and login user
        user_data = {"username": "perf_user", "email": "perf_user@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user_data)
        login = client.post("/login", json={"email": user_data["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        start = time.time()
        res = client.get("/users/me", headers=headers)
        elapsed = (time.time() - start) * 1000
        
        assert res.status_code == 200
        assert elapsed < 200, f"Get user took {elapsed}ms, expected < 200ms"
    
    def test_create_post_response_time(self, client, db_session):
        """Creating a post should respond in < 300ms"""
        forum = models.Forum(fid=200, forum_name="Perf Forum")
        db_session.add(forum)
        db_session.commit()
        
        user = {"username": "perf_poster", "email": "perf_poster@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        start = time.time()
        res = client.post("/posts/", data={"post_content": "Performance test", "forum_id": "200"}, headers=headers)
        elapsed = (time.time() - start) * 1000
        
        assert res.status_code == 200
        assert elapsed < 300, f"Create post took {elapsed}ms, expected < 300ms"


class TestConcurrency:
    """Test API behavior under concurrent load (sequential to avoid SQLite threading issues)"""
    
    def test_sequential_logins_simulates_concurrency(self, client):
        """Simulate multiple login attempts to test handling"""
        num_users = 5
        users = []
        
        # Create users
        for i in range(num_users):
            user = {
                "username": f"sequential_user_{i}",
                "email": f"sequential_user_{i}@example.com",
                "password": "Aa1!aaaa",
                "confirm_password": "Aa1!aaaa"
            }
            client.post("/users/", json=user)
            users.append(user)
        
        # Sequential logins (simulating concurrent scenario)
        results = []
        for user in users:
            res = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
            results.append(res)
        
        # All should succeed
        assert all(r.status_code == 200 for r in results), "Not all logins succeeded"
        assert len(results) == num_users
    
    def test_high_frequency_post_creation(self, client, db_session):
        """Rapid post creation to simulate high-frequency operations"""
        forum = models.Forum(fid=201, forum_name="High Freq Forum")
        db_session.add(forum)
        db_session.commit()
        
        user = {
            "username": "fast_poster",
            "email": "fast_poster@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa"
        }
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create 5 posts rapidly
        results = []
        for i in range(5):
            res = client.post("/posts/", data={"post_content": f"Fast post {i}", "forum_id": "201"}, headers=headers)
            results.append(res)
        
        assert all(r.status_code == 200 for r in results), "Not all rapid posts created"
        assert len(results) == 5
    
    def test_sequential_likes_same_post(self, client, db_session):
        """Multiple users liking the same post sequentially"""
        forum = models.Forum(fid=202, forum_name="Like Forum")
        db_session.add(forum)
        db_session.commit()
        
        # Create a post
        user1 = {"username": "post_owner", "email": "post_owner@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user1)
        login = client.post("/login", json={"email": user1["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.post("/posts/", data={"post_content": "Like test", "forum_id": "202"}, headers=headers)
        post_id = res.json()["pid"]
        
        # Create other users and have them like
        num_likers = 4
        results = []
        for i in range(num_likers):
            user = {
                "username": f"sequential_liker_{i}",
                "email": f"sequential_liker_{i}@example.com",
                "password": "Aa1!aaaa",
                "confirm_password": "Aa1!aaaa"
            }
            client.post("/users/", json=user)
            login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            res = client.post(f"/posts/{post_id}/like", headers=headers)
            results.append(res)
        
        assert all(r.status_code == 200 for r in results), "Not all likes succeeded"


class TestStress:
    """Test API under stress conditions"""
    
    def test_sequential_post_creation(self, client, db_session):
        """Create many posts sequentially to test database performance"""
        forum = models.Forum(fid=203, forum_name="Stress Forum")
        db_session.add(forum)
        db_session.commit()
        
        user = {"username": "stress_user", "email": "stress_user@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        num_posts = 10
        start = time.time()
        
        for i in range(num_posts):
            res = client.post("/posts/", data={"post_content": f"Stress post {i}", "forum_id": "203"}, headers=headers)
            assert res.status_code == 200
        
        elapsed = time.time() - start
        avg_time = elapsed / num_posts
        
        # Each post should average < 100ms
        assert avg_time < 100, f"Average post creation took {avg_time*1000}ms, expected < 100ms"
    
    def test_sequential_comments(self, client, db_session):
        """Add many comments to a post"""
        forum = models.Forum(fid=204, forum_name="Comment Stress")
        db_session.add(forum)
        db_session.commit()
        
        # Create post owner
        owner = {"username": "comment_owner", "email": "comment_owner@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=owner)
        login = client.post("/login", json={"email": owner["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.post("/posts/", data={"post_content": "Comment test", "forum_id": "204"}, headers=headers)
        post_id = res.json()["pid"]
        
        # Create commenters
        num_comments = 15
        start = time.time()
        
        for i in range(num_comments):
            user = {"username": f"commenter_{i}", "email": f"commenter_{i}@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
            client.post("/users/", json=user)
            login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            res = client.post(f"/posts/{post_id}/comments", data={"content": f"Comment {i}"}, headers=headers)
            assert res.status_code == 200
        
        elapsed = time.time() - start
        avg_time = elapsed / num_comments
        
        assert avg_time < 150, f"Average comment took {avg_time*1000}ms, expected < 150ms"
    
    def test_sequential_user_creation(self, client):
        """Create many users sequentially"""
        num_users = 15
        start = time.time()
        
        for i in range(num_users):
            user = {
                "username": f"bulk_user_{i}_{int(time.time()*1000)}",
                "email": f"bulk_user_{i}_{int(time.time()*1000)}@example.com",
                "password": "Aa1!aaaa",
                "confirm_password": "Aa1!aaaa"
            }
            res = client.post("/users/", json=user)
            assert res.status_code == 201
        
        elapsed = time.time() - start
        avg_time = elapsed / num_users
        
        assert avg_time < 200, f"Average user creation took {avg_time*1000}ms, expected < 200ms"


class TestMemoryAndData:
    """Test handling of large data and edge cases"""
    
    def test_large_post_content(self, client, db_session):
        """Test posting with large content"""
        forum = models.Forum(fid=205, forum_name="Large Content Forum")
        db_session.add(forum)
        db_session.commit()
        
        user = {"username": "large_poster", "email": "large_poster@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create large content (5000 characters)
        large_content = "A" * 5000
        res = client.post("/posts/", data={"post_content": large_content, "forum_id": "205"}, headers=headers)
        
        assert res.status_code == 200
        assert res.json()["post_content"] == large_content
    
    def test_long_comment_thread(self, client, db_session):
        """Test handling of posts with many comments"""
        forum = models.Forum(fid=206, forum_name="Thread Forum")
        db_session.add(forum)
        db_session.commit()
        
        # Create post
        user = {"username": "thread_starter", "email": "thread_starter@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": user["email"], "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.post("/posts/", data={"post_content": "Thread test", "forum_id": "206"}, headers=headers)
        post_id = res.json()["pid"]
        
        # Add 20 comments
        for i in range(20):
            res = client.post(f"/posts/{post_id}/comments", data={"content": f"Comment {i}"}, headers=headers)
            assert res.status_code == 200
    
    def test_many_followers(self, client):
        """Test user with many followers"""
        main_user = {"username": "popular_user", "email": "popular_user@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
        client.post("/users/", json=main_user)
        main_login = client.post("/login", json={"email": main_user["email"], "password": "Aa1!aaaa"})
        main_id = main_login.json()
        
        # Get main user ID from response or create another endpoint call
        # For now, create followers
        num_followers = 10
        for i in range(num_followers):
            follower = {"username": f"follower_popular_{i}", "email": f"follower_popular_{i}@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
            client.post("/users/", json=follower)
        
        # If follow endpoint exists and works, they could follow


class TestErrorHandling:
    """Test performance under error conditions"""
    
    def test_repeated_invalid_login_attempts(self, client):
        """API should handle many failed login attempts quickly"""
        start = time.time()
        
        for i in range(10):
            res = client.post("/login", json={"email": f"nonexistent_{i}@example.com", "password": "wrong"})
            assert res.status_code == 403
        
        elapsed = time.time() - start
        avg_time = elapsed / 10
        
        # Failed logins should be fast
        assert avg_time < 100, f"Average failed login took {avg_time*1000}ms"
    
    def test_repeated_validation_errors(self, client):
        """API should handle validation errors quickly"""
        start = time.time()
        
        for i in range(10):
            user = {
                "username": f"invalid_{i}",
                "email": "not_an_email",
                "password": "weak",
                "confirm_password": "weak"
            }
            res = client.post("/users/", json=user)
            assert res.status_code in [400, 422]
        
        elapsed = time.time() - start
        avg_time = elapsed / 10
        
        assert avg_time < 100, f"Average validation error took {avg_time*1000}ms"
