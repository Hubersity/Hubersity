from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from datetime import timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(oauth2.get_admin_user)]
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
def get_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_admin_user)):
    user_count = db.query(models.User).count()
    post_count = db.query(models.Post).count()

    
    uni_counts = (
        db.query(models.User.university, func.count(models.User.uid)).group_by(models.User.university).all()
    )

    return {
        "user_count": user_count,
        "post_count": post_count,
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
def unban_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(oauth2.get_admin_user)):
    user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_banned = False
    user.ban_until = None
    db.commit()

    return {"message": f"User {user.username} has been unbanned"}

