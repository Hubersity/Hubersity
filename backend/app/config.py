GOOGLE_CLIENT_ID = "723891200198-cmvhl1u69f30t2ch6sisdjo1noc63b93.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"

GOOGLE_AUTH_URL = (
    "https://accounts.google.com/o/oauth2/v2/auth"
    "?response_type=code"
    f"&client_id={GOOGLE_CLIENT_ID}"
    f"&redirect_uri={GOOGLE_REDIRECT_URI}"
    "&scope=openid%20email%20profile"
)
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
