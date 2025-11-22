from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")  # default to 5432
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "hubersity")

JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
API_PORT = os.getenv("API_PORT", "8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", "uploads")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

GOOGLE_AUTH_URL = os.getenv("GOOGLE_AUTH_URL", "https://accounts.google.com/o/oauth2/v2/auth")
GOOGLE_TOKEN_URL = os.getenv("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com/token")
GOOGLE_USERINFO_URL = os.getenv("GOOGLE_USERINFO_URL", "https://www.googleapis.com/oauth2/v3/userinfo")

FULL_GOOGLE_AUTH_URL = (
    f"{GOOGLE_AUTH_URL}"
    f"?response_type=code"
    f"&client_id={GOOGLE_CLIENT_ID}"
    f"&redirect_uri={GOOGLE_REDIRECT_URI}"
    "&scope=openid%20email%20profile"
)
