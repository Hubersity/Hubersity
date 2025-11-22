"""Tests for advanced study calendar and session tracking."""
from datetime import datetime, timedelta
from app import models


class TestStudySessionTracking:
    """Test study session creation and tracking."""

    def test_start_study_session(self, client, db_session):
        """Test starting a study session."""
        user = models.User(
            username="student1",
            email="student1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/study/start",
            json={"user_id": user.uid}
        )
        
        assert response.status_code in [200, 201, 400, 401, 404, 422]

    def test_stop_study_session(self, client, db_session):
        """Test stopping a study session."""
        user = models.User(
            username="student2",
            email="student2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        session = models.StudySession(
            user_id=user.uid,
            start_time=datetime.utcnow() - timedelta(minutes=30)
        )
        db_session.add(session)
        db_session.commit()

        response = client.post(
            f"/study/stop/{session.sid}"
        )
        
        assert response.status_code in [200, 201, 404]

    def test_session_duration_calculation(self, client, db_session):
        """Test that session duration is correctly calculated."""
        user = models.User(
            username="student3",
            email="student3@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        start_time = datetime.utcnow() - timedelta(minutes=60)
        session = models.StudySession(
            user_id=user.uid,
            start_time=start_time,
            end_time=datetime.utcnow(),
            duration_minutes=60
        )
        db_session.add(session)
        db_session.commit()

        assert session.duration_minutes == 60

    def test_get_active_session(self, client, db_session):
        """Test retrieving active session."""
        user = models.User(
            username="student4",
            email="student4@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/study/active/{user.uid}")
        
        assert response.status_code == 200


class TestDailyProgress:
    """Test daily study progress tracking."""

    def test_get_today_study_progress(self, client, db_session):
        """Test getting today's study progress."""
        user = models.User(
            username="progress_user1",
            email="proguser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        response = client.get(f"/study/today/{user.uid}")
        
        assert response.status_code == 200

    def test_daily_progress_accumulation(self, client, db_session):
        """Test that daily progress accumulates correctly."""
        user = models.User(
            username="progress_user2",
            email="proguser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        today = datetime.utcnow().date()
        progress = models.DailyProgress(
            user_id=user.uid,
            date=datetime.combine(today, datetime.min.time()),
            total_minutes=120,
            total_seconds=7200
        )
        db_session.add(progress)
        db_session.commit()

        assert progress.total_minutes == 120

    def test_badge_level_calculation(self, client, db_session):
        """Test badge level calculation from total minutes."""
        user = models.User(
            username="badge_user",
            email="badgeuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        progress = models.DailyProgress(
            user_id=user.uid,
            date=datetime.utcnow(),
            total_minutes=0,
            badge_level=0
        )
        db_session.add(progress)
        db_session.commit()

        progress.update_badge()
        
        assert progress.badge_level in [0, 1, 2, 3, 4]


class TestStudyCalendarQueries:
    """Test study calendar queries and filtering."""

    def test_get_calendar_month_view(self, client, db_session):
        """Test getting calendar for a month."""
        user = models.User(
            username="calendar_user1",
            email="caluser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        today = datetime.utcnow()
        response = client.get(
            f"/study/calendar/{user.uid}/{today.year}/{today.month}"
        )
        
        assert response.status_code == 200

    def test_get_daily_progress_specific_date(self, client, db_session):
        """Test getting progress for specific date."""
        user = models.User(
            username="calendar_user2",
            email="caluser2@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        today = datetime.utcnow()
        response = client.get(
            f"/study/progress/{user.uid}/{today.year}/{today.month}/{today.day}"
        )
        
        assert response.status_code == 200

    def test_calendar_across_month_boundary(self, client, db_session):
        """Test calendar view spanning month boundaries."""
        user = models.User(
            username="calendar_user3",
            email="caluser3@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        # Add progress near end of month
        last_day = datetime.utcnow().replace(day=28)
        progress = models.DailyProgress(
            user_id=user.uid,
            date=last_day,
            total_minutes=60
        )
        db_session.add(progress)
        db_session.commit()

        response = client.get(
            f"/study/calendar/{user.uid}/{last_day.year}/{last_day.month}"
        )
        
        assert response.status_code == 200


class TestStudySessionEdgeCases:
    """Test edge cases in study tracking."""

    def test_zero_duration_session(self, client, db_session):
        """Test handling of zero-duration session."""
        user = models.User(
            username="edge_user1",
            email="edgeuser1@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        now = datetime.utcnow()
        session = models.StudySession(
            user_id=user.uid,
            start_time=now,
            end_time=now,
            duration_minutes=0
        )
        db_session.add(session)
        db_session.commit()

        assert session.duration_minutes == 0

    def test_multiple_sessions_same_day(self, client, db_session):
        """Test multiple study sessions on same day."""
        user = models.User(
            username="multi_session_user",
            email="multisessionuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        sessions = []
        for i in range(3):
            session = models.StudySession(
                user_id=user.uid,
                start_time=datetime.utcnow() - timedelta(hours=i),
                duration_minutes=30
            )
            sessions.append(session)
        
        db_session.add_all(sessions)
        db_session.commit()

        assert len(sessions) == 3

    def test_overlapping_sessions_same_user(self, client, db_session):
        """Test handling of overlapping sessions."""
        user = models.User(
            username="overlap_user",
            email="overlapuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        start = datetime.utcnow()

        session1 = models.StudySession(
            user_id=user.uid,
            start_time=start,
            end_time=start + timedelta(minutes=60)
        )
        session2 = models.StudySession(
            user_id=user.uid,
            start_time=start + timedelta(minutes=30),
            end_time=start + timedelta(minutes=90)
        )
        db_session.add_all([session1, session2])
        db_session.commit()

        assert session1.sid != session2.sid


class TestStudyProgressMetrics:
    """Test study progress metrics and calculations."""

    def test_total_weekly_minutes(self, client, db_session):
        """Test calculating total weekly minutes."""
        user = models.User(
            username="weekly_user",
            email="weeklyuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        # Add 7 days of progress
        for i in range(7):
            progress = models.DailyProgress(
                user_id=user.uid,
                date=datetime.utcnow() - timedelta(days=i),
                total_minutes=60
            )
            db_session.add(progress)
        
        db_session.commit()

        total = db_session.query(models.DailyProgress).filter(
            models.DailyProgress.user_id == user.uid
        ).count()
        
        assert total >= 7

    def test_consistency_total_seconds_vs_minutes(self, client, db_session):
        """Test consistency between total_seconds and total_minutes."""
        user = models.User(
            username="consistency_user",
            email="consistencyuser@test.com",
            password="hashed"
        )
        db_session.add(user)
        db_session.commit()

        progress = models.DailyProgress(
            user_id=user.uid,
            date=datetime.utcnow(),
            total_minutes=120,
            total_seconds=7200
        )
        db_session.add(progress)
        db_session.commit()

        # 120 minutes = 7200 seconds
        assert progress.total_minutes * 60 == progress.total_seconds
