from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..oauth2 import get_current_user
import os

router = APIRouter(prefix="/help_reports", tags=["Help Reports"])

# =====================================================================
# 0. USER — CREATE HELP REPORT
# =====================================================================
@router.post("/create", response_model=schemas.HelpReportResponse)
async def create_help_report(
    message: str = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    file_path = None

    # Save file if uploaded
    if file:
        save_dir = "uploads/help"
        os.makedirs(save_dir, exist_ok=True)

        cleaned_name = file.filename.replace(" ", "_")
        file_path = f"{save_dir}/{cleaned_name}"

        with open(file_path, "wb") as f:
            f.write(await file.read())

    # Save report
    report = models.HelpReport(
        user_id=current_user.uid,
        message=message,
        file_path=file_path
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


# =====================================================================
# 1. ADMIN — GET ALL REPORTS (FIX AVATAR PATH)
# =====================================================================
@router.get("/", response_model=list[schemas.HelpReportResponse])
def get_reports(db: Session = Depends(get_db)):

    reports = (
        db.query(models.HelpReport)
        .join(models.User, models.HelpReport.user_id == models.User.uid)
        .add_columns(
            models.HelpReport.id,
            models.HelpReport.message,
            models.HelpReport.file_path,
            models.HelpReport.resolved,
            models.HelpReport.created_at,
            models.User.username,
            models.User.profile_image.label("avatar")
        )
        .order_by(models.HelpReport.created_at.desc())
        .all()
    )

    response = []

    for r in reports:

        # -------------------------------
        # FIX 1: avatar path cleaning
        # -------------------------------
        avatar = None
        if r.avatar:
            clean_avatar = r.avatar.lstrip("/")       # remove any leading slash
            avatar = f"http://localhost:8000/{clean_avatar}"

        # -------------------------------
        # FIX 2: help file path cleaning
        # -------------------------------
        file_url = None
        if r.file_path:
            file_clean = r.file_path.lstrip("/")      # remove leading slash
            file_url = f"http://localhost:8000/{file_clean}"

        response.append({
            "id": r.id,
            "message": r.message,
            "file_path": file_url,
            "resolved": r.resolved,
            "created_at": r.created_at,
            "username": r.username,
            "avatar": avatar,
        })

    return response


# =====================================================================
# 2. ADMIN — MARK RESOLVED
# =====================================================================
@router.put("/{report_id}/resolve")
def resolve_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.HelpReport).filter(models.HelpReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.resolved = True
    db.commit()

    return {"message": "resolved"}


# =====================================================================
# 3. ADMIN — SEND REPLY (CREATE NOTIFICATION)
# =====================================================================
@router.post("/{report_id}/reply")
def reply_help(
    report_id: int,
    reply: str = Form(...),
    db: Session = Depends(get_db)
):
    report = db.query(models.HelpReport).filter(models.HelpReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    notification = models.Notification(
        title="Your Help Report Update",
        message=reply,
        receiver_id=report.user_id,
        target_role="user"
    )

    db.add(notification)
    db.commit()

    return {"message": "reply sent"}