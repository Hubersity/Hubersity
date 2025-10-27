from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from datetime import timedelta
from sqlalchemy import func, distinct, desc
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    #dependencies=[Depends(oauth2.get_admin_user)]
)

@router.get("/users/all", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
):
    users = db.query(models.User).all()
    return users

@router.get("/users/{id}", response_model=schemas.UserResponse)
def get_user(
    id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.uid == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User id:{id} was not found"
        )
    return user

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
):
    user_count = db.query(models.User).count()
    post_count = db.query(models.Post).count()

    reported_post_count = db.query(func.count(distinct(models.Report.post_id))).scalar()

    reported_user_count = (
        db.query(func.count(distinct(models.Post.user_id)))
        .join(models.Report, models.Report.post_id == models.Post.pid)
        .scalar()
    )

    uni_counts = (db.query(models.User.university, func.count(models.User.uid)).group_by(models.User.university).all())

    return {
        "user_count": user_count,
        "post_count": post_count,
        "reported_post_count": reported_post_count,
        "reported_user_count": reported_user_count,
        "users_by_university": [
            {"university": uni, "count": count} for uni, count in uni_counts
        ]
    }


@router.post("/users/{user_id}/ban")
def ban_user(user_id: int, request: schemas.BanRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    duration = request.duration
    now = datetime.datetime.now()

    if duration == "1w":
        user.ban_until = now + timedelta(weeks=1)
    elif duration == "1m":
        user.ban_until = now + timedelta(days=30)
    elif duration == "1y":
        user.ban_until = now + timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Invalid duration")

    user.is_banned = True
    db.commit()
    return {"message": f"{user.username} banned until {user.ban_until.strftime('%Y-%m-%d %H:%M:%S')}"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@router.post("/users/{user_id}/unban")
def unban_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_banned = False
    user.ban_until = None
    db.commit()

    return {"message": f"User {user.username} has been unbanned"}

@router.get("/reports")
def get_reported_data(
    db: Session = Depends(get_db),
):
    reported_posts = (
    db.query(
        models.Report.post_id.label("post_id"),
        models.Post.post_content.label("content"),
        func.count(models.Report.rid).label("report_count"),
        func.max(models.Report.created_at).label("last_date"),
        func.max(models.Report.status).label("status"),
    )
    .join(models.Post, models.Post.pid == models.Report.post_id)
    .group_by(models.Report.post_id, models.Post.post_content)
    .all()
    )


    post_details = []
    for post in reported_posts:
        top_reason = (
            db.query(models.Report.reason)
            .filter(models.Report.post_id == post.post_id)
            .group_by(models.Report.reason)
            .order_by(desc(func.count(models.Report.reason)))
            .limit(1)
            .scalar()
        )

        post_details.append({
            "Post_ID": post.post_id,
            "Post_Content": post.content,
            "NumberOfReports": post.report_count,
            "PopularReasons": top_reason or "-",
            "LastDate": post.last_date.strftime("%Y-%m-%d"),
            "Action": "", 
            "status": post.status or "Pending"
        })

    reported_users = (
        db.query(
            models.User.uid.label("uid"),
            models.User.username.label("username"),
            func.count(models.Report.rid).label("report_count"),
            func.max(models.Report.created_at).label("last_date"),
            func.max(models.Report.status).label("status")
        )
        .join(models.Post, models.Post.pid == models.Report.post_id)
        .join(models.User, models.User.uid == models.Post.user_id)
        .group_by(models.User.uid)
        .all()
    )

    user_details = []
    for user in reported_users:
        top_reason = (
            db.query(models.Report.reason)
            .join(models.Post, models.Post.pid == models.Report.post_id)
            .filter(models.Post.user_id == user.uid)
            .group_by(models.Report.reason)
            .order_by(desc(func.count(models.Report.reason)))
            .limit(1)
            .scalar()
        )

        user_details.append({
            "UserName": user.username,
            "NumberOfReports": user.report_count,
            "PopularReasons": top_reason or "-",
            "LastDate": user.last_date.strftime("%Y-%m-%d"),
            "Action": "", 
            "status": user.status or "Pending"
        })

    return {
        "reported_posts": post_details,
        "reported_users": user_details
    }

@router.get("/reports/{rid}")
def get_report_detail(
    rid: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.pid == rid).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reason_counts = (
        db.query(models.Report.reason, func.count(models.Report.rid))
        .filter(models.Report.post_id == rid)
        .group_by(models.Report.reason)
        .all()
    )
    report_categories = {reason: count for reason, count in reason_counts}

    last_report = (
        db.query(func.max(models.Report.created_at))
        .filter(models.Report.post_id == rid)
        .scalar()
    )

    total_reports = (
        db.query(func.count(models.Report.rid))
        .filter(models.Report.post_id == rid)
        .scalar()
    )

    status = (
        db.query(models.Report.status)
        .filter(models.Report.post_id == rid)
        .order_by(models.Report.created_at.desc())
        .limit(1)
        .scalar()
    ) or "Pending"

    user = db.query(models.User.username, models.User.profile_image).filter(models.User.uid == post.user_id).first()
    username = user.username if user else "-"
    avatar = user.profile_image if user and user.profile_image else "/images/default-avatar.png"


    return {
        "id": str(post.pid),
        "username": username or "-",
        "avatar": avatar,
        "content": post.post_content,
        "createdAt": post.created_at.isoformat(),
        "lastReportDate": last_report.strftime("%Y-%m-%d") if last_report else "-",
        "numberOfReports": total_reports,
        "reportCategories": report_categories,
        "status": status.capitalize()
    }

