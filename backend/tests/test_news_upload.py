"""Tests for news_upload router (image upload functionality)."""
from io import BytesIO
from app import models


class TestNewsImageUpload:
    """Test news image upload endpoint."""

    def test_upload_news_image_success(self, client, db_session):
        """Test successful image upload to existing news."""
        admin = models.User(
            username="admin_uploader",
            email="admin@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News",
            detail="Content",
            created_by=admin.uid,
            is_published=True
        )
        db_session.add(news)
        db_session.commit()

        image_data = BytesIO(b"fake PNG image data")
        image_data.name = "test.png"

        response = client.post(
            f"/news/{news.id}/upload-image",
            files={"file": ("test.png", image_data, "image/png")}
        )

        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["id"] == news.id
        assert "/uploads/news/" in data["image_url"]

    def test_upload_news_image_not_found(self, client):
        """Test upload to non-existent news returns 404."""
        image_data = BytesIO(b"fake image")
        image_data.name = "test.png"

        response = client.post(
            "/news/99999/upload-image",
            files={"file": ("test.png", image_data, "image/png")}
        )

        assert response.status_code == 404
        assert "News not found" in response.json()["detail"]

    def test_upload_news_image_multiple_formats(self, client, db_session):
        """Test uploading different image formats."""
        admin = models.User(
            username="admin_formats",
            email="admin_formats@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        formats = [
            ("test1.jpg", "image/jpeg"),
            ("test2.gif", "image/gif"),
            ("test3.webp", "image/webp"),
        ]

        for filename, mime_type in formats:
            news = models.News(
                title=f"News {filename}",
                detail="Content",
                created_by=admin.uid,
                is_published=True
            )
            db_session.add(news)
            db_session.commit()

            image_data = BytesIO(b"fake image")
            image_data.name = filename

            response = client.post(
                f"/news/{news.id}/upload-image",
                files={"file": (filename, image_data, mime_type)}
            )

            assert response.status_code == 200

    def test_upload_news_image_overwrites_existing(self, client, db_session):
        """Test uploading new image overwrites old image_url."""
        admin = models.User(
            username="admin_overwrite",
            email="admin_overwrite@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News Overwrite",
            detail="Content",
            created_by=admin.uid,
            is_published=True,
            image_url="/uploads/news/old/old_image.png"
        )
        db_session.add(news)
        db_session.commit()
        old_image_url = news.image_url

        image_data = BytesIO(b"new image data")
        image_data.name = "new_image.png"

        response = client.post(
            f"/news/{news.id}/upload-image",
            files={"file": ("new_image.png", image_data, "image/png")}
        )

        assert response.status_code == 200
        new_image_url = response.json()["image_url"]
        assert new_image_url != old_image_url

    def test_upload_news_image_empty_file(self, client, db_session):
        """Test uploading empty file."""
        admin = models.User(
            username="admin_empty",
            email="admin_empty@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News Empty",
            detail="Content",
            created_by=admin.uid,
            is_published=True
        )
        db_session.add(news)
        db_session.commit()

        image_data = BytesIO(b"")
        image_data.name = "empty.png"

        response = client.post(
            f"/news/{news.id}/upload-image",
            files={"file": ("empty.png", image_data, "image/png")}
        )

        assert response.status_code == 200

    def test_upload_news_image_special_characters_filename(self, client, db_session):
        """Test filename with special characters."""
        admin = models.User(
            username="admin_special",
            email="admin_special@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News Special",
            detail="Content",
            created_by=admin.uid,
            is_published=True
        )
        db_session.add(news)
        db_session.commit()

        image_data = BytesIO(b"image data")
        image_data.name = "test@#$%.png"

        response = client.post(
            f"/news/{news.id}/upload-image",
            files={"file": ("test@#$%.png", image_data, "image/png")}
        )

        assert response.status_code == 200

    def test_upload_news_image_sequential_uploads(self, client, db_session):
        """Test multiple sequential uploads to same news."""
        admin = models.User(
            username="admin_multi",
            email="admin_multi@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News Multi",
            detail="Content",
            created_by=admin.uid,
            is_published=True
        )
        db_session.add(news)
        db_session.commit()

        urls = []
        for i in range(3):
            image_data = BytesIO(f"image data {i}".encode())
            image_data.name = f"test{i}.png"

            response = client.post(
                f"/news/{news.id}/upload-image",
                files={"file": (f"test{i}.png", image_data, "image/png")}
            )

            assert response.status_code == 200
            urls.append(response.json()["image_url"])

        assert len(set(urls)) == 3

    def test_upload_news_image_non_image_files(self, client, db_session):
        """Test uploading non-image files."""
        admin = models.User(
            username="admin_pdf",
            email="admin_pdf@upload.com",
            password="hashed_pwd",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        news = models.News(
            title="Test News PDF",
            detail="Content",
            created_by=admin.uid,
            is_published=True
        )
        db_session.add(news)
        db_session.commit()

        pdf_data = BytesIO(b"PDF content")
        pdf_data.name = "document.pdf"

        response = client.post(
            f"/news/{news.id}/upload-image",
            files={"file": ("document.pdf", pdf_data, "application/pdf")}
        )

        assert response.status_code == 200
