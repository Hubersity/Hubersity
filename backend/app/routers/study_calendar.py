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

    # Check if we're using SQLite (for tests) or PostgreSQL (production)
    dialect_name = db.bind.dialect.name
    
    if dialect_name == 'sqlite':
        # ใน SQLite ไม่มี timezone จริง ๆ → เราเก็บเป็น "เที่ยงคืนเวลาไทย (naive)" แทน
        target_date_bangkok = target_day_utc.astimezone(TZ).date()

        # สร้าง datetime เที่ยงคืนของวันนั้น (local) แบบไม่มี tz
        day_start_local = datetime(
            target_date_bangkok.year,
            target_date_bangkok.month,
            target_date_bangkok.day,
            0, 0, 0,
        )

        dp = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == target_date_bangkok)
            .first()
        )

        if not dp:
            dp = models.DailyProgress(
                user_id=user_id,
                date=day_start_local,  # <- ไม่เก็บเป็น UTC แล้ว แต่เก็บเป็น local midnight
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
    else:
        # PostgreSQL raw SQL (production)
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
    
@router.get("/today/{user_id}")
def get_today_study(user_id: int, db: Session = Depends(get_db)):
    now = datetime.now(TZ)
    today = datetime(now.year, now.month, now.day, tzinfo=TZ)
    today_date = today.date()
    dialect_name = db.bind.dialect.name

    if dialect_name == 'sqlite':
        rec = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(func.date(models.DailyProgress.date) == today_date)
            .first()
        )
    else:
        # PostgreSQL: ใช้ timezone('Asia/Bangkok', ...) ได้ปกติ
        rec = (
            db.query(models.DailyProgress)
            .filter(models.DailyProgress.user_id == user_id)
            .filter(
                func.date(
                    func.timezone("Asia/Bangkok", models.DailyProgress.date)
                ) == today_date
            )
            .first()
        )

    if not rec:
        return {"seconds": 0, "time": "00:00:00", "image": "/images/ts_l0-rebg.png"}

    secs = rec.total_seconds or (rec.total_minutes or 0) * 60

    # คำนวณรูปตามจำนวนชั่วโมง
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

    # format HH:MM:SS
    hh = str(int(secs // 3600)).zfill(2)
    mm = str(int((secs % 3600) // 60)).zfill(2)
    ss = str(int(secs % 60)).zfill(2)

    return {
        "seconds": secs,
        "time": f"{hh}:{mm}:{ss}",
        "image": img,
    }

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

    # จบ session (เก็บเป็นเวลา UTC)
    session.end_time = datetime.now(timezone.utc)
    db.commit()

    # ----- คำนวณเวลาแต่ละวันตาม Asia/Bangkok -----
    local_tz = TZ  # ZoneInfo("Asia/Bangkok")
    start_local = session.start_time.astimezone(local_tz)
    end_local = session.end_time.astimezone(local_tz)

    cursor_date = start_local.date()
    last_date = end_local.date()

    latest_totals = None  # ไว้เก็บยอดของ "วันสุดท้าย" จะเอาไป return ให้ frontend

    while cursor_date <= last_date:
        day_start_local = datetime(
            cursor_date.year, cursor_date.month, cursor_date.day,
            0, 0, 0, tzinfo=local_tz
        )
        day_end_local = day_start_local + timedelta(days=1)

        # ช่วงเวลาที่ session ทับกับวันนี้
        overlap_start = max(start_local, day_start_local)
        overlap_end = min(end_local, day_end_local)

        seconds = int((overlap_end - overlap_start).total_seconds())
        
        seconds = max(0, int((overlap_end - overlap_start).total_seconds()))

        target_day_utc = day_start_local.astimezone(timezone.utc)
        totals = upsert_daily_progress(
            db=db,
            user_id=session.user_id,
            add_seconds=seconds,
            badge=0,
            target_day_utc=target_day_utc,
        )

        # ถ้าวันนี้คือวันที่ session จบ → เก็บไว้ไป return
        if cursor_date == end_local.date():
            latest_totals = totals

        cursor_date += timedelta(days=1)

    # กันเคสแปลก ๆ (ปกติไม่เข้า)
    if latest_totals is None:
        latest_totals = {"total_seconds": 0, "total_minutes": 0, "badge_level": 0}

    return {
        "total_seconds": latest_totals["total_seconds"],
        "total_minutes": latest_totals["total_minutes"],
        "badge": latest_totals["badge_level"],
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
        # local_key = r.date.astimezone(TZ).strftime("%Y-%m-%d")
        if db.bind.dialect.name == "sqlite":
            # SQLite ไม่มี timezone → ใช้วันที่ดิบที่ test ใส่เข้ามา
            local_key = r.date.date().strftime("%Y-%m-%d")
        else:
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