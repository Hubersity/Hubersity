from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from .. import database, schemas, models, utils, oauth2

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