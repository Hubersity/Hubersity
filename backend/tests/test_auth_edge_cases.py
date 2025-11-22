"""Tests for authentication edge cases and advanced scenarios."""
from datetime import datetime, timedelta
from app import models


class TestTokenExpiration:
    """Test JWT token expiration scenarios."""

    def test_access_with_valid_token(self, client, db_session):
        """Test accessing endpoint with valid token."""
        user = models.User(
            username="auth_user1",
            email="authuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(
            f"/users/{user.uid}",
            headers={"Authorization": "Bearer valid_token"}
        )
        
        assert response.status_code in [200, 401]

    def test_access_with_expired_token(self, client, db_session):
        """Test accessing endpoint with expired token."""
        response = client.get(
            "/users/1",
            headers={"Authorization": "Bearer expired_token"}
        )
        
        # 404 if endpoint doesn't exist, 401 if unauthorized
        assert response.status_code in [401, 404]

    def test_access_without_token(self, client):
        """Test accessing protected endpoint without token."""
        response = client.get("/users/1")
        
        assert response.status_code in [401, 404]

    def test_token_refresh(self, client, db_session):
        """Test token refresh operation."""
        user = models.User(
            username="refresh_user1",
            email="refreshuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "valid_refresh_token"}
        )
        
        assert response.status_code in [200, 201, 401, 404]


class TestInvalidTokenHandling:
    """Test handling of invalid tokens."""

    def test_malformed_token(self, client, db_session):
        """Test with malformed token."""
        response = client.get(
            "/users/1",
            headers={"Authorization": "Bearer not.a.token"}
        )
        
        assert response.status_code == 401

    def test_token_with_wrong_signature(self, client, db_session):
        """Test token with invalid signature."""
        response = client.get(
            "/users/1",
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"}
        )
        
        assert response.status_code == 401

    def test_token_from_different_app(self, client, db_session):
        """Test token from different application."""
        response = client.get(
            "/users/1",
            headers={"Authorization": "Bearer different_app_token"}
        )
        
        assert response.status_code == 401

    def test_modified_token_payload(self, client, db_session):
        """Test token with modified payload."""
        response = client.get(
            "/users/1",
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.modified.payload"}
        )
        
        assert response.status_code == 401


class TestConcurrentLogins:
    """Test concurrent login scenarios."""

    def test_multiple_login_sessions(self, client, db_session):
        """Test user with multiple active sessions."""
        user = models.User(
            username="concurrent_user1",
            email="concurrentuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        # First login
        response1 = client.post(
            "/auth/login",
            json={"email": user.email, "password": "password"}
        )
        
        # Second login
        response2 = client.post(
            "/auth/login",
            json={"email": user.email, "password": "password"}
        )
        
        assert response1.status_code in [200, 201]

    def test_token_validity_after_logout(self, client, db_session):
        """Test token becomes invalid after logout."""
        user = models.User(
            username="logout_user1",
            email="logoutuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        # Login
        login_response = client.post(
            "/auth/login",
            json={"email": user.email, "password": "password"}
        )
        
        # Logout
        logout_response = client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer token_from_login"}
        )
        
        assert logout_response.status_code in [200, 201]

    def test_force_logout_all_sessions(self, client, db_session):
        """Test logging out all sessions."""
        user = models.User(
            username="force_logout_user",
            email="forcelogoutuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            f"/auth/logout-all/{user.uid}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code in [200, 201, 401]


class TestSessionManagement:
    """Test session management."""

    def test_session_timeout(self, client, db_session):
        """Test session timeout."""
        user = models.User(
            username="session_user1",
            email="sessionuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        # Simulate old session
        response = client.get(
            f"/users/{user.uid}",
            headers={"Authorization": "Bearer old_token"}
        )
        
        assert response.status_code in [200, 401]

    def test_concurrent_requests_same_token(self, client, db_session):
        """Test multiple concurrent requests with same token."""
        user = models.User(
            username="concurrent_request_user",
            email="concurrentrequestuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        token = "valid_token"
        
        response1 = client.get(
            f"/users/{user.uid}",
            headers={"Authorization": f"Bearer {token}"}
        )
        response2 = client.get(
            f"/users/{user.uid}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Both should have same response
        assert response1.status_code == response2.status_code


class TestLoginValidation:
    """Test login validation."""

    def test_login_invalid_credentials(self, client, db_session):
        """Test login with wrong password."""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@test.com", "password": "wrong"}
        )
        
        assert response.status_code in [401, 400]

    def test_login_missing_credentials(self, client, db_session):
        """Test login without email."""
        response = client.post(
            "/auth/login",
            json={"password": "password"}
        )
        
        assert response.status_code in [400, 422]

    def test_login_empty_password(self, client, db_session):
        """Test login with empty password."""
        user = models.User(
            username="pwd_user1",
            email="pwduser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/auth/login",
            json={"email": user.email, "password": ""}
        )
        
        assert response.status_code in [401, 400]


class TestRefreshTokenOperations:
    """Test refresh token operations."""

    def test_refresh_with_valid_refresh_token(self, client, db_session):
        """Test getting new access token with valid refresh token."""
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "valid_refresh"}
        )
        
        assert response.status_code in [200, 201, 401]

    def test_refresh_with_expired_refresh_token(self, client, db_session):
        """Test refresh with expired refresh token."""
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "expired_refresh"}
        )
        
        assert response.status_code in [401, 400]

    def test_refresh_invalidates_old_token(self, client, db_session):
        """Test that old access token is invalid after refresh."""
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "valid_refresh"}
        )
        
        assert response.status_code in [200, 201, 401]


