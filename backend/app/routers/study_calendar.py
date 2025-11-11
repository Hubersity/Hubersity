# app/routers/study_calendar.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date as dt_date, timedelta
from .. import models, database
from sqlalchemy import Date
from ..database import get_db
from calendar import monthrange
from .. import models
from sqlalchemy import func, text
from zoneinfo import ZoneInfo

LOCAL_TZ = "Asia/Bangkok"
TZ = ZoneInfo("Asia/Bangkok")

router = APIRouter(
    prefix="/study",
    tags=["Study Timer"]
)


def upsert_daily_progress(db, user_id: int, add_seconds: int, badge: int, target_day_utc: datetime):
        # กันค่าผิด ๆ หลุดมา
    if add_seconds < 0:
        add_seconds = 0
    if add_seconds > 24*3600:
        add_seconds = 24*3600

    q = text("""
    INSERT INTO daily_progress (user_id, date, total_seconds, total_minutes, badge_level)
    VALUES (:uid, :day_utc, :secs, :secs/60, :badge)
    ON CONFLICT (user_id, ((date AT TIME ZONE 'Asia/Bangkok')::date))
    DO UPDATE SET
      total_seconds = daily_progress.total_seconds + EXCLUDED.total_seconds,
      total_minutes = (daily_progress.total_seconds + EXCLUDED.total_seconds)/60,
      badge_level   = GREATEST(daily_progress.badge_level, EXCLUDED.badge_level)
    RETURNING total_seconds, total_minutes, badge_level
    """)
    row = db.execute(q, {"uid": user_id, "day_utc": target_day_utc, "secs": add_seconds, "badge": badge}).first()
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

    # จบ session
    session.end_time = datetime.now(timezone.utc)
    elapsed = int((session.end_time - session.start_time).total_seconds())
    db.commit()

    # ===== ✅ คำนวณวันตาม Asia/Bangkok จาก start_time =====
    tz = ZoneInfo("Asia/Bangkok")
    local = session.start_time.astimezone(tz)
    day_start_local = datetime(local.year, local.month, local.day, 0, 0, 0, tzinfo=tz)
    target_day_utc = day_start_local.astimezone(timezone.utc)
    # =======================================================

    badge = 0


    totals = upsert_daily_progress(
        db=db,
        user_id=session.user_id,
        add_seconds=elapsed,
        badge=badge,
        target_day_utc=target_day_utc,  # ✅ ส่งเข้าฟังก์ชัน
    )

    return {
        "total_seconds": totals["total_seconds"],
        "total_minutes": totals["total_minutes"],
        "badge": totals["badge_level"],
    }

@router.get("/calendar/{user_id}/{year}/{month}")
def get_calendar(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
    last_day = monthrange(year, month)[1]

    records = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user_id)
        .filter(text("date(timezone('Asia/Bangkok', daily_progress.date)) BETWEEN :d1 AND :d2"))
        .params(d1=dt_date(year, month, 1), d2=dt_date(year, month, last_day))
        .all()
    )

    out = {}
    for r in records:
        # แปลง timestamp ที่เก็บเป็น UTC ให้เป็น “วันที่ตามไทย” ก่อนทำ key
        local_key = r.date.astimezone(TZ).strftime("%Y-%m-%d")
        total_seconds = getattr(r, "total_seconds", (r.total_minutes or 0) * 60)
        out[local_key] = {
            "total_minutes": r.total_minutes or 0,
            "total_seconds": total_seconds,
            "badge": r.badge_level or 0,
        }
    return out

@router.get("/progress/{user_id}/{year}/{month}/{day}")
def get_daily_progress(user_id: int, year: int, month: int, day: int, db: Session = Depends(get_db)):
    target_date = dt_date(year, month, day)
    progress = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user_id)
        .filter(text("date(timezone('Asia/Bangkok', daily_progress.date)) = :d"))
        .params(d=target_date)
        .first()
    )
    if not progress:
        return {"date": target_date, "total_minutes": 0, "total_seconds": 0, "hours": 0, "badge_level": 0}
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
        .filter(models.StudySession.user_id == user_id, models.StudySession.end_time.is_(None))
        .order_by(models.StudySession.start_time.desc())
        .first()
    )
    server_now = datetime.now(timezone.utc)
    if not s:
        return {"active": False, "server_now": server_now.isoformat()}

    # ถ้าต้องการกันเคสข้ามเที่ยงคืนให้โชว์เฉพาะเวลาตั้งแต่ 00:00 ของวันนี้:
    # สมมติเราใช้ ‘Asia/Bangkok’ เป็น day boundary
    # (ถ้ายังไม่อยากยุ่ง timezone มาก ใช้ client คำนวณก็ได้ — ดูโค้ดฝั่ง frontend)
    return {
        "active": True,
        "sid": s.sid,
        "start_time": s.start_time.isoformat(),
        "server_now": server_now.isoformat(),
    }