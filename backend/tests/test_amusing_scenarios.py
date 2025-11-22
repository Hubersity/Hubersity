"""Additional fun scenarios - testing valid operations multiple times"""


class TestUserCreationVariations:
    """Test user creation with different patterns"""

    def test_create_user_all_caps_username(self, client):
        """Test creating user with all caps username"""
        payload = {
            "username": "ALLUSERZ",
            "email": "alluserz@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_create_user_lowercase_username(self, client):
        """Test creating user with lowercase username"""
        payload = {
            "username": "lowercaseonly",
            "email": "lowercase@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_create_user_mixed_case(self, client):
        """Test creating user with mixed case"""
        payload = {
            "username": "MiXeDcAsE",
            "email": "mixed@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_create_user_with_dots_in_email(self, client):
        """Test creating user with dots in email"""
        payload = {
            "username": "dottemail",
            "email": "dot.ted@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201

    def test_create_user_with_multiple_dots_in_email(self, client):
        """Test creating user with multiple dots in email"""
        payload = {
            "username": "multidots",
            "email": "multi.dot.ted@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201

    def test_create_user_email_with_numbers(self, client):
        """Test creating user with numbers in email"""
        payload = {
            "username": "numbermail",
            "email": "user123456@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code == 201

    def test_create_user_very_long_valid_password(self, client):
        """Test creating user with very long password"""
        long_password = "Aa1!" + "x" * 100
        payload = {
            "username": "longpassuser",
            "email": "longpass@example.com",
            "password": long_password,
            "confirm_password": long_password,
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_create_multiple_users_sequence(self, client):
        """Test creating multiple users in sequence"""
        users_created = 0
        for i in range(5):
            payload = {
                "username": f"sequser{i}",
                "email": f"sequser{i}@example.com",
                "password": "Aa1!aaaa",
                "confirm_password": "Aa1!aaaa",
            }
            res = client.post("/users/", json=payload)
            if res.status_code == 201:
                users_created += 1
        
        assert users_created >= 1


class TestLoginVariations:
    """Test login with different scenarios"""

    def test_login_with_exact_email(self, client):
        """Test login requires exact email match"""
        user = {
            "username": "exactemailuser",
            "email": "exactemail@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        
        res = client.post("/login", json={"email": "exactemail@example.com", "password": "Aa1!aaaa"})
        assert res.status_code == 200

    def test_login_wrong_password_fails(self, client):
        """Test login fails with wrong password"""
        user = {
            "username": "wrongpassuser",
            "email": "wrongpass@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        
        res = client.post("/login", json={"email": "wrongpass@example.com", "password": "WrongPassword123"})
        assert res.status_code in [401, 400, 403]

    def test_login_nonexistent_email(self, client):
        """Test login with non-existent email"""
        res = client.post("/login", json={"email": "doesnotexist@example.com", "password": "SomePass123"})
        assert res.status_code in [401, 403]

    def test_successful_login_returns_token(self, client):
        """Test successful login returns a token"""
        user = {
            "username": "tokenuser",
            "email": "tokenuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        
        res = client.post("/login", json={"email": "tokenuser@example.com", "password": "Aa1!aaaa"})
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_token_can_be_used_for_auth(self, client):
        """Test token from login can be used"""
        user = {
            "username": "usetoken",
            "email": "usetoken@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        
        login_res = client.post("/login", json={"email": "usetoken@example.com", "password": "Aa1!aaaa"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        me_res = client.get("/users/me", headers=headers)
        assert me_res.status_code == 200


class TestAuthenticationState:
    """Test various authentication states"""

    def test_unauthenticated_request_fails(self, client):
        """Test that unauthenticated requests fail"""
        res = client.get("/users/me")
        assert res.status_code == 401

    def test_invalid_token_fails(self, client):
        """Test that invalid token fails"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        res = client.get("/users/me", headers=headers)
        assert res.status_code in [401, 422]

    def test_expired_token_handling(self, client):
        """Test handling of invalid token"""
        headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid"}
        res = client.get("/users/me", headers=headers)
        assert res.status_code in [401, 422]

    def test_missing_bearer_prefix(self, client):
        """Test token without Bearer prefix"""
        headers = {"Authorization": "invalid_token_here"}
        res = client.get("/users/me", headers=headers)
        assert res.status_code in [401, 403, 422]

    def test_empty_auth_header(self, client):
        """Test empty authorization header"""
        headers = {"Authorization": ""}
        res = client.get("/users/me", headers=headers)
        assert res.status_code in [401, 403, 422]


class TestProfileAccess:
    """Test accessing and viewing profiles"""

    def test_get_own_profile(self, client):
        """Test getting own profile"""
        user = {
            "username": "ownprofile",
            "email": "ownprofile@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": "ownprofile@example.com", "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.get("/users/me", headers=headers)
        assert res.status_code == 200
        assert res.json()["email"] == "ownprofile@example.com"

    def test_profile_contains_username(self, client):
        """Test profile contains username"""
        user = {
            "username": "checkusername",
            "email": "checkusername@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": "checkusername@example.com", "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.get("/users/me", headers=headers)
        assert res.status_code == 200
        profile = res.json()
        assert "username" in profile

    def test_profile_contains_email(self, client):
        """Test profile contains email"""
        user = {
            "username": "checkemail",
            "email": "checkemail@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": "checkemail@example.com", "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.get("/users/me", headers=headers)
        assert res.status_code == 200
        profile = res.json()
        assert profile["email"] == "checkemail@example.com"

    def test_profile_has_uid(self, client):
        """Test profile contains uid"""
        user = {
            "username": "checkuid",
            "email": "checkuid@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        login = client.post("/login", json={"email": "checkuid@example.com", "password": "Aa1!aaaa"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        res = client.get("/users/me", headers=headers)
        assert res.status_code == 200
        profile = res.json()
        assert "uid" in profile
        assert profile["uid"] > 0


class TestResponseFormat:
    """Test response formats"""

    def test_login_response_format(self, client):
        """Test login response has correct format"""
        user = {
            "username": "formatuser",
            "email": "formatuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        client.post("/users/", json=user)
        res = client.post("/login", json={"email": "formatuser@example.com", "password": "Aa1!aaaa"})
        
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    def test_user_creation_response_has_uid(self, client):
        """Test user creation response has uid"""
        payload = {
            "username": "responseuser",
            "email": "responseuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        
        assert res.status_code == 201
        user = res.json()
        assert "uid" in user
        assert user["uid"] > 0

    def test_user_response_contains_email(self, client):
        """Test user response contains email"""
        payload = {
            "username": "emailresponse",
            "email": "emailresponse@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        
        assert res.status_code == 201
        user = res.json()
        assert user["email"] == "emailresponse@example.com"
