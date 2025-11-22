from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from datetime import timedelta
from sqlalchemy import func, distinct, desc, or_
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os
from ..models import User, Post, Report
from ..schemas import AdminUserDetailResponse


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
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


@router.get("/reports/users/{username}", response_model=AdminUserDetailResponse)
def get_reported_user_detail(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    post_ids = db.query(Post.pid).filter(Post.user_id == user.uid).subquery()

    post_reports = db.query(Report).filter(Report.post_id.in_(post_ids)).all()
    user_reports = db.query(Report).filter(Report.user_id == user.uid).all()
    all_reports = post_reports + user_reports

    report_categories = {}
    for r in all_reports:
        reason = r.reason or "Unspecified"
        report_categories[reason] = report_categories.get(reason, 0) + 1

    posts = db.query(Post).filter(Post.user_id == user.uid).order_by(Post.created_at.desc()).all()

    return {
        "uid": user.uid,
        "username": user.username,
        "fullName": user.name,
        "avatar": user.profile_image,
        "bio": user.description,
        "numberOfReports": len(all_reports),
        "reportCategories": report_categories,
        "status": "Banned" if user.is_banned else ("Pending Ban" if user.ban_until else "Active"),
        "action": "",
        "posts": [
            {
                "id": str(post.pid),
                "content": post.post_content,
                "createdAt": post.created_at.isoformat(),
                "likes": len(post.likes),
                "comments": len(post.comments),
                "status": "Reported" if any(r.post_id == post.pid for r in post_reports) else "Normal",
            }
            for post in posts
        ],
    }


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

    reported_comment_count = db.query(func.count(distinct(models.Report.comment_id))).scalar()

    uni_counts = (db.query(models.User.university, func.count(models.User.uid)).group_by(models.User.university).all())

    return {
        "user_count": user_count,
        "post_count": post_count,
        "reported_post_count": reported_post_count,
        "reported_user_count": reported_user_count,
        "reported_comment_count": reported_comment_count,
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

    user_post_ids = db.query(models.Post.pid).filter(models.Post.user_id == user_id).subquery()

    reports = db.query(models.Report).filter(models.Report.post_id.in_(user_post_ids)).all()
    for report in reports:
        report.status = "Resolved"
    
    user_comment_ids = db.query(models.Comment.cid).filter(models.Comment.user_id == user_id).subquery()
    comment_reports = db.query(models.Report).filter(models.Report.comment_id.in_(user_comment_ids)).all()
    for report in comment_reports:
        report.status = "Resolved"

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


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.query(models.PostImage).filter(models.PostImage.post_id == post_id).delete()

    post.tags.clear()
    db.delete(post)
    db.commit()
    return


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    comment = db.query(models.Comment).filter(models.Comment.cid == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    noti = db.query(models.Notification).filter_by(
        title="Comment",
        sender_id=comment.user_id,
    ).first()
    if noti:
        db.delete(noti)

    db.delete(comment)
    db.commit()
    return


@router.get("/reports")
def get_reported_data(db: Session = Depends(get_db)):
    # Reported Posts
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

    # Reported Comments
    reported_comments = (
        db.query(
            models.Report.comment_id.label("comment_id"),
            models.Comment.content.label("content"),
            func.count(models.Report.rid).label("report_count"),
            func.max(models.Report.created_at).label("last_date"),
            func.max(models.Report.status).label("status"),
        )
        .join(models.Comment, models.Comment.cid == models.Report.comment_id)
        .group_by(models.Report.comment_id, models.Comment.content)
        .all()
    )

    comment_details = []
    for comment in reported_comments:
        top_reason = (
            db.query(models.Report.reason)
            .filter(models.Report.comment_id == comment.comment_id)
            .group_by(models.Report.reason)
            .order_by(desc(func.count(models.Report.reason)))
            .limit(1)
            .scalar()
        )

        comment_details.append({
            "Comment_ID": comment.comment_id,
            "Comment_Content": comment.content,
            "NumberOfReports": comment.report_count,
            "PopularReasons": top_reason or "-",
            "LastDate": comment.last_date.strftime("%Y-%m-%d"),
            "Action": "",
            "status": comment.status or "Pending"
        })

    # Unified Reported Users
    all_user_reports = (
        db.query(
            models.User.uid.label("uid"),
            models.User.username.label("username"),
            models.User.is_banned.label("is_banned"),
            models.Report.reason.label("reason"),
            models.Report.created_at.label("created_at"),
            models.Report.status.label("status")
        )
        .outerjoin(models.Post, models.Post.user_id == models.User.uid)
        .outerjoin(models.Comment, models.Comment.user_id == models.User.uid)
        .outerjoin(
            models.Report,
            or_(
                models.Report.user_id == models.User.uid,
                models.Report.post_id == models.Post.pid,
                models.Report.comment_id == models.Comment.cid
            )
        )

        .filter(models.Report.rid.isnot(None))
        .all()
    )

    # Aggregate by user
    user_map = {}
    for r in all_user_reports:
        if r.uid not in user_map:
            user_map[r.uid] = {
                "UserName": r.username,
                "NumberOfReports": 0,
                "PopularReasons": {},
                "LastDate": r.created_at,
                "Action": "",
                "status": "Banned" if r.is_banned else "Active"
            }

        user_entry = user_map[r.uid]
        user_entry["NumberOfReports"] += 1
        user_entry["LastDate"] = max(user_entry["LastDate"], r.created_at)
        reason = r.reason or "Unspecified"
        user_entry["PopularReasons"][reason] = user_entry["PopularReasons"].get(reason, 0) + 1

    # Format top reason and final structure
    user_details = []
    for user in user_map.values():
        top_reason = max(user["PopularReasons"].items(), key=lambda x: x[1])[0]
        user_details.append({
            "UserName": user["UserName"],
            "NumberOfReports": user["NumberOfReports"],
            "PopularReasons": top_reason,
            "LastDate": user["LastDate"].strftime("%Y-%m-%d"),
            "Action": user["Action"],
            "status": user["status"]
        })

    return {
        "reported_posts": post_details,
        "reported_comments": comment_details,
        "reported_users": user_details
    }


@router.get("/reports/{pid}")
def get_report_detail(
    pid: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.pid == pid).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reason_counts = (
        db.query(models.Report.reason, func.count(models.Report.rid))
        .filter(models.Report.post_id == pid)
        .group_by(models.Report.reason)
        .all()
    )
    report_categories = {reason: count for reason, count in reason_counts}

    last_report = (
        db.query(func.max(models.Report.created_at))
        .filter(models.Report.post_id == pid)
        .scalar()
    )

    total_reports = (
        db.query(func.count(models.Report.rid))
        .filter(models.Report.post_id == pid)
        .scalar()
    )

    status = (
        db.query(models.Report.status)
        .filter(models.Report.post_id == pid)
        .order_by(models.Report.created_at.desc())
        .limit(1)
        .scalar()
    ) or "Pending"

    user = db.query(models.User.username, models.User.profile_image).filter(models.User.uid == post.user_id).first()
    username = user.username if user else "-"
    avatar = user.profile_image if user and user.profile_image else "/images/default-avatar.png"

    return {
        "id": str(post.pid),
        "uid": post.user_id,
        "username": username or "-",
        "avatar": avatar,
        "content": post.post_content,
        "createdAt": post.created_at.isoformat(),
        "lastReportDate": last_report.strftime("%Y-%m-%d") if last_report else "-",
        "numberOfReports": total_reports,
        "reportCategories": report_categories,
        "status": status.capitalize()
    }


@router.get("/reports/comment/{cid}")
def get_comment_report_detail(
    cid: int,
    db: Session = Depends(get_db),
):
    comment = db.query(models.Comment).filter(models.Comment.cid == cid).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Count reasons
    reason_counts = (
        db.query(models.Report.reason, func.count(models.Report.rid))
        .filter(models.Report.comment_id == cid)
        .group_by(models.Report.reason)
        .all()
    )
    report_categories = {reason: count for reason, count in reason_counts}

    # Last report date
    last_report = (
        db.query(func.max(models.Report.created_at))
        .filter(models.Report.comment_id == cid)
        .scalar()
    )

    # Total reports
    total_reports = (
        db.query(func.count(models.Report.rid))
        .filter(models.Report.comment_id == cid)
        .scalar()
    )

    # Latest status
    status = (
        db.query(models.Report.status)
        .filter(models.Report.comment_id == cid)
        .order_by(models.Report.created_at.desc())
        .limit(1)
        .scalar()
    ) or "Pending"

    # Comment owner info
    user = (
        db.query(models.User.username, models.User.profile_image)
        .filter(models.User.uid == comment.user_id)
        .first()
    )
    username = user.username if user else "-"
    avatar = user.profile_image if user and user.profile_image else "/images/default-avatar.png"

    return {
        "id": str(comment.cid),
        "uid": comment.user_id,
        "username": username or "-",
        "avatar": avatar,
        "content": comment.content,
        "createdAt": comment.created_at.isoformat(),
        "lastReportDate": last_report.strftime("%Y-%m-%d") if last_report else "-",
        "numberOfReports": total_reports,
        "reportCategories": report_categories,
        "status": status.capitalize(),
    }


@router.get("/user")
def get_user_notifications_query(
    receiver_id: int,
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.receiver_id == receiver_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "created_at": n.created_at,
            "sender_id": n.sender_id,
            "target_role": n.target_role
        }
        for n in notifications
    ]
