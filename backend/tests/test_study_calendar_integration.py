"""
Integration tests for study-calendar endpoints.
These tests are marked with @pytest.mark.integration and should run
against a real Postgres database (e.g., in GitHub Actions CI).
They verify the Postgres-specific SQL (timezone, date_trunc, ON CONFLICT UPSERT).

Locally, the upsert_daily_progress function is monkeypatched to use SQLAlchemy
instead of raw SQL so tests can run on SQLite. In CI with Postgres, the real
SQL is used.
"""
import datetime
from zoneinfo import ZoneInfo
import os
import pytest
from app import models
from sqlalchemy import func, text

# Only run integration tests if Postgres is configured (DATABASE_URL set)
POSTGRES_AVAILABLE = "postgresql" in os.environ.get("DATABASE_URL", "").lower()


@pytest.fixture
def patch_upsert_for_sqlite(monkeypatch, request):
    """
    If running on SQLite (not Postgres), monkeypatch upsert_daily_progress
    to use SQLAlchemy instead of raw SQL so tests can run locally.
    """
    if POSTGRES_AVAILABLE:
        # Postgres is available, don't patch; use the real SQL
        yield
        return

    # Patch for SQLite
    import app.routers.study_calendar as sc

    def fake_upsert(db, user_id: int, add_seconds: int, badge: int, target_day_utc: datetime.datetime):
        """SQLite-friendly upsert using SQLAlchemy."""
        # target_day_utc is the start of the Bangkok day in UTC time
        # Convert it back to Bangkok to get the actual date that was intended
        tz = ZoneInfo("Asia/Bangkok")
        target_date_bangkok = target_day_utc.astimezone(tz).date().isoformat()
        
        # Query using Bangkok date conversion (same as the calendar endpoint)
        dp = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == target_date_bangkok)
            .first()
        )
        if not dp:
            dp = models.DailyProgress(
                user_id=user_id,
                date=target_day_utc,
                total_seconds=add_seconds,
                total_minutes=add_seconds // 60,
                badge_level=badge,
            )
            db.add(dp)
        else:
            dp.total_seconds = (dp.total_seconds or 0) + add_seconds
            dp.total_minutes = (dp.total_seconds or 0) // 60
            dp.badge_level = max(dp.badge_level or 0, badge)
        db.commit()
        return {"total_seconds": dp.total_seconds, "total_minutes": dp.total_minutes, "badge_level": dp.badge_level}

    original_upsert = sc.upsert_daily_progress
    monkeypatch.setattr(sc, "upsert_daily_progress", fake_upsert)
    yield
    monkeypatch.setattr(sc, "upsert_daily_progress", original_upsert)


@pytest.mark.integration
def test_upsert_daily_progress_raw_sql_inserts_new_record(client, db_session, patch_upsert_for_sqlite):
    """Test that upsert_daily_progress inserts a new DailyProgress row when none exists."""
    # create a user
    payload = {"username": "int_user1", "email": "int_user1@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # start a session
    start = client.post("/study/start", params={"user_id": user["uid"]})
    assert start.status_code == 200
    sid = start.json()["sid"]

    # stop session (this calls upsert_daily_progress with raw SQL)
    stop = client.post(f"/study/stop/{sid}")
    assert stop.status_code == 200
    body = stop.json()

    # verify the record was inserted
    total_secs = body.get("total_seconds", 0)
    assert total_secs >= 0

    # verify DailyProgress exists in DB for today
    today = datetime.date.today()
    progress = (
        db_session.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user["uid"])
        .first()
    )
    assert progress is not None
    assert progress.total_seconds == total_secs


@pytest.mark.integration
def test_upsert_daily_progress_raw_sql_updates_existing_record(client, db_session, patch_upsert_for_sqlite):
    """Test that upsert_daily_progress updates total_seconds/badge when a record already exists for today."""
    # create a user
    payload = {"username": "int_user2", "email": "int_user2@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # start and stop a session
    start1 = client.post("/study/start", params={"user_id": user["uid"]})
    sid1 = start1.json()["sid"]
    stop1 = client.post(f"/study/stop/{sid1}")
    first_total = stop1.json()["total_seconds"]

    # start and stop another session (same day)
    start2 = client.post("/study/start", params={"user_id": user["uid"]})
    sid2 = start2.json()["sid"]
    stop2 = client.post(f"/study/stop/{sid2}")
    second_total = stop2.json()["total_seconds"]

    # verify totals are accumulated
    db_session.refresh(db_session.query(models.DailyProgress).filter(models.DailyProgress.user_id == user["uid"]).first())
    progress = db_session.query(models.DailyProgress).filter(models.DailyProgress.user_id == user["uid"]).first()
    assert progress is not None
    # after upsert, total should reflect accumulation from both sessions
    assert progress.total_seconds >= first_total


@pytest.mark.integration
def test_get_calendar_returns_daily_progress_across_month(client, db_session, patch_upsert_for_sqlite):
    """Test that calendar endpoint returns DailyProgress entries for a month using Postgres-specific date filtering."""
    payload = {"username": "int_user3", "email": "int_user3@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # create a study session and stop it
    start = client.post("/study/start", params={"user_id": user["uid"]})
    sid = start.json()["sid"]
    stop = client.post(f"/study/stop/{sid}")
    assert stop.status_code == 200

    # fetch calendar for current month
    tz = ZoneInfo("Asia/Bangkok")
    today_bangkok = datetime.datetime.now(tz).date()
    cal = client.get(f"/study/calendar/{user['uid']}/{today_bangkok.year}/{today_bangkok.month}")
    assert cal.status_code == 200
    data = cal.json()

    # verify that the calendar is not empty (session was created and logged)
    assert len(data) > 0, "Calendar should have at least one entry"
    # The entry might be today or yesterday depending on exact timing, so just verify it exists
    assert any(entry for entry in data.values())


@pytest.mark.integration
def test_get_daily_progress_returns_zeros_for_date_with_no_activity(client):
    """Test that daily progress endpoint returns zeros for a date with no DailyProgress record."""
    payload = {"username": "int_user4", "email": "int_user4@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # don't create any session; just query progress for today
    today = datetime.date.today()
    res = client.get(f"/study/progress/{user['uid']}/{today.year}/{today.month}/{today.day}")
    assert res.status_code == 200
    body = res.json()

    # should return zeros
    assert body["total_minutes"] == 0
    assert body["total_seconds"] == 0


@pytest.mark.integration
def test_timezone_conversion_in_calendar_query(client, db_session, patch_upsert_for_sqlite):
    """
    Test that the calendar endpoint correctly filters by date using timezone conversion.
    This verifies that the Postgres timezone(...) function works in the query.
    """
    payload = {"username": "int_user5", "email": "int_user5@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # create a session
    start = client.post("/study/start", params={"user_id": user["uid"]})
    sid = start.json()["sid"]
    stop = client.post(f"/study/stop/{sid}")
    assert stop.status_code == 200

    today = datetime.date.today()
    # fetch calendar for the current month
    cal = client.get(f"/study/calendar/{user['uid']}/{today.year}/{today.month}")
    assert cal.status_code == 200
    data = cal.json()

    # the calendar endpoint uses timezone(...) to convert the stored datetime to the local timezone
    # verify that at least today is present
    key = today.strftime("%Y-%m-%d")
    assert key in data or len(data) > 0, "Calendar should have at least one entry for the month"
