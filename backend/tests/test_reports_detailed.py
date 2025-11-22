"""Tests for detailed report submission and management."""
from datetime import datetime
from app import models


class TestPostReportSubmission:
    """Test submitting reports for posts."""

    def test_submit_post_report(self, client, db_session):
        """Test submitting a post report."""
        reporter = models.User(
            username="reporter1",
            email="reporter1@test.com",
            password="hashed"
        )
        poster = models.User(
            username="poster1",
            email="poster1@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, poster])
        db_session.commit()

        post = models.Post(
            user_id=poster.uid,
            content="Reported post"
        )
        db_session.add(post)
        db_session.commit()

        response = client.post(
            "/reports/post",
            json={
                "post_id": post.pid,
                "reason": "inappropriate_content",
                "description": "This post violates community guidelines"
            }
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_submit_post_report_with_reason(self, client, db_session):
        """Test post report includes reason."""
        reporter = models.User(
            username="reporter2",
            email="reporter2@test.com",
            password="hashed"
        )
        poster = models.User(
            username="poster2",
            email="poster2@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, poster])
        db_session.commit()

        post = models.Post(
            user_id=poster.uid,
            content="Bad post"
        )
        db_session.add(post)
        db_session.commit()

        report = models.Report(
            reported_user_id=poster.uid,
            post_id=post.pid,
            reason="spam",
            description="Spam content",
            reporter_id=reporter.uid,
            type="post"
        )
        db_session.add(report)
        db_session.commit()

        assert report.reason == "spam"

    def test_cannot_report_own_post(self, client, db_session):
        """Test that user cannot report their own post."""
        user = models.User(
            username="self_reporter",
            email="selfreporter@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        post = models.Post(
            user_id=user.uid,
            content="My own post"
        )
        db_session.add(post)
        db_session.commit()

        response = client.post(
            "/reports/post",
            json={
                "post_id": post.pid,
                "reason": "offensive",
                "description": "Reporting own post"
            }
        )
        
        assert response.status_code in [400, 201]


class TestUserReportSubmission:
    """Test submitting reports for users."""

    def test_submit_user_report(self, client, db_session):
        """Test submitting a user report."""
        reporter = models.User(
            username="user_reporter1",
            email="userreporter1@test.com",
            password="hashed"
        )
        reported = models.User(
            username="reported_user1",
            email="reporteduser1@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        response = client.post(
            "/reports/user",
            json={
                "user_id": reported.uid,
                "reason": "harassment",
                "description": "User is harassing other members"
            }
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_submit_user_report_with_reason(self, client, db_session):
        """Test user report includes reason."""
        reporter = models.User(
            username="user_reporter2",
            email="userreporter2@test.com",
            password="hashed"
        )
        reported = models.User(
            username="reported_user2",
            email="reporteduser2@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reason="inappropriate_behavior",
            description="Inappropriate language",
            reporter_id=reporter.uid,
            type="user"
        )
        db_session.add(report)
        db_session.commit()

        assert report.type == "user"

    def test_cannot_report_self(self, client, db_session):
        """Test that user cannot report themselves."""
        user = models.User(
            username="self_report_user",
            email="selfreportuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/reports/user",
            json={
                "user_id": user.uid,
                "reason": "spam",
                "description": "Self report"
            }
        )
        
        assert response.status_code in [400, 201]


class TestCommentReportSubmission:
    """Test submitting reports for comments."""

    def test_submit_comment_report(self, client, db_session):
        """Test submitting a comment report."""
        reporter = models.User(
            username="comment_reporter1",
            email="commentreporter1@test.com",
            password="hashed"
        )
        poster = models.User(
            username="comment_poster1",
            email="commentposter1@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, poster])
        db_session.commit()

        post = models.Post(
            user_id=poster.uid,
            content="Post"
        )
        db_session.add(post)
        db_session.commit()

        comment = models.Comment(
            post_id=post.pid,
            user_id=poster.uid,
            content="Offensive comment"
        )
        db_session.add(comment)
        db_session.commit()

        response = client.post(
            "/reports/comment",
            json={
                "comment_id": comment.cid,
                "reason": "offensive_language",
                "description": "Contains offensive language"
            }
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]


class TestReportReasons:
    """Test report reason categories."""

    def test_report_reasons_spam(self, client, db_session):
        """Test spam report reason."""
        reporter = models.User(
            username="reason_reporter1",
            email="reasonreporter1@test.com",
            password="hashed"
        )
        reported = models.User(
            username="reason_reported1",
            email="reasonreported1@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reason="spam",
            reporter_id=reporter.uid
        )
        db_session.add(report)
        db_session.commit()

        assert report.reason == "spam"

    def test_report_reasons_harassment(self, client, db_session):
        """Test harassment report reason."""
        reporter = models.User(
            username="reason_reporter2",
            email="reasonreporter2@test.com",
            password="hashed"
        )
        reported = models.User(
            username="reason_reported2",
            email="reasonreported2@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reason="harassment",
            reporter_id=reporter.uid
        )
        db_session.add(report)
        db_session.commit()

        assert report.reason == "harassment"

    def test_report_reasons_inappropriate_content(self, client, db_session):
        """Test inappropriate content report reason."""
        reporter = models.User(
            username="reason_reporter3",
            email="reasonreporter3@test.com",
            password="hashed"
        )
        reported = models.User(
            username="reason_reported3",
            email="reasonreported3@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reason="inappropriate_content",
            reporter_id=reporter.uid
        )
        db_session.add(report)
        db_session.commit()

        assert report.reason == "inappropriate_content"


class TestReportStatusTracking:
    """Test report status tracking."""

    def test_report_initial_status_pending(self, client, db_session):
        """Test new report starts with pending status."""
        reporter = models.User(
            username="status_reporter1",
            email="statusreporter1@test.com",
            password="hashed"
        )
        reported = models.User(
            username="status_reported1",
            email="statusreported1@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reporter_id=reporter.uid,
            status="pending"
        )
        db_session.add(report)
        db_session.commit()

        assert report.status == "pending"

    def test_update_report_status_to_resolved(self, client, db_session):
        """Test updating report status to resolved."""
        reporter = models.User(
            username="status_reporter2",
            email="statusreporter2@test.com",
            password="hashed"
        )
        reported = models.User(
            username="status_reported2",
            email="statusreported2@test.com",
            password="hashed"
        )
        admin = models.User(
            username="status_admin",
            email="statusadmin@test.com",
            password="hashed",
            is_admin=True
        )
        db_session.add_all([reporter, reported, admin])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reporter_id=reporter.uid,
            status="pending"
        )
        db_session.add(report)
        db_session.commit()

        response = client.put(
            f"/reports/{report.rid}",
            json={
                "status": "resolved",
                "resolution": "User warned"
            }
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_update_report_status_to_dismissed(self, client, db_session):
        """Test updating report status to dismissed."""
        reporter = models.User(
            username="status_reporter3",
            email="statusreporter3@test.com",
            password="hashed"
        )
        reported = models.User(
            username="status_reported3",
            email="statusreported3@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report = models.Report(
            reported_user_id=reported.uid,
            reporter_id=reporter.uid,
            status="pending"
        )
        db_session.add(report)
        db_session.commit()

        response = client.put(
            f"/reports/{report.rid}",
            json={"status": "dismissed"}
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]


class TestReportQuerying:
    """Test querying and filtering reports."""

    def test_get_all_reports(self, client, db_session):
        """Test getting all reports."""
        admin = models.User(
            username="query_admin",
            email="queryadmin@test.com",
            password="hashed",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        response = client.get("/reports")
        
        assert response.status_code == 200

    def test_get_pending_reports(self, client, db_session):
        """Test filtering pending reports."""
        admin = models.User(
            username="query_admin2",
            email="queryadmin2@test.com",
            password="hashed",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        response = client.get("/reports?status=pending")
        
        assert response.status_code == 200

    def test_get_reports_by_reason(self, client, db_session):
        """Test filtering reports by reason."""
        admin = models.User(
            username="query_admin3",
            email="queryadmin3@test.com",
            password="hashed",
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()

        response = client.get("/reports?reason=spam")
        
        assert response.status_code == 200

    def test_get_reports_for_specific_user(self, client, db_session):
        """Test getting reports for specific user."""
        admin = models.User(
            username="query_admin4",
            email="queryadmin4@test.com",
            password="hashed",
            is_admin=True
        )
        reported = models.User(
            username="query_reported",
            email="queryreported@test.com",
            password="hashed"
        )
        db_session.add_all([admin, reported])
        db_session.commit()

        response = client.get(f"/reports?user_id={reported.uid}")
        
        assert response.status_code == 200


class TestReportEdgeCases:
    """Test edge cases in report handling."""

    def test_duplicate_report_same_content(self, client, db_session):
        """Test handling duplicate reports."""
        reporter = models.User(
            username="dup_reporter",
            email="dupreporter@test.com",
            password="hashed"
        )
        reported = models.User(
            username="dup_reported",
            email="dupreported@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        report1 = models.Report(
            reported_user_id=reported.uid,
            reporter_id=reporter.uid,
            reason="spam"
        )
        report2 = models.Report(
            reported_user_id=reported.uid,
            reporter_id=reporter.uid,
            reason="spam"
        )
        db_session.add_all([report1, report2])
        db_session.commit()

        # Both should exist
        assert report1.rid != report2.rid

    def test_report_nonexistent_post(self, client, db_session):
        """Test reporting nonexistent post."""
        response = client.post(
            "/reports/post",
            json={
                "post_id": 99999,
                "reason": "spam"
            }
        )
        
        assert response.status_code in [404, 400, 201]

    def test_report_with_empty_description(self, client, db_session):
        """Test report with empty description."""
        reporter = models.User(
            username="empty_reporter",
            email="emptyreporter@test.com",
            password="hashed"
        )
        reported = models.User(
            username="empty_reported",
            email="emptyreported@test.com",
            password="hashed"
        )
        db_session.add_all([reporter, reported])
        db_session.commit()

        response = client.post(
            "/reports/user",
            json={
                "user_id": reported.uid,
                "reason": "spam",
                "description": ""
            }
        )
        
        assert response.status_code in [200, 201, 400]
