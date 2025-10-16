from fastapi import status, HTTPException, Depends, APIRouter, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas, utils, oauth2
from ..database import get_db
import datetime
import shutil
import os


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


