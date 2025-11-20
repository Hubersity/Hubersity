from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from .. import database, schemas, models, utils, oauth2
import requests
from fastapi.responses import RedirectResponse
from ..config import (
    GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL, GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
)

router = APIRouter(tags=["Authentication"])

@router.post("/login")
def login(user_cred: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # ค้นหาผู้ใช้ด้วย email ที่ส่งมาจาก frontend
    user = db.query(models.User).filter(models.User.email == user_cred.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Credentials"
        )

    # ตรวจสอบ password
    if not utils.verify(user_cred.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Credentials"
        )

    # สร้าง access token
    access_token = oauth2.create_access_token(data={"user_id": user.uid})

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/login/google")
def google_login():
    return RedirectResponse(GOOGLE_AUTH_URL)

@router.get("/auth/google/callback")
def google_callback(code: str, db: Session = Depends(database.get_db)):
    
    # 1. Exchange code for access token
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    token_res = requests.post(GOOGLE_TOKEN_URL, data=token_data)
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve Google token")

    token_json = token_res.json()
    access_token = token_json.get("access_token")

    # 2. Get Google profile
    userinfo_res = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )

    if userinfo_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve Google user info")

    g_user = userinfo_res.json()

    google_id = g_user["sub"]
    email = g_user["email"]
    name = g_user.get("name", "")
    picture = g_user.get("picture")

    # 3. Check if user exists
    user = db.query(models.User).filter(
        models.User.oauth_provider == "google",
        models.User.oauth_id == google_id
    ).first()

    # 4. User exists? Use it. Otherwise create one.
    if not user:
        # Check if email already exists in local database
        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            user = models.User(
                username=email,          # Or generate unique username
                email=email,
                name=name,
                profile_image=picture,
                oauth_provider="google",
                oauth_id=google_id,
                password=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # 5. Generate JWT using your existing oauth2.py
    jwt_token = oauth2.create_access_token(data={"user_id": user.uid})

    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "email": user.email,
        "name": user.name
    }