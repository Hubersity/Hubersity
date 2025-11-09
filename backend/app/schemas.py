from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, date
from typing import List, Optional
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
    privacy: Optional[str] = "private"
    description: Optional[str] = None
    profile_image: Optional[str] = None

    # ตรวจสอบ password 
    @validator("password")
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

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v


# ตอบกลับหลังจากสร้างบัญชี หรือดึงโปรไฟล์
class UserResponse(BaseModel):
    uid: int
    username: str
    email: EmailStr
    name: Optional[str] = None
    birthdate: Optional[date] = None
    university: Optional[str] = None
    privacy: Optional[str] = None
    description: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
    follower_count: int
    following_count: int


    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    birthdate: Optional[date] = None
    university: Optional[str] = None
    privacy: Optional[str] = None
    description: Optional[str] = None
    profile_image: Optional[str] = None



class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBriefResponse(BaseModel):
    uid: int
    username: str
    name: Optional[str]
    profile_image: Optional[str]

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True

class PostTagResponse(BaseModel):
    ptid: int
    name: str

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    cid: int
    content: str
    user_id: int
    username: str
    profile_image: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True