from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..config import UPLOAD_ROOT, BACKEND_URL
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
        save_root = UPLOAD_ROOT                    # static mount root
        save_dir = f"{save_root}/help"           # folder inside uploads/help
        os.makedirs(save_dir, exist_ok=True)

        cleaned_name = file.filename.replace(" ", "_")
        full_path = os.path.join(save_dir, cleaned_name)

        # save file to disk
        with open(full_path, "wb") as f:
            f.write(await file.read())

        # store only relative path (match StaticFiles)
        file_path = f"help/{cleaned_name}"

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
# 1. ADMIN — GET ALL REPORTS
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
        avatar_url = None
        if r.avatar:
            clean_avatar = r.avatar.lstrip("/")
            avatar_url = f"{BACKEND_URL}/{clean_avatar}"

        file_url = None
        if r.file_path:
            file_clean = r.file_path.lstrip("/")      # "help/a.pdf"
            file_url = f"{BACKEND_URL}/uploads/{file_clean}"

        response.append({
            "id": r.id,
            "message": r.message,
            "file_path": file_url,
            "resolved": r.resolved,
            "created_at": r.created_at,
            "username": r.username,
            "avatar": avatar_url,
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
        title="HelpReportReply",
        message=reply,
        receiver_id=report.user_id,
        target_role="user"
    )

    db.add(notification)
    db.commit()

    return {"message": "reply sent"}
