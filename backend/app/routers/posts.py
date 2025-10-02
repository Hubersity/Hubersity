from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, database, oauth2

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

get_db = database.get_db

# ------------------- Create Post -------------------
@router.post("/", response_model=schemas.PostResponse)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    new_post = models.Post(
        post_content=post.post_content,
        forum_id=post.forum_id,
        user_id=current_user.uid
    )
    if post.tags:
            new_post.tags = db.query(models.PostTag).filter(models.PostTag.ptid.in_(post.tags)).all()

    # Attach images
    if post.images:
        new_post.images = [models.PostImage(url=img.url, caption=img.caption) for img in post.images]

    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post
    

# ------------------- Get Current User Posts -------------------
@router.get("/me", response_model=List[schemas.PostResponse])
def get_my_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    posts = db.query(models.Post).filter(models.Post.user_id == current_user.uid).all()
    return posts

# ------------------- Update Post -------------------
@router.put("/{post_id}", response_model=schemas.PostResponse)
def update_post(
    post_id: int,
    updated_post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post_query = db.query(models.Post).filter(models.Post.pid == post_id)
    post = post_query.first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    post_query.update({
        "post_name": updated_post.post_name,
        "body": updated_post.body,
        "forum_id": updated_post.forum_id
    }, synchronize_session=False)
    db.commit()
    return post_query.first()

# ------------------- Delete Post -------------------
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post_query = db.query(models.Post).filter(models.Post.pid == post_id)
    post = post_query.first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.query(models.PostImage).filter(models.PostImage.post_id == post_id).delete()
    post_query.delete(synchronize_session=False)
    db.commit()
    return
