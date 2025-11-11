from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from datetime import timedelta
from sqlalchemy import func, distinct, desc
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os
from ..models import User, Post, Report
from ..schemas import AdminUserDetailResponse


router = APIRouter(
    prefix="/notification",
    tags=["Notification"],
    #dependencies=[Depends(oauth2.get_admin_user)]
)

def create_notification_template(
    db: Session,
    current_user: models.User,
    payload_data: dict 
):
    data = payload_data 

    if data["title"] == "ReportUser" and data.get("receiver_id"):
        receiver = db.query(models.User).filter(models.User.uid == data["receiver_id"]).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

        data["message"] = f"{current_user.username} has reported user {receiver.username}"

    elif data["title"] == "ReportPost" and data.get("receiver_id"):
        post_id = data["receiver_id"]
        post = db.query(models.Post).filter(models.Post.pid == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found for notification")
        
        post_owner = db.query(models.User).filter(models.User.uid == post.user_id).first()
        post_owner_username = post_owner.username if post_owner else "an unknown user"
        
        data["message"] = f"{current_user.username} has reported post id {post_id} by {post_owner_username}"

    noti = models.Notification(
        **data,
        sender_id=current_user.uid
    )
    db.add(noti)
    return noti

@router.post("/", response_model=schemas.NotificationResponse)
def create_notification(
    payload: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    noti = create_notification_template(
        db=db,
        current_user=current_user,
        payload_data=payload.model_dump()
    )
    
    db.commit()
    db.refresh(noti)
    return noti


@router.get("/", response_model=List[schemas.NotificationResponse])
def get_all_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()

@router.get("/{id}", response_model=schemas.NotificationResponse)
def get_notification_by_id(id: int, db: Session = Depends(get_db)):
    noti = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not noti:
        raise HTTPException(status_code=404, detail="Notification not found")
    return noti

@router.get("/admin", response_model=List[schemas.NotificationResponse])
def get_admin_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.target_role == "admin").order_by(models.Notification.created_at.desc()).all()

@router.get("/user/{uid}", response_model=List[schemas.NotificationResponse])
def get_user_notifications(uid: int, db: Session = Depends(get_db)):
    read_ids = db.query(models.NotificationRead.notification_id).filter(models.NotificationRead.user_id == uid).subquery()

    return db.query(models.Notification).filter(
        models.Notification.target_role == "user",
        ~models.Notification.id.in_(read_ids)
    ).order_by(models.Notification.created_at.desc()).all()

@router.get("/me", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    read_ids = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == current_user.uid
    ).subquery()

    return db.query(models.Notification).filter(
        (models.Notification.target_role == current_user.role) | 
        (models.Notification.receiver_id == current_user.uid),
        ~models.Notification.id.in_(read_ids)
    ).order_by(models.Notification.created_at.desc()).all()

@router.post("/{id}/read", status_code=204)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    exists = db.query(models.NotificationRead).filter_by(
        notification_id=id,
        user_id=current_user.uid
    ).first()

    if not exists:
        read_entry = models.NotificationRead(
            notification_id=id,
            user_id=current_user.uid,
            read_at=datetime.datetime.utcnow()
        )
        db.add(read_entry)
        db.commit()

    return