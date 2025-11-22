import os
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
import sqlite3
import datetime as _dt
from datetime import timezone
import shutil
import glob

# Ensure app import doesn't attempt DB init during tests
os.environ.setdefault("SKIP_DB_INIT", "1")

from app.database import Base, get_db
# ensure models are imported so they are registered on Base.metadata
from app import models  # noqa: F401
from app.main import app
from fastapi.testclient import TestClient

# Use an in-memory SQLite database for fast, isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"
# Use StaticPool so the same in-memory database is used across threads/connections
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def create_test_db():
    # register a 'now' function for SQLite so server_default(text('now()')) works
    def _sqlite_now(conn, record):
        if isinstance(conn, sqlite3.Connection):
            # use timezone-aware UTC ISO timestamp
            conn.create_function("now", 0, lambda: _dt.datetime.now(timezone.utc).isoformat())
            # provide a no-op 'timezone' function so Postgres-style timezone(...) SQL doesn't fail in SQLite tests
            # timezone(tz, ts) -> return ts unchanged
            conn.create_function("timezone", 2, lambda tz, ts: ts)

    event.listen(engine, "connect", _sqlite_now)

    # create tables once per test session
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture()
def client(db_session):
    # override the get_db dependency to use the in-memory session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def cleanup_uploads():
    """Remove files created under `uploads/` (post/user) after each test to keep workspace clean."""
    yield
    # running directory is backend/ when tests are executed
    cwd = os.getcwd()
    # common upload directories
    paths = [
        os.path.join(cwd, "uploads"),
        os.path.join(cwd, "uploads", "post"),
        os.path.join(cwd, "uploads", "user"),
        # absolute app uploads that may be created by app
        os.path.join(os.sep, "app", "uploads"),
    ]

    for p in paths:
        if os.path.exists(p):
            # remove files but keep directory structure
            for f in glob.glob(os.path.join(p, "**"), recursive=True):
                try:
                    if os.path.isfile(f) or os.path.islink(f):
                        os.remove(f)
                    elif os.path.isdir(f) and f not in (p,):
                        # remove empty directories created under p
                        try:
                            shutil.rmtree(f)
                        except Exception:
                            pass
                except Exception:
                    pass
