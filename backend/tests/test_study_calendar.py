import datetime
from zoneinfo import ZoneInfo
from app import models


def test_get_daily_progress_no_data_returns_zero(client):
    # create a user
    payload = {
        "username": "sc_user",
        "email": "sc_user@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    today = datetime.date.today()
    res = client.get(f"/study/progress/{user['uid']}/{today.year}/{today.month}/{today.day}")
    assert res.status_code == 200
    body = res.json()
    assert body["total_minutes"] == 0
    assert body["total_seconds"] == 0


def test_start_and_stop_session_with_monkeypatched_upsert(client, db_session, monkeypatch):
    # create a user
    payload = {
        "username": "sc_user2",
        "email": "sc_user2@example.com",
        "password": "Aa1!aaaa",
        "confirm_password": "Aa1!aaaa",
    }
    r = client.post("/users/", json=payload)
    assert r.status_code == 201
    user = r.json()

    # monkeypatch upsert_daily_progress to a sqlite-friendly implementation
    import app.routers.study_calendar as sc

    def fake_upsert(db, user_id: int, add_seconds: int, badge: int, target_day_utc: datetime.datetime):
        # find or create daily progress for target day (compare by Bangkok date YYYY-MM-DD)
        from sqlalchemy import func

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

    # patch into module
    monkeypatch.setattr(sc, "upsert_daily_progress", fake_upsert)

    # start session (user_id is a query param for this endpoint)
    start = client.post("/study/start", params={"user_id": user["uid"]})
    assert start.status_code == 200
    sid = start.json()["sid"]

    # stop session
    stop = client.post(f"/study/stop/{sid}")
    assert stop.status_code == 200
    body = stop.json()
    assert "total_seconds" in body and "total_minutes" in body


def test_calendar_returns_entries(client, db_session):
    # create user and a daily progress entry directly
    u = {"username": "cal_user", "email": "cal@example.com", "password": "Aa1!aaaa", "confirm_password": "Aa1!aaaa"}
    r = client.post("/users/", json=u)
    assert r.status_code == 201
    user = r.json()

    # create a DailyProgress row for today
    tz = ZoneInfo("Asia/Bangkok")
    today_bangkok = datetime.datetime.now(tz).date()
    dp = models.DailyProgress(user_id=user["uid"], date=datetime.datetime.now(tz), total_minutes=30, total_seconds=1800, badge_level=1)
    db_session.add(dp)
    db_session.commit()

    res = client.get(f"/study/calendar/{user['uid']}/{today_bangkok.year}/{today_bangkok.month}")
    assert res.status_code == 200
    data = res.json()
    key = today_bangkok.strftime("%Y-%m-%d")
    assert key in data
    assert data[key]["total_minutes"] == 30
