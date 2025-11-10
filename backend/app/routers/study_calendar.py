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
from zoneinfo import ZoneInfo

LOCAL_TZ = "Asia/Bangkok"

router = APIRouter(
    prefix="/study",
    tags=["Study Timer"]
)

# def upsert_daily_progress(db, user_id: int, add_seconds: int, badge: int, target_day_utc: datetime):
#     q = text("""
#     INSERT INTO daily_progress (user_id, date, total_seconds, total_minutes, badge_level)
#     VALUES (:uid, :day_utc, :secs, :secs/60, :badge)
#     ON CONFLICT (user_id, ((date AT TIME ZONE 'Asia/Bangkok')::date))
#     DO UPDATE SET
#       total_seconds = daily_progress.total_seconds + EXCLUDED.total_seconds,
#       total_minutes = (daily_progress.total_seconds + EXCLUDED.total_seconds)/60,
#       badge_level   = GREATEST(daily_progress.badge_level, EXCLUDED.badge_level)
#     RETURNING total_seconds, total_minutes, badge_level
#     """)
#     row = db.execute(q, {"uid": user_id, "day_utc": target_day_utc, "secs": add_seconds, "badge": badge}).first()
#     db.commit()
#     return {"total_seconds": row[0], "total_minutes": row[1], "badge_level": row[2]}


def upsert_for_local_day(db, user_id: int, local_day_dt: datetime, add_seconds: int, badge: int = 0):
    """
    local_day_dt: เวลาเที่ยงคืนของวันนั้นในโซนท้องถิ่น (tz-aware Asia/Bangkok)
    เก็บลง DB เป็น UTC ของเที่ยงคืนนั้น (หนึ่งแถวต่อวัน)
    """
    day_utc = local_day_dt.astimezone(timezone.utc)
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
    row = db.execute(q, {"uid": user_id, "day_utc": day_utc, "secs": add_seconds, "badge": badge}).first()
    db.commit()
    return {"total_seconds": row[0], "total_minutes": row[1], "badge_level": row[2]}

def split_and_upsert_by_local_day(db, user_id: int, start_utc: datetime, end_utc: datetime):
    """
    แบ่งช่วง [start_utc, end_utc) เป็นหลายชิ้นตาม boundary เที่ยงคืน Asia/Bangkok
    แล้ว upsert ทีละวัน
    """
    assert start_utc.tzinfo is not None and end_utc.tzinfo is not None
    if end_utc <= start_utc:
        return

    cur_start = start_utc
    last_totals = None

    while True:
        # เที่ยงคืนถัดไปของวันปัจจุบันในโซนท้องถิ่น
        cur_local = cur_start.astimezone(LOCAL_TZ)
        next_mid_local = datetime(cur_local.year, cur_local.month, cur_local.day, 0, 0, 0, tzinfo=LOCAL_TZ)
        next_mid_local = next_mid_local.replace(day=cur_local.day) + timedelta(days=1)
        next_mid_utc = next_mid_local.astimezone(timezone.utc)

        cur_end = min(end_utc, next_mid_utc)
        secs = int((cur_end - cur_start).total_seconds())
        if secs > 0:
            # ใช้เที่ยงคืน local ของชิ้นนี้เป็นคีย์วัน
            day_local_mid = datetime(cur_local.year, cur_local.month, cur_local.day, 0, 0, 0, tzinfo=LOCAL_TZ)
            last_totals = upsert_for_local_day(db, user_id, day_local_mid, secs, badge=0)

        if cur_end >= end_utc:
            break
        cur_start = cur_end

    return last_totals

@router.post("/start")
def start_session(user_id: int, db: Session = Depends(get_db)):
    session = models.StudySession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"sid": session.sid, "start_time": session.start_time}

# @router.post("/stop/{sid}")
# def stop_session(sid: int, db: Session = Depends(get_db)):
#     session = (
#         db.query(models.StudySession)
#         .filter(models.StudySession.sid == sid)
#         .first()
#     )
#     if not session or session.end_time:
#         return {"error": "Invalid session"}

#     # จบ session
#     session.end_time = datetime.now(timezone.utc)
#     elapsed = int((session.end_time - session.start_time).total_seconds())
#     db.commit()

#     # ===== ✅ คำนวณวันตาม Asia/Bangkok จาก start_time =====
#     tz = ZoneInfo("Asia/Bangkok")
#     local = session.start_time.astimezone(tz)
#     day_start_local = datetime(local.year, local.month, local.day, 0, 0, 0, tzinfo=tz)
#     target_day_utc = day_start_local.astimezone(timezone.utc)
#     # =======================================================

#     badge = 0


#     totals = upsert_daily_progress(
#         db=db,
#         user_id=session.user_id,
#         add_seconds=elapsed,
#         badge=badge,
#         target_day_utc=target_day_utc,  # ✅ ส่งเข้าฟังก์ชัน
#     )

#     return {
#         "total_seconds": totals["total_seconds"],
#         "total_minutes": totals["total_minutes"],
#         "badge": totals["badge_level"],
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
    db.commit()

    # แยกเป็นช่วงรายวันตาม Asia/Bangkok แล้ว upsert
    last = split_and_upsert_by_local_day(
        db=db,
        user_id=session.user_id,
        start_utc=session.start_time,
        end_utc=session.end_time,
    )

    # ส่งยอดของ "วันล่าสุดที่โดนอัปเดต" กลับ (พอสำหรับอัปเดตตัวเลขบนจอ)
    if last:
        return {
            "total_seconds": last["total_seconds"],
            "total_minutes": last["total_minutes"],
            "badge": last["badge_level"],
        }
    else:
        return {"total_seconds": 0, "total_minutes": 0, "badge": 0}

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
