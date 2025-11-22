# app/routers/study_calendar.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, date as dt_date, timedelta
from zoneinfo import ZoneInfo
from calendar import monthrange
from typing import Optional

from ..database import get_db
from .. import models

LOCAL_TZ = "Asia/Bangkok"
TZ = ZoneInfo(LOCAL_TZ)

router = APIRouter(prefix="/study", tags=["Study Timer"])


# ---------------------------
# Helpers
# ---------------------------

def get_year_in_local_language(year: int, lang: str) -> str:
    """Return year string in Thai Buddhist Era if lang=th, else AD."""
    if lang == "th":
        return str(year + 543)
    return str(year)


def upsert_daily_progress(
    db: Session,
    user_id: int,
    add_seconds: int,
    badge: int,
    target_day_utc: datetime,
):
    """
    Upsert daily_progress by Bangkok day boundary.
    - SQLite: no timezone -> use naive midnight local day
    - Postgres: manual upsert (no ON CONFLICT required)
    """

    # sanitize
    if add_seconds < 0:
        add_seconds = 0
    if add_seconds > 24 * 3600:
        add_seconds = 24 * 3600

    dialect_name = db.bind.dialect.name

    # ---------------- SQLite (tests) ----------------
    if dialect_name == "sqlite":
        target_date_bkk = target_day_utc.astimezone(TZ).date()

        day_start_local = datetime(
            target_date_bkk.year,
            target_date_bkk.month,
            target_date_bkk.day,
            0, 0, 0
        )

        dp = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == target_date_bkk)
            .first()
        )

        if not dp:
            dp = models.DailyProgress(
                user_id=user_id,
                date=day_start_local,
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
        return {
            "total_seconds": dp.total_seconds,
            "total_minutes": dp.total_minutes,
            "badge_level": dp.badge_level,
        }

    # ---------------- Postgres (production) ----------------
    # หา row ของ "วันตาม Bangkok" ก่อน
    target_date_bkk = target_day_utc.astimezone(TZ).date()

    dp = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user_id)
        .filter(
            func.date(func.timezone(LOCAL_TZ, models.DailyProgress.date)) == target_date_bkk
        )
        .with_for_update()  # กัน race เบา ๆ ถ้าหยุดซ้อน
        .first()
    )

    if not dp:
        dp = models.DailyProgress(
            user_id=user_id,
            date=target_day_utc,  # เก็บเป็น UTC midnight ของวันนั้น
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
    return {
        "total_seconds": dp.total_seconds,
        "total_minutes": dp.total_minutes,
        "badge_level": dp.badge_level,
    }


# ---------------------------
# Routes
# ---------------------------

@router.get("/today/{user_id}")
def get_today_study(user_id: int, db: Session = Depends(get_db)):
    now_bkk = datetime.now(TZ)
    today_date = now_bkk.date()

    dialect_name = db.bind.dialect.name

    if dialect_name == "sqlite":
        rec = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == today_date)
            .first()
        )
    else:
        rec = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(
                func.date(func.timezone(LOCAL_TZ, models.DailyProgress.date)) == today_date
            )
            .first()
        )

    if not rec:
        return {"seconds": 0, "time": "00:00:00", "image": "/images/ts_l0-rebg.png"}

    secs = rec.total_seconds or (rec.total_minutes or 0) * 60

    h = secs / 3600
    if h <= 0:
        img = "/images/ts_l0-rebg.png"
    elif h < 3:
        img = "/images/ts_l1-rebg.png"
    elif h < 6:
        img = "/images/ts_l2-rebg.png"
    elif h < 9:
        img = "/images/ts_l3-rebg.png"
    else:
        img = "/images/ts_l4-rebg.png"

    hh = str(int(secs // 3600)).zfill(2)
    mm = str(int((secs % 3600) // 60)).zfill(2)
    ss = str(int(secs % 60)).zfill(2)

    return {"seconds": secs, "time": f"{hh}:{mm}:{ss}", "image": img}


@router.post("/start")
def start_session(user_id: int, db: Session = Depends(get_db)):
    session = models.StudySession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"sid": session.sid, "start_time": session.start_time}


@router.post("/stop/{sid}")
def stop_session(sid: int, db: Session = Depends(get_db)):
    session = (
        db.query(models.StudySession)
        .filter(models.StudySession.sid == sid)
        .first()
    )
    if not session or session.end_time:
        return {"error": "Invalid session"}

    session.end_time = datetime.now(timezone.utc)
    db.commit()

    start_local = session.start_time.astimezone(TZ)
    end_local = session.end_time.astimezone(TZ)

    cursor_date = start_local.date()
    last_date = end_local.date()

    latest_totals = None

    while cursor_date <= last_date:
        day_start_local = datetime(
            cursor_date.year, cursor_date.month, cursor_date.day,
            0, 0, 0, tzinfo=TZ
        )
        day_end_local = day_start_local + timedelta(days=1)

        overlap_start = max(start_local, day_start_local)
        overlap_end = min(end_local, day_end_local)

        seconds = max(0, int((overlap_end - overlap_start).total_seconds()))

        target_day_utc = day_start_local.astimezone(timezone.utc)
        totals = upsert_daily_progress(
            db=db,
            user_id=session.user_id,
            add_seconds=seconds,
            badge=0,
            target_day_utc=target_day_utc,
        )

        if cursor_date == last_date:
            latest_totals = totals

        cursor_date += timedelta(days=1)

    if latest_totals is None:
        latest_totals = {"total_seconds": 0, "total_minutes": 0, "badge_level": 0}

    return {
        "total_seconds": latest_totals["total_seconds"],
        "total_minutes": latest_totals["total_minutes"],
        "badge": latest_totals["badge_level"],
    }


@router.get("/calendar/{user_id}/{year}/{month}")
def get_calendar(
    user_id: int,
    year: int,
    month: int,
    lang: Optional[str] = "en",
    db: Session = Depends(get_db),
):
    last_day = monthrange(year, month)[1]
    d1 = dt_date(year, month, 1)
    d2 = dt_date(year, month, last_day)

    dialect_name = db.bind.dialect.name

    if dialect_name == "sqlite":
        records = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date).between(d1, d2))
            .all()
        )
    else:
        records = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(
                func.date(func.timezone(LOCAL_TZ, models.DailyProgress.date)).between(d1, d2)
            )
            .all()
        )

    display_year = get_year_in_local_language(year, lang)

    out = {}
    for r in records:
        if dialect_name == "sqlite":
            local_key = r.date.date().strftime("%Y-%m-%d")
        else:
            local_key = r.date.astimezone(TZ).strftime("%Y-%m-%d")

        total_seconds = getattr(r, "total_seconds", (r.total_minutes or 0) * 60)
        out[local_key] = {
            "total_minutes": r.total_minutes or 0,
            "total_seconds": total_seconds,
            "badge": r.badge_level or 0,
            "year": display_year,
        }

    return out


