from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from datetime import timedelta
from sqlalchemy import func, distinct, desc, or_, and_
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
    data = payload_data.copy() 

    if data["title"] == "ReportUser" and data.get("receiver_id"):
        receiver = db.query(models.User).filter(models.User.uid == data["receiver_id"]).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

        data["message"] = f"{current_user.name} has reported user {receiver.name}"

    elif data["title"] == "ReportPost" and data.get("receiver_id"):
        post_id = data["receiver_id"]
        post = db.query(models.Post).filter(models.Post.pid == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found for notification")
        
        post_owner = db.query(models.User).filter(models.User.uid == post.user_id).first()
        post_owner_username = post_owner.name if post_owner else "an unknown user"
        
        data["message"] = f"{current_user.name} has reported post id {post_id} by {post_owner_username}"
    
    elif data["title"] == "ReportComment" and data.get("receiver_id"):
        comment_id = data["receiver_id"]
        comment = db.query(models.Comment).filter(models.Comment.cid == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found for notification")
        
        comment_owner = db.query(models.User).filter(models.User.uid == comment.user_id).first()
        comment_owner_username = comment_owner.name if comment_owner else "an unknown user"

        data["message"] = f"{current_user.name} has reported comment id {comment_id} by {comment_owner_username}"


    if "target_role" not in data or data["target_role"] is None:
        data["target_role"] = "user"

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



@router.get("/admin", response_model=List[schemas.NotificationResponse])
def get_admin_notifications(db: Session = Depends(get_db)):
    notifications = db.query(models.Notification).filter(
        models.Notification.target_role == "admin"
    ).order_by(models.Notification.created_at.desc()).all()

    result = []
    for noti in notifications:
        sender = db.query(models.User).filter(models.User.uid == noti.sender_id).first()

        result.append(
            schemas.NotificationResponse.from_orm(noti).copy(update={
                "is_read": False,  # Admin view doesn't track read status per user
                "sender_username": sender.username if sender else None,
                "sender_avatar": sender.profile_image if sender else None
            })
        )
    return result


@router.get("/user/{uid}", response_model=List[schemas.NotificationResponse])
def get_user_notifications(uid: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_role = "admin" if user.is_admin else "user"

    read_ids = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == uid
    ).all()
    read_ids_set = set(r[0] for r in read_ids)

    if user.is_admin:
        notifications = db.query(models.Notification).filter(
            or_(
                models.Notification.target_role == "admin",
                models.Notification.receiver_id == uid,
                models.Notification.title == "all"
            )
        ).order_by(models.Notification.created_at.desc()).all()
    else:
        notifications = db.query(models.Notification).filter(
            or_(
                and_(
                    models.Notification.target_role == "user",
                    models.Notification.receiver_id == uid
                ),
                models.Notification.title == "all"
            )
        ).order_by(models.Notification.created_at.desc()).all()

    # annotate
    result = []
    for noti in notifications:
        sender = db.query(models.User).filter(models.User.uid == noti.sender_id).first()
        result.append(
            schemas.NotificationResponse.from_orm(noti).copy(update={
                "is_read": noti.id in read_ids_set,
                "sender_username": sender.username if sender else None,
                "sender_avatar": sender.profile_image if sender else None,
            })
        )
    return result

@router.get("/me", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Determine target role based on is_admin
    target_role = "admin" if current_user.is_admin else "user"

    # Get read notification IDs
    read_ids = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == current_user.uid
    ).all()
    read_ids_set = set(r[0] for r in read_ids)

    # Get relevant notifications
    if target_role == "admin":
        notifications = db.query(models.Notification).filter(
            (models.Notification.target_role == target_role) |
            (models.Notification.receiver_id == current_user.uid) |
            (models.Notification.title == "All")
        ).order_by(models.Notification.created_at.desc()).all()
    else:
        notifications = db.query(models.Notification).filter(
        or_(
            and_(
                models.Notification.target_role == target_role,
                models.Notification.receiver_id == current_user.uid
            ),
            models.Notification.title == "All"
        )
    ).order_by(models.Notification.created_at.desc()).all()


    # Annotate each with is_read
    result = []
    for noti in notifications:
        sender = db.query(models.User).filter(models.User.uid == noti.sender_id).first()

        result.append(
            schemas.NotificationResponse.from_orm(noti).copy(update={
                "is_read": noti.id in read_ids_set,
                "sender_username": sender.username if sender else None,
                "sender_avatar": sender.profile_image if sender else None
            })
        )
    return result



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
            read_at=datetime.datetime.now()
        )
        db.add(read_entry)
        db.commit()

    return


@router.get("/me/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    read_ids = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == current_user.uid
    ).subquery()

    count = db.query(func.count(models.Notification.id)).filter(
        (models.Notification.target_role == current_user.role) |
        (models.Notification.receiver_id == current_user.uid),
        ~models.Notification.id.in_(read_ids)
    ).scalar()

    return {"unread_count": count}

@router.get("/{id}", response_model=schemas.NotificationResponse)
def get_notification_by_id(id: int, db: Session = Depends(get_db)):
    noti = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not noti:
        raise HTTPException(status_code=404, detail="Notification not found")
    return noti

@router.get("/system/{uid}", response_model=List[schemas.NotificationResponse])
def get_system_notifications(uid: int, db: Session = Depends(get_db)):
    # User exists?
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔥 RULE: เอาเฉพาะ notification จากระบบ
    # ถ้าอยากเปลี่ยน rule บอกฉันได้
    system_titles = ["HelpReport", "HelpReportReply", "Help Update", "Report Update"]

    notifications = db.query(models.Notification).filter(
        models.Notification.receiver_id == uid,
        models.Notification.title.in_(system_titles)
    ).order_by(models.Notification.created_at.desc()).all()

    # Annotate
    result = []
    for noti in notifications:
        sender = db.query(models.User).filter(models.User.uid == noti.sender_id).first()
        result.append(
            schemas.NotificationResponse.from_orm(noti).copy(update={
                "is_read": False,  # system Tab ไม่ track read
                "sender_username": sender.username if sender else None,
                "sender_avatar": sender.profile_image if sender else None,
            })
        )
    return result