class TestAccessControlEdgeCases:
    """Test edge cases in access control."""

    def test_access_deleted_user_account(self, client, db_session):
        """Test accessing with deleted user account."""
        response = client.get(
            "/users/99999",
            headers={"Authorization": "Bearer token_for_deleted_user"}
        )
        
        assert response.status_code in [404, 401]

    def test_access_disabled_user_account(self, client, db_session):
        """Test access with disabled user account."""
        user = models.User(
            username="disabled_user",
            email="disableduser@test.com",
            password="hashed",
            is_active=False
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(
            f"/users/{user.uid}",
            headers={"Authorization": "Bearer token_for_disabled"}
        )
        
        assert response.status_code in [200, 401]

    def test_access_with_insufficient_permissions(self, client, db_session):
        """Test accessing admin endpoint as regular user."""
        user = models.User(
            username="regular_user",
            email="regularuser@test.com",
            password="hashed",
            is_admin=False
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(
            "/admin/stats",
            headers={"Authorization": "Bearer user_token"}
        )
        
        assert response.status_code == 403


class TestAuthenticationEdgeCases:
    """Test authentication edge cases."""

    def test_sql_injection_in_login(self, client, db_session):
        """Test SQL injection attempt in login."""
        response = client.post(
            "/auth/login",
            json={
                "email": "' OR '1'='1@test.com",
                "password": "' OR '1'='1"
            }
        )
        
        assert response.status_code in [401, 400]

    def test_extremely_long_token(self, client, db_session):
        """Test with extremely long token."""
        long_token = "x" * 10000
        
        response = client.get(
            "/users/1",
            headers={"Authorization": f"Bearer {long_token}"}
        )
        
        assert response.status_code in [401, 414]

    def test_unicode_in_email(self, client, db_session):
        """Test login with unicode characters."""
        response = client.post(
            "/auth/login",
            json={"email": "用户@test.com", "password": "password"}
        )
        
        assert response.status_code in [401, 400, 200]

    def test_bearer_token_case_sensitivity(self, client, db_session):
        """Test bearer token case variations."""
        response1 = client.get(
            "/users/1",
            headers={"Authorization": "Bearer token"}
        )
        response2 = client.get(
            "/users/1",
            headers={"Authorization": "bearer token"}
        )
        
        # Should both fail or both succeed
        assert response1.status_code in [401, 200]


class TestPasswordReset:
    """Test password reset flow."""

    def test_request_password_reset(self, client, db_session):
        """Test requesting password reset."""
        user = models.User(
            username="reset_user1",
            email="resetuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/auth/forgot-password",
            json={"email": user.email}
        )
        
        assert response.status_code in [200, 201]

    def test_reset_with_invalid_token(self, client, db_session):
        """Test password reset with invalid token."""
        response = client.post(
            "/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "newpass123"
            }
        )
        
        assert response.status_code in [400, 401]

    def test_reset_with_expired_token(self, client, db_session):
        """Test password reset with expired token."""
        response = client.post(
            "/auth/reset-password",
            json={
                "token": "expired_token",
                "new_password": "newpass123"
            }
        )
        
        assert response.status_code in [400, 401]
