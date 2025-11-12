from .models import User
from datetime import datetime
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from .oauth2 import get_current_user 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash(password: str):
    return pwd_context.hash(password)

def verify(plain_pass, hashed_pass):
    return pwd_context.verify(plain_pass, hashed_pass)

def check_ban_status(user: User = Depends(get_current_user)) -> User:
    if user.is_banned and user.ban_until:
        now = datetime.now()
        if user.ban_until > now:
            ban_until_str = user.ban_until.strftime("%Y-%m-%d %H:%M:%S")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{user.username} is banned until {ban_until_str}"
            )
    return user

