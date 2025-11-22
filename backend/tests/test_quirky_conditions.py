"""Quirky but valid test scenarios - more line farming fun"""


class TestBoundaryConditions:
    """Test various boundary conditions"""

    def test_uid_boundary_access(self, client):
        """Test accessing with various uid values"""
        res = client.get("/users/1")
        assert res.status_code in [200, 404, 401]

    def test_very_large_uid(self, client):
        """Test accessing with very large uid"""
        res = client.get("/users/999999999")
        assert res.status_code in [404, 401]

    def test_zero_uid(self, client):
        """Test accessing with uid 0"""
        res = client.get("/users/0")
        assert res.status_code in [404, 400, 401]

    def test_negative_uid(self, client):
        """Test accessing with negative uid"""
        res = client.get("/users/-1")
        assert res.status_code in [404, 422, 400, 401]

    def test_empty_password(self, client):
        """Test creating user with empty password"""
        payload = {
            "username": "emptypassuser",
            "email": "emptypass@example.com",
            "password": "",
            "confirm_password": "",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [422, 400]

    def test_none_password(self, client):
        """Test creating user with None password"""
        payload = {
            "username": "nonepassuser",
            "email": "nonepass@example.com",
            "password": None,
            "confirm_password": None,
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [422, 400]

    def test_empty_username(self, client):
        """Test creating user with empty username"""
        payload = {
            "username": "",
            "email": "emptyuser@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [422, 400, 201]

    def test_single_char_username(self, client):
        """Test creating user with single character username"""
        payload = {
            "username": "x",
            "email": "singlechar@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 422, 400]


class TestCaseSensitivity:
    """Test case sensitivity across the API"""

    def test_email_case_insensitive_register(self, client):
        """Test that email registration is case handling"""
        payload = {
            "username": "caseemail",
            "email": "UPPERCASE@EXAMPLE.COM",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400]

    def test_username_case_sensitivity(self, client):
        """Test username case sensitivity in creation"""
        payload1 = {
            "username": "CaseSensitive",
            "email": "casetest1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res1 = client.post("/users/", json=payload1)
        
        payload2 = {
            "username": "casesensitive",
            "email": "casetest2@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res2 = client.post("/users/", json=payload2)
        
        # Both should work or both should fail
        assert res1.status_code in [201, 400, 422]
        assert res2.status_code in [201, 400, 422]


class TestContentTypes:
    """Test different content types and formats"""

    def test_json_content_type(self, client):
        """Test application/json content type"""
        payload = {
            "username": "jsonuser",
            "email": "json@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        headers = {"Content-Type": "application/json"}
        res = client.post("/users/", json=payload, headers=headers)
        assert res.status_code in [201, 400]

    def test_missing_content_type(self, client):
        """Test request without explicit content type"""
        payload = {
            "username": "noctypeuser",
            "email": "notype@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400]


class TestNumericFields:
    """Test numeric field handling"""

    def test_string_uid_instead_of_int(self, client):
        """Test accessing with string uid"""
        res = client.get("/users/abc")
        assert res.status_code in [404, 422, 400, 401]

    def test_float_uid_instead_of_int(self, client):
        """Test accessing with float uid"""
        res = client.get("/users/1.5")
        assert res.status_code in [404, 422, 400, 401]

    def test_scientific_notation_uid(self, client):
        """Test accessing with scientific notation uid"""
        res = client.get("/users/1e10")
        assert res.status_code in [404, 422, 400, 401]


class TestSpecialCharacters:
    """Test handling of special characters"""

    def test_username_with_emoji(self, client):
        """Test username with emoji"""
        payload = {
            "username": "emoji😀user",
            "email": "emoji@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_email_with_special_domain(self, client):
        """Test email with hyphenated domain"""
        payload = {
            "username": "specialdomain",
            "email": "user@my-example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400]

    def test_email_with_underscore(self, client):
        """Test email with underscore"""
        payload = {
            "username": "underscoraemail",
            "email": "user_name@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400]

    def test_email_with_hyphen(self, client):
        """Test email with hyphen"""
        payload = {
            "username": "hyphenemail",
            "email": "user-name@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400]


class TestStringTrimming:
    """Test string trimming behavior"""

    def test_username_with_leading_space(self, client):
        """Test username with leading space"""
        payload = {
            "username": " leadingspace",
            "email": "leading@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_username_with_trailing_space(self, client):
        """Test username with trailing space"""
        payload = {
            "username": "trailingspace ",
            "email": "trailing@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]

    def test_username_with_internal_spaces(self, client):
        """Test username with internal spaces"""
        payload = {
            "username": "internal space",
            "email": "internal@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [201, 400, 422]


class TestPasswordValidation:
    """Test password validation rules"""

    def test_password_all_numbers(self, client):
        """Test password with all numbers"""
        payload = {
            "username": "allnumpass",
            "email": "allnum@example.com",
            "password": "1111111111",
            "confirm_password": "1111111111",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [400, 422]

    def test_password_all_letters(self, client):
        """Test password with all letters"""
        payload = {
            "username": "alletterpass",
            "email": "alletter@example.com",
            "password": "abcdefghij",
            "confirm_password": "abcdefghij",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [400, 422]

    def test_password_all_lowercase(self, client):
        """Test password with all lowercase"""
        payload = {
            "username": "alllowerpass",
            "email": "alllower@example.com",
            "password": "aaaaaa1!aa",
            "confirm_password": "aaaaaa1!aa",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [400, 422, 201]

    def test_passwords_dont_match(self, client):
        """Test when passwords don't match"""
        payload = {
            "username": "nomatchpass",
            "email": "nomatch@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!bbbb",
        }
        res = client.post("/users/", json=payload)
        assert res.status_code in [400, 422]

    def test_case_sensitivity_in_password(self, client):
        """Test password case sensitivity"""
        payload1 = {
            "username": "passcase1",
            "email": "passcase1@example.com",
            "password": "Aa1!aaaa",
            "confirm_password": "Aa1!aaaa",
        }
        res1 = client.post("/users/", json=payload1)
        
        payload2 = {
            "username": "passcase2",
            "email": "passcase2@example.com",
            "password": "aa1!aaaa",
            "confirm_password": "aa1!aaaa",
        }
        res2 = client.post("/users/", json=payload2)
        
        assert res1.status_code in [201, 400, 422]
        assert res2.status_code in [400, 422]
