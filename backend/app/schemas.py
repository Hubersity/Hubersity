from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import datetime, date
from typing import List, Optional, Dict, Literal
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.database import Base
import re

# สร้างบัญชีใหม่ (Sign Up)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

    name: Optional[str] = None
    birthdate: Optional[date] = None
    university: Optional[str] = None
    is_private: Optional[bool] = False
    description: Optional[str] = None
    profile_image: Optional[str] = None

    # ตรวจสอบ password 
    @field_validator("password")
    def password_rules(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character (!@#$...)")
        return v
    @field_validator("confirm_password")
    def passwords_match(cls, v, info):
        # info.data contains the raw input dict
        pw = info.data.get("password")
        if pw is not None and v != pw:
            raise ValueError("Passwords do not match")
        return v

# # ใช้เวลาส่งข้อมูล user ออกไปให้ frontend
# class UserOut(BaseModel):
#     uid: int
#     username: str
#     email: EmailStr
#     is_admin: bool

#     class Config:
#         orm_mode = True

# # ใช้เป็น response ตอน /login
# class LoginResponse(BaseModel):
#     access_token: str
#     username: str
#     uid: int
#     is_admin: bool
#     token_type: str = "bearer"

# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str

# ตอบกลับหลังจากสร้างบัญชี หรือดึงโปรไฟล์
class UserResponse(BaseModel):
    uid: int
    username: str
    email: EmailStr
    name: Optional[str] = None
    birthdate: Optional[date] = None
    university: Optional[str] = None
    is_private: bool
    description: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
    follower_count: int
    following_count: int


    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    birthdate: Optional[date] = None
    university: Optional[str] = None
    is_private: Optional[bool] = None 
    description: Optional[str] = None
    profile_image: Optional[str] = None

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBriefResponse(BaseModel):
    uid: int
    username: str
    name: Optional[str]
    profile_image: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class PostImageCreate(BaseModel):
    path: str
    caption: Optional[str] = None

class PostCreate(BaseModel):
    post_content: str
    forum_id: int
    tags: Optional[List[int]] = []           
    images: Optional[List[PostImageCreate]] = []

class PostImageResponse(BaseModel):
    id: int
    path: str
    caption: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class PostTagResponse(BaseModel):
    ptid: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class CommentCreate(BaseModel):
    content: str

class CommentFileResponse(BaseModel):
    id: int
    path: str
    file_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CommentResponse(BaseModel):
    cid: int
    content: str
    user_id: int
    username: str
    profile_image: Optional[str] = None
    created_at: datetime
    files: Optional[List[CommentFileResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class PostResponse(BaseModel):
    pid: int
    post_content: str
    forum_id: int
    user_id: int
    username: str
    like_count: int
    profile_image: Optional[str]
    liked: Optional[bool] = False
    tags: List[PostTagResponse] = []
    images: List[PostImageResponse] = []
    comments: List[CommentResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BanRequest(BaseModel):
    duration: str

class ReportRequest(BaseModel):
    reason: str

class AdminPost(BaseModel):
    id: str
    content: str
    createdAt: str
    likes: int
    comments: int
    status: str

class AdminUserDetailResponse(BaseModel):
    uid: int
    username: str
    fullName: str
    avatar: str
    bio: str
    numberOfReports: int
    reportCategories: Dict[str, int]
    status: str
    posts: List[AdminPost]

class NotificationCreate(BaseModel):
    title: str
    message: str
    receiver_id: Optional[int] = None
    target_role: Optional[str] = "admin"

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: Optional[str]
    sender_id: Optional[int]
    receiver_id: Optional[int]
    sender_username: Optional[str] = None
    sender_avatar: Optional[str] = None
    target_role: Optional[str]
    created_at: datetime
    is_read: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

    # class Config:
    #     from_attributes = True

class PostUpdate(BaseModel):
    post_content: Optional[str] = None
    forum_id: Optional[int] = None
    tags: Optional[List[int]] = None

class NewsBase(BaseModel):
    title: str
    summary: Optional[str] = None
    detail: Optional[str] = None
    hover_text: Optional[str] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = True


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    detail: Optional[str] = None
    hover_text: Optional[str] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = None


class NewsResponse(NewsBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class NewsOut(NewsBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
        
class BlockOut(BaseModel):
    blocker_id: int
    blocked_id: int


    class SomeModel(BaseModel):
        model_config = ConfigDict(from_attributes=True)

class HelpReportCreate(BaseModel):  # Pydantic
    user_id: int
    message: str


class HelpReportResponse(BaseModel):
    id: int
    message: str
    file_path: Optional[str]
    resolved: bool
    created_at: Optional[datetime]
    username: Optional[str] = None
    avatar: Optional[str] = None


    class SomeModel(BaseModel):
        model_config = ConfigDict(from_attributes=True)
