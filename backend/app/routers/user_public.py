from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from sqlalchemy import or_


router = APIRouter(
    prefix="/users",
    tags=["Users Public"]
)


@router.get("/search")
def search_users(q: str, db: Session = Depends(get_db)):
    users = (
        db.query(models.User)
        .filter(
            or_(
                models.User.username.ilike(f"%{q}%"),
                models.User.name.ilike(f"%{q}%")
            )
        )
        .all()
    )

    return [
        {
            "uid": u.uid,
            "username": u.username,
            "name": u.name,
            "profile_image": u.profile_image
        }
        for u in users
    ]
