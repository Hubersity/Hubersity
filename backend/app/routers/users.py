from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os
from .notification import create_notification_template
from pydantic import BaseModel, validator
import re
from sqlalchemy import or_

router = APIRouter(
    prefix="/users",
    tags=["Users"]
    
)


# สมัครผู้ใช้ใหม่ (Sign Up)
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # ตรวจซ้ำ email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already in use"
        )
    
    # ตรวจซ้ำ username
    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )
    
    # แฮชรหัสผ่านก่อนเก็บ
    hashed_pwd = utils.hash(user.password)
    user.password = hashed_pwd

    # สร้าง user ใหม่ (ยกเว้น confirm_password)
    new_user = models.User(**user.model_dump(exclude={"confirm_password"}))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = oauth2.create_access_token(data={"user_id": new_user.uid})


    return new_user

# ดึงข้อมูลผู้ใช้ปัจจุบัน (ใช้ JWT token)
@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == current_user.uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.patch("/me/privacy")
def update_privacy(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    is_private = data.get("is_private")

    if is_private is None:
        raise HTTPException(status_code=400, detail="Missing is_private")

    current_user.is_private = bool(is_private)
    db.commit()
    db.refresh(current_user)

    return {"message": "Privacy updated", "is_private": current_user.is_private}

# แก้ไขข้อมูลโปรไฟล์
@router.put("/{id}", response_model=schemas.UserResponse)
def update_user(
    id: int,
    updated_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User id:{id} was not found"
        )
    
    protected_fields = {"username", "email", "password"}

    # รองรับ is_private
    if updated_data.is_private is not None:
        user.is_private = updated_data.is_private

    for key, value in updated_data.model_dump(exclude_unset=True).items():
        if key not in protected_fields and key != "is_private":
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user



@router.post("/upload-avatar")
def upload_user_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    UPLOAD_DIR = "uploads/user"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    filename = f"{current_user.uid}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save path to user model
    current_user.profile_image = f"/{UPLOAD_DIR}/{filename}"
    db.commit()
    db.refresh(current_user)

    return {"filename": current_user.profile_image}

@router.post("/{id}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # ห้าม follow ตัวเอง
    if id == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    # target user
    target_user = db.query(models.User).filter(models.User.uid == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # เช็คว่า follow อยู่แล้วหรือยัง
    existing_follow = db.query(models.Follow).filter_by(
        follower_id=current_user.uid,
        following_id=id
    ).first()

    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    # ---------------------------------------
    # PRIVATE ACCOUNT → ส่ง follow request
    # ---------------------------------------
    if target_user.is_private:

        # เช็คว่า request ค้างอยู่ไหม
        existing_req = db.query(models.FollowRequest).filter(
            models.FollowRequest.requester_id == current_user.uid,
            models.FollowRequest.receiver_id == id,
            models.FollowRequest.status == "pending",
        ).first()

        if existing_req:
            return {
                "mode": "request",
                "message": "Follow request already sent"
            }

        follow_req = models.FollowRequest(
            requester_id=current_user.uid,
            receiver_id=id,
            status="pending",
        )

        db.add(follow_req)

        # แจ้งเตือน
        try:
            create_notification_template(
                db=db,
                current_user=current_user,
                payload_data={
                    "title": "Follow Request",
                    "receiver_id": id,
                    "target_role": "user",
                    "message": f"{current_user.username} requested to follow you",
                },
            )
        except Exception as e:
            print("Error creating follow-request notification:", e)

        db.commit()
        db.refresh(follow_req)

        return {
            "mode": "request",
            "message": "Follow request sent",
            "request_id": follow_req.id,
        }

    # ---------------------------------------
    # PUBLIC ACCOUNT → follow ได้ทันที
    # ---------------------------------------
    follow = models.Follow(
        follower_id=current_user.uid,
        following_id=id
    )
    db.add(follow)
    db.commit()

    return {
        "mode": "follow",
        "message": f"You are now following user {id}"
    }


@router.delete("/{id}/follow", status_code=status.HTTP_200_OK)
def unfollow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    follow = db.query(models.Follow).filter_by(
        follower_id=current_user.uid,
        following_id=id
    ).first()

    if not follow:
        raise HTTPException(status_code=404, detail="You are not following this user")

    db.delete(follow)
    db.commit()

    return {"message": f"You have unfollowed user {id}"}

@router.get("/me/followers", response_model=List[schemas.UserBriefResponse])
def get_my_followers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    follows = db.query(models.Follow).filter(models.Follow.following_id == current_user.uid).all()
    response = []

    for f in follows:
        follower = db.query(models.User).filter(models.User.uid == f.follower_id).first()
        if follower:
            response.append(
                schemas.UserBriefResponse(
                    uid=follower.uid,
                    username=follower.username,
                    name=follower.name,
                    profile_image=follower.profile_image
                )
            )
    return response

@router.get("/me/following", response_model=List[schemas.UserBriefResponse])
def get_my_following(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    follows = db.query(models.Follow).filter(models.Follow.follower_id == current_user.uid).all()
    response = []

    for f in follows:
        followed = db.query(models.User).filter(models.User.uid == f.following_id).first()
        if followed:
            response.append(
                schemas.UserBriefResponse(
                    uid=followed.uid,
                    username=followed.username,
                    name=followed.name,
                    profile_image=followed.profile_image
                )
            )
    return response



@router.get("/{id}/followers", response_model=List[schemas.UserBriefResponse])
def get_user_followers(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    target_user = db.query(models.User).filter(models.User.uid == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    follows = db.query(models.Follow).filter(models.Follow.following_id == id).all()
    response = []

    for f in follows:
        follower = db.query(models.User).filter(models.User.uid == f.follower_id).first()
        if follower:
            response.append(
                schemas.UserBriefResponse(
                    uid=follower.uid,
                    username=follower.username,
                    name=follower.name,
                    profile_image=follower.profile_image
                )
            )

    return response

@router.get("/{id}/following", response_model=List[schemas.UserBriefResponse])
def get_user_following(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    target_user = db.query(models.User).filter(models.User.uid == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    follows = db.query(models.Follow).filter(models.Follow.follower_id == id).all()
    response = []

    for f in follows:
        followed = db.query(models.User).filter(models.User.uid == f.following_id).first()
        if followed:
            response.append(
                schemas.UserBriefResponse(
                    uid=followed.uid,
                    username=followed.username,
                    name=followed.name,
                    profile_image=followed.profile_image
                )
            )

    return response

@router.post("/{user_id}/report", status_code=status.HTTP_201_CREATED)
def report_user(
    user_id: int,
    report_data: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    report = models.Report(
        user_id=user_id,
        reporter_id=current_user.uid,
        report_type="user",
        reason=report_data.reason
    )
    db.add(report)

    noti_payload = {
        "title": "ReportUser",
        "receiver_id": user_id,
        "target_role": "admin"
    }

    try:
        create_notification_template(
            db=db,
            current_user=current_user,
            payload_data=noti_payload
        )
    except Exception as e:
        print(f"Error creating internal notification: {e}")

    db.commit()
    return {"message": "User report submitted"}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

    @validator("new_password")
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character (!@#$...)")
        return v

    @validator("confirm_new_password")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v
    
@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):

    user = db.query(models.User).filter(models.User.uid == current_user.uid).first()

    # 1) ตรวจสอบรหัสเดิม
    if not utils.verify(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # 2) ห้ามใช้รหัสเดิมซ้ำ
    if utils.verify(data.new_password, user.password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as old password")

    # 3) แฮชและบันทึก
    hashed_new = utils.hash(data.new_password)
    user.password = hashed_new

    db.commit()
    db.refresh(user)

    return {"message": "Password changed successfully"}

@router.delete("/delete", status_code=200)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    user = db.query(models.User).filter(models.User.uid == current_user.uid).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ลบ user
    db.delete(user)
    db.commit()

    return {"message": "Account deleted successfully"}

@router.get("/{id}")
def get_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User id:{id} was not found"
        )

    # ❗︎ เช็คว่า current_user follow อยู่ไหม
    is_following = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.uid,
        models.Follow.following_id == id
    ).first()

    # ❗︎ logic ให้ frontend รู้ว่าเห็นโพสต์ได้ไหม
    can_view = (not user.is_private) or bool(is_following)

    return {
        "uid": user.uid,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "birthdate": user.birthdate,
        "university": user.university,
        "profile_image": user.profile_image,
        "description": user.description,
        "is_private": user.is_private,
        "can_view": can_view
    }