# app/routers/study_calendar.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date as dt_date
from .. import models, database
from sqlalchemy import Date
from ..database import get_db
from calendar import monthrange
from .. import models
from sqlalchemy import func, text

LOCAL_TZ = "Asia/Bangkok"

router = APIRouter(
    prefix="/study",
    tags=["Study Timer"]
)

def upsert_daily_progress(db, user_id: int, add_seconds: int, badge: int):
    q = text("""
    INSERT INTO daily_progress (user_id, date, total_seconds, total_minutes, badge_level)
    VALUES (
      :uid,
      -- ปักเวลาเป็นเที่ยงคืนของวันตามโซนท้องถิ่น แล้วเก็บลงคอลัมน์ timestamptz
      (date_trunc('day', timezone(:tz, now())) AT TIME ZONE :tz),
      :secs, :secs/60, :badge
    )
    ON CONFLICT (user_id, ((date AT TIME ZONE :tz)::date))
    DO UPDATE SET
      total_seconds = daily_progress.total_seconds + EXCLUDED.total_seconds,
      total_minutes = (daily_progress.total_seconds + EXCLUDED.total_seconds)/60,
      badge_level   = GREATEST(daily_progress.badge_level, EXCLUDED.badge_level)
    RETURNING total_seconds, total_minutes, badge_level
    """)
    row = db.execute(q, {"uid": user_id, "secs": add_seconds, "badge": badge, "tz": LOCAL_TZ}).first()
    db.commit()
    return {"total_seconds": row[0], "total_minutes": row[1], "badge_level": row[2]}

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
    elapsed = int((session.end_time - session.start_time).total_seconds())
    db.commit()

    # คำนวณ badge ตาม logic ของคุณ (ตอนนี้ใส่ 0 ไปก่อน)
    badge = 0

    # ⬇️ ใช้ UPSERT เดียว จบ ไม่ชน UNIQUE
    totals = upsert_daily_progress(
        db=db,
        user_id=session.user_id,
        add_seconds=elapsed,
        badge=badge,
    )

    return {
        "total_seconds": totals["total_seconds"],
        "total_minutes": totals["total_minutes"],
        "badge": totals["badge_level"],
    }

@router.get("/calendar/{user_id}/{year}/{month}")
def get_calendar(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
    last_day = monthrange(year, month)[1]
    start = dt_date(year, month, 1)
    end = dt_date(year, month, last_day)

    # ⬇️ ใช้ func.date(timezone('UTC', ...)) เพื่อเทียบเป็น “วันที่ (UTC)”
    # /calendar
    records = (
    db.query(models.DailyProgress)
    .filter(models.DailyProgress.user_id == user_id)
    .filter(func.date(text("timezone(:tz, daily_progress.date)")).between(
        dt_date(year, month, 1), dt_date(year, month, last_day)
    ))
    .params(tz=LOCAL_TZ)
    .all()
    )


    return {
        r.date.strftime("%Y-%m-%d"): {
            "total_minutes": r.total_minutes or 0,
            "total_seconds": getattr(r, "total_seconds", (r.total_minutes or 0) * 60),
            "badge": r.badge_level or 0,
        }
        for r in records
    }

@router.get("/progress/{user_id}/{year}/{month}/{day}")
def get_daily_progress(user_id: int, year: int, month: int, day: int, db: Session = Depends(get_db)):
    target_date = dt_date(year, month, day)

    # ถ้า column `date` เป็น timestamptz ให้ค้นหาระหว่าง 00:00–23:59 ของวันนั้น
    day_start = datetime(year, month, day, 0, 0, 0, tzinfo=timezone.utc)
    day_end   = datetime(year, month, day, 23, 59, 59, tzinfo=timezone.utc)

    # ⬇️ เทียบ “วันเดียวกัน (UTC)” แถวเดียวต่อวัน
    progress = (
    db.query(models.DailyProgress)
    .filter(models.DailyProgress.user_id == user_id)
    .filter(func.date(text("timezone(:tz, daily_progress.date)")) == dt_date(year, month, day))
    .params(tz=LOCAL_TZ)
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
