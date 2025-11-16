from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, oauth2
from ..database import get_db

router = APIRouter(
    prefix="/news",
    tags=["News"],
)

# helper: check admin
def require_admin(current_user: models.User = Depends(oauth2.get_current_user)):
    if not getattr(current_user, "is_admin", False):
        # แก้ตาม field จริงใน User model ถ้าใช้ชื่ออื่น เช่น role == "admin"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only",
        )
    return current_user


# ------------------ USER: PUBLIC NEWS ------------------ #

@router.get("/", response_model=List[schemas.NewsResponse])
def list_news(db: Session = Depends(get_db)):
    """ให้ user ทั่วไปเห็นเฉพาะข่าวที่ publish แล้ว"""
    items = (
        db.query(models.News)
        .filter(models.News.is_published == True)
        .order_by(models.News.created_at.desc())
        .all()
    )
    return items


@router.get("/{news_id}", response_model=schemas.NewsResponse)
def get_news(news_id: int, db: Session = Depends(get_db)):
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news or not news.is_published:
        # ถ้าอยากให้ admin ดู draft ได้ อาจต้องเช็ค role เพิ่ม
        raise HTTPException(status_code=404, detail="News not found")
    return news


# ------------------ ADMIN: MANAGE NEWS ------------------ #

@router.get("/admin/all", response_model=List[schemas.NewsResponse])
def admin_list_news(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    items = (
        db.query(models.News)
        .order_by(models.News.created_at.desc())
        .all()
    )
    return items


@router.post("/admin", response_model=schemas.NewsResponse, status_code=201)
def create_news(
    payload: schemas.NewsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    news = models.News(
        **payload.model_dump(),
        created_by=current_user.uid,
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return news


@router.put("/admin/{news_id}", response_model=schemas.NewsResponse)
def update_news(
    news_id: int,
    payload: schemas.NewsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(news, k, v)

    db.commit()
    db.refresh(news)
    return news


@router.delete("/admin/{news_id}", status_code=204)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    db.delete(news)
    db.commit()
    return