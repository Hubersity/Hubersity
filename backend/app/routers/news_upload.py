from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from sqlalchemy.orm import Session
import os, uuid
from app import models
from app.database import get_db

router = APIRouter()

BASE_UPLOAD_DIR = "uploads"
NEWS_UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "news")
os.makedirs(NEWS_UPLOAD_DIR, exist_ok=True)


@router.post("/news/{news_id}/upload-image")
async def upload_news_image(
    news_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    # Folder of each news id => uploads/news/<id>/
    upload_dir = os.path.join(NEWS_UPLOAD_DIR, str(news_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(upload_dir, filename)

    # Write files to disk
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # The path that the frontend uses to call
    rel_path = f"/uploads/news/{news_id}/{filename}"

    news.image_url = rel_path
    db.commit()
    db.refresh(news)

    return {"image_url": rel_path, "id": news.id}
