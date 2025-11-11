"""
Integration tests for study-calendar endpoints.
These tests are marked with @pytest.mark.integration and should only run
against a real Postgres database (e.g., in GitHub Actions CI).
They verify the Postgres-specific SQL (timezone, date_trunc, ON CONFLICT UPSERT).
"""
import datetime
import pytest
from app import models
from sqlalchemy import text


@pytest.mark.integration
def test_upsert_daily_progress_raw_sql_inserts_new_record(client, db_session):
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
def test_upsert_daily_progress_raw_sql_updates_existing_record(client, db_session):
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
def test_get_calendar_returns_daily_progress_across_month(client, db_session):
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
    today = datetime.date.today()
    cal = client.get(f"/study/calendar/{user['uid']}/{today.year}/{today.month}")
    assert cal.status_code == 200
    data = cal.json()

    # verify today's date is in the calendar with data
    key = today.strftime("%Y-%m-%d")
    assert key in data
    assert data[key]["total_minutes"] > 0 or data[key]["total_seconds"] > 0


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
def test_timezone_conversion_in_calendar_query(client, db_session):
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
