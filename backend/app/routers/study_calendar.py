# app/routers/study_calendar.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/study",
    tags=["Study Timer"]
)

@router.post("/start")
def start_session(user_id: int, db: Session = Depends(get_db)):
    session = models.StudySession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"sid": session.sid, "start_time": session.start_time}

@router.post("/stop/{sid}")
def stop_session(sid: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.sid == sid).first()
    if not session or session.end_time:
        return {"error": "Invalid session"}

    session.end_time = datetime.utcnow()
    session.duration_minutes = int((session.end_time - session.start_time).total_seconds() // 60)
    db.commit()

    study_date = session.start_time.date()
    progress = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == session.user_id,
                models.DailyProgress.date == study_date)
        .first()
    )

    if not progress:
        progress = models.DailyProgress(user_id=session.user_id, date=study_date, total_minutes=0)
        db.add(progress)

    progress.total_minutes += session.duration_minutes
    progress.update_badge()
    db.commit()

    return {"total_minutes": progress.total_minutes, "badge": progress.badge_level}

@router.get("/calendar/{user_id}/{year}/{month}")
def get_calendar(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
    records = (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.user_id == user_id)
        .filter(models.DailyProgress.date.between(f"{year}-{month}-01", f"{year}-{month}-31"))
        .all()
    )
    return {
        r.date.strftime("%Y-%m-%d"): {"total_minutes": r.total_minutes, "badge": r.badge_level}
        for r in records
    }