@router.get("/progress/{user_id}/{year}/{month}/{day}")
def get_daily_progress(
    user_id: int,
    year: int,
    month: int,
    day: int,
    db: Session = Depends(get_db),
):
    target_date = dt_date(year, month, day)
    dialect_name = db.bind.dialect.name

    if dialect_name == "sqlite":
        progress = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == target_date)
            .first()
        )
    else:
        progress = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(
                func.date(func.timezone(LOCAL_TZ, models.DailyProgress.date)) == target_date
            )
            .first()
        )

    if not progress:
        return {
            "date": target_date,
            "total_minutes": 0,
            "total_seconds": 0,
            "hours": 0,
            "badge_level": 0,
        }

    total_seconds = getattr(progress, "total_seconds", (progress.total_minutes or 0) * 60)

    return {
        "date": target_date,
        "total_minutes": progress.total_minutes or 0,
        "total_seconds": total_seconds,
        "hours": round(total_seconds / 3600, 2),
        "badge_level": progress.badge_level or 0,
    }


@router.get("/active/{user_id}")
def get_active_session(user_id: int, db: Session = Depends(get_db)):
    s = (
        db.query(models.StudySession)
        .filter(
            models.StudySession.user_id == user_id,
            models.StudySession.end_time.is_(None),
        )
        .order_by(models.StudySession.start_time.desc())
        .first()
    )
    server_now = datetime.now(timezone.utc)

    if not s:
        return {"active": False, "server_now": server_now.isoformat()}

    return {
        "active": True,
        "sid": s.sid,
        "start_time": s.start_time.isoformat(),
        "server_now": server_now.isoformat(),
    }