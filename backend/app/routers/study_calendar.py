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


router = APIRouter(
    prefix="/study",
    tags=["Study Timer"]
)

def upsert_daily_progress(db, user_id: int, add_seconds: int, badge: int):
    q = text("""
    INSERT INTO daily_progress (user_id, date, total_seconds, total_minutes, badge_level)
    VALUES (:uid, date_trunc('day', now() AT TIME ZONE 'UTC'), :secs, :secs/60, :badge)
    ON CONFLICT (user_id, ((date AT TIME ZONE 'UTC')::date))
    DO UPDATE SET
      total_seconds = daily_progress.total_seconds + EXCLUDED.total_seconds,
      total_minutes = (daily_progress.total_seconds + EXCLUDED.total_seconds)/60,
      badge_level   = GREATEST(daily_progress.badge_level, EXCLUDED.badge_level)
    RETURNING total_seconds, total_minutes, badge_level
    """)
    row = db.execute(q, {"uid": user_id, "secs": add_seconds, "badge": badge}).first()
    db.commit()
    return {"total_seconds": row[0], "total_minutes": row[1], "badge_level": row[2]}

@router.post("/start")
def start_session(user_id: int, db: Session = Depends(get_db)):
    session = models.StudySession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"sid": session.sid, "start_time": session.start_time}

# @router.post("/stop/{sid}")
# def stop_session(sid: int, db: Session = Depends(get_db)):
#     session = db.query(models.StudySession).filter(models.StudySession.sid == sid).first()
#     if not session or session.end_time:
#         return {"error": "Invalid session"}

#     session.end_time = datetime.now(timezone.utc)
#     # session.duration_minutes = int((session.end_time - session.start_time).total_seconds() // 60)
#     duration_seconds = int((session.end_time - session.start_time).total_seconds())
    
#     db.commit()

#     study_date = session.start_time.date()
#     progress = (
#         db.query(models.DailyProgress)
#         .filter(models.DailyProgress.user_id == session.user_id,
#                 models.DailyProgress.date == study_date)
#         .first()
#     )

#     if not progress:
#         # progress = models.DailyProgress(user_id=session.user_id, date=study_date, total_minutes=0)
#         progress = models.DailyProgress(user_id=session.user_id, date=study_date, total_minutes=0, total_seconds=0)
#         db.add(progress)

#     # progress.total_minutes += session.duration_minutes
#     # อัปเดตแบบ seconds แล้วค่อยสรุปเป็นนาที
#     progress.total_seconds = (progress.total_seconds or 0) + duration_seconds
#     progress.total_minutes = progress.total_seconds // 60

#     progress.update_badge()
#     db.commit()

#     # return {"total_minutes": progress.total_minutes, "badge": progress.badge_level}
#     return {
#         "total_seconds": progress.total_seconds,
#         "total_minutes": progress.total_minutes,
#         "badge": progress.badge_level
#     }

# @router.get("/calendar/{user_id}/{year}/{month}")
# def get_calendar(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
#     last_day = monthrange(year, month)[1]

#     records = (
#         db.query(models.DailyProgress)
#         .filter(models.DailyProgress.user_id == user_id)
#         .filter(models.DailyProgress.date.between(f"{year}-{month:02d}-01", f"{year}-{month:02d}-{last_day}"))
#         .all()
#     )

#     return {
#         r.date.strftime("%Y-%m-%d"): {"total_minutes": r.total_minutes, "badge": r.badge_level}
#         for r in records
#     }

# @router.get("/progress/{user_id}/{year}/{month}/{day}")
# def get_daily_progress(
#     user_id: int,
#     year: int,
#     month: int,
#     day: int,
#     db: Session = Depends(database.get_db)
# ):
#     target_date = date(year, month, day)

#     progress = db.query(models.DailyProgress).filter(
#         models.DailyProgress.user_id == user_id,
#         models.DailyProgress.date.cast(Date) == target_date
#     ).first()

#     if not progress:
#         return {"date": target_date, "total_minutes": 0, "hours": 0, "badge_level": 0}

#     return {
#         "date": target_date,
#         "total_minutes": progress.total_minutes,
#         "hours": round(progress.total_minutes / 60, 2),
#         "badge_level": progress.badge_level
#     }


# @router.post("/stop/{sid}")
# def stop_session(sid: int, db: Session = Depends(get_db)):
#     session = (
#         db.query(models.StudySession)
#         .filter(models.StudySession.sid == sid)
#         .first()
#     )
#     if not session or session.end_time:
#         return {"error": "Invalid session"}

#     session.end_time = datetime.now(timezone.utc)
#     duration_seconds = int((session.end_time - session.start_time).total_seconds())

#     db.commit()

#     # ใช้วันที่จาก start_time (วันที่เรียน)
#     study_date = session.start_time.date()

#     progress = (
#         db.query(models.DailyProgress)
#         .filter(models.DailyProgress.user_id == session.user_id,
#                 models.DailyProgress.date == session.start_time)  # ถ้าเก็บเป็น timestamptz ทั้งวัน ให้ consider cast ด้านล่าง
#         .first()
#     )

#     # ถ้าคุณเก็บคอลัมน์ date เป็น timestamptz (เวลา 00:00) แนะนำให้สร้างเป็นบรรทัดใหม่แบบ normalize:
#     if not progress:
#         progress = models.DailyProgress(
#             user_id=session.user_id,
#             # เก็บเป็น midnight ของวันนั้น (ลดปัญหา timezone)
#             date=datetime(study_date.year, study_date.month, study_date.day, tzinfo=timezone.utc),
#             total_minutes=0,
#             total_seconds=0,
#         )
#         db.add(progress)

#     # อัปเดตแบบ seconds แล้วค่อยสรุปเป็นนาที
#     progress.total_seconds = (progress.total_seconds or 0) + duration_seconds
#     progress.total_minutes = progress.total_seconds // 60
#     progress.update_badge()

#     db.commit()

#     return {
#         "total_seconds": progress.total_seconds,
#         "total_minutes": progress.total_minutes,
#         "badge": progress.badge_level,
#     }

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
    records = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user_id)
        .filter(
            func.date(text("timezone('UTC', daily_progress.date)"))
            .between(dt_date(year, month, 1), dt_date(year, month, last_day))
        )
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
        .filter(
            func.date(text("timezone('UTC', daily_progress.date)")) == target_date
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
