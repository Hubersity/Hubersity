from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
from typing import List
import datetime, shutil, os


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

# ดึงข้อมูลผู้ใช้ตาม id
@router.get("/{id}", response_model=schemas.UserResponse)
def get_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User id:{id} was not found"
        )
    return user


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
    
    # ป้องกันไม่ให้แก้ email / username / password
    protected_fields = {"username", "email", "password"}
    for key, value in updated_data.model_dump(exclude_unset=True).items():
        if key not in protected_fields:
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
    if id == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_user = db.query(models.User).filter(models.User.uid == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_follow = db.query(models.Follow).filter_by(follower_id=current_user.uid, following_id=id).first()

    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    follow = models.Follow(follower_id=current_user.uid, following_id=id)
    db.add(follow)
    db.commit()
    return {"message": f"You are now following user {id}"}

@router.delete("/{id}/follow", status_code=status.HTTP_200_OK)
def unfollow_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    follow = db.query(models.Follow).filter_by(follower_id=current_user.uid, following_id=id).first()

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
