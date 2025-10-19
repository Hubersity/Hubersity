import io
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_current_user():
    return MagicMock(uid=1, username="testuser")

@pytest.fixture
def mock_db():
    """Mock DB session dependency."""
    return MagicMock()

# ---------- CREATE POST ----------

def test_create_post_success(monkeypatch, mock_current_user, mock_db):
    """✅ Should create a post successfully."""
    mock_post = MagicMock(pid=1, post_content="Hello World", forum_id=1, user_id=1)
    mock_post.tags = []
    mock_post.images = []
    mock_post.comments = []

    mock_db.add.return_value = None
    mock_db.commit.return_value = None
    mock_db.refresh.side_effect = lambda x: None

    monkeypatch.setattr("app.routers.posts.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.posts.oauth2.get_current_user", lambda: mock_current_user)
    monkeypatch.setattr("app.routers.posts.models.Post", lambda **kwargs: mock_post)
    monkeypatch.setattr("app.routers.posts.os.makedirs", lambda *a, **k: None)
    monkeypatch.setattr("app.routers.posts.shutil.copyfileobj", lambda src, dst: None)

    response = client.post(
        "/posts/",
        data={"post_content": "Hello World", "forum_id": 1},
        files=[("files", ("test.png", io.BytesIO(b"fakeimage"), "image/png"))],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["post_content"] == "Hello World"
    assert data["forum_id"] == 1
    assert data["user_id"] == 1

# ---------- GET POST ----------

def test_get_post_not_found(monkeypatch, mock_current_user, mock_db):
    mock_db.query().filter().first.return_value = None
    monkeypatch.setattr("app.routers.posts.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.posts.oauth2.get_current_user", lambda: mock_current_user)

    response = client.get("/posts/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"

# ---------- LIKE POST ----------

def test_like_post_success(monkeypatch, mock_current_user, mock_db):
    mock_post = MagicMock(pid=1)
    mock_db.query().filter().first.side_effect = [mock_post, None]
    monkeypatch.setattr("app.routers.posts.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.posts.oauth2.get_current_user", lambda: mock_current_user)
    monkeypatch.setattr("app.routers.posts.models.Like", lambda **kw: MagicMock())

    response = client.post("/posts/1/like")
    assert response.status_code == 200
    assert response.json()["message"] == "Post liked successfully"

def test_like_post_already_liked(monkeypatch, mock_current_user, mock_db):
    mock_post = MagicMock(pid=1)
    mock_like = MagicMock()
    mock_db.query().filter_by().first.side_effect = [mock_like]
    mock_db.query().filter().first.return_value = mock_post

    monkeypatch.setattr("app.routers.posts.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.posts.oauth2.get_current_user", lambda: mock_current_user)

    response = client.post("/posts/1/like")
    assert response.status_code == 200
    assert response.json()["message"] == "Like removed"
