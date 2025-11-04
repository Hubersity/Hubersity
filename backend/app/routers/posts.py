from fastapi import APIRouter, Depends, Form, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy.orm import joinedload
import os
import shutil
from .. import models, schemas, database, oauth2

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

get_db = database.get_db

UPLOAD_DIR = "uploads/post"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.PostResponse)
def create_post(
    post_content: str = Form(...),
    forum_id: int = Form(...),
    tags: Optional[str] = Form(None),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    forum = db.query(models.Forum).filter(models.Forum.fid == forum_id).first()
    if not forum:
        raise HTTPException(status_code=400, detail="Invalid forum_id")

    new_post = models.Post(
        post_content=post_content,
        forum_id=forum_id,
        user_id=current_user.uid,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    if tags:
        try:
            tag_ids = [int(t.strip()) for t in tags.split(",") if t.strip().isdigit()]
            tag_objects = db.query(models.PostTag).filter(models.PostTag.ptid.in_(tag_ids)).all()
            new_post.tags.extend(tag_objects)
            db.commit()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tag IDs")

    # ✅ บันทึกไฟล์แนบ
    for upload_file in files:
        filename = f"{new_post.pid}_{upload_file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        db.add(models.PostImage(
            post_id=new_post.pid,
            path=f"/{UPLOAD_DIR}/{filename}",
            caption=None
        ))
    db.commit()

    # ✅ ดึงโพสต์ใหม่อีกครั้ง พร้อม images
    refreshed_post = (
        db.query(models.Post)
        .options(
                joinedload(models.Post.images),
                joinedload(models.Post.tags),
                joinedload(models.Post.comments),
                joinedload(models.Post.user),
            )
        .filter(models.Post.pid == new_post.pid)
        .first()
    )
    db.refresh(refreshed_post)

    # ✅ คืนข้อมูลใหม่ที่มี images ด้วย
    return schemas.PostResponse(
        pid=refreshed_post.pid,
        post_content=refreshed_post.post_content,
        forum_id=refreshed_post.forum_id,
        user_id=refreshed_post.user_id,
        username=current_user.username,
        profile_image=current_user.profile_image,
        like_count=0,
        tags=refreshed_post.tags,
        images=refreshed_post.images,  # 🎯 ตรงนี้จะไม่ว่างอีกต่อไป
        comments=refreshed_post.comments
    )


@router.post("/{post_id}/upload-files")
def upload_post_files(
    post_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # ✅ Validate post ownership
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this post")

    # ✅ Prepare upload directory
    UPLOAD_DIR = "uploads/post"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    saved_files = []

    for upload_file in files:
        # ✅ Sanitize filename
        original_name = os.path.basename(upload_file.filename)
        filename = f"{post_id}_{original_name}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # ✅ Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # ✅ Create DB record
        image_record = models.PostImage(
            post_id=post_id,
            path=f"/{UPLOAD_DIR}/{filename}",
            caption=None
        )
        db.add(image_record)
        saved_files.append(image_record)

    db.commit()
    db.refresh(post)

    return {
        "message": f"{len(saved_files)} file(s) uploaded successfully",
        "files": [img.path for img in saved_files]
    }

    

@router.get("/me", response_model=List[schemas.PostResponse])
def get_my_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    posts = db.query(models.Post).filter(models.Post.user_id == current_user.uid).all()
    response = []

    for post in posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()
        response.append(
            schemas.PostResponse(
                pid=post.pid,
                post_content=post.post_content,
                forum_id=post.forum_id,
                user_id=post.user_id,
                username=post.user.username,
                profile_image=post.user.profile_image,
                like_count=like_count,
                tags=post.tags,
                images=post.images,
                comments=post.comments
            )
        )

    return response

@router.get("/all", response_model=List[schemas.PostResponse])
def get_all_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    posts = db.query(models.Post).order_by(models.Post.pid.desc()).all()
    
    response = []


    for post in posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()
        is_liked_by_me = db.query(models.Like).filter_by(post_id=post.pid, user_id=current_user.uid).first() is not None
        enriched_comments = []
        for c in post.comments:
            user = db.query(models.User).filter(models.User.uid == c.user_id).first()
            enriched_comments.append(
                schemas.CommentResponse(
                    cid=c.cid,
                    content=c.content,
                    user_id=c.user_id,
                    post_id=c.post_id,
                    username=user.username if user else None,
                    profile_image=user.profile_image if user else None,
                    created_at=c.created_at
                )
            )

        response.append(
            schemas.PostResponse(
                pid=post.pid,
                post_content=post.post_content,
                forum_id=post.forum_id,
                user_id=post.user_id,
                username=post.user.username,
                profile_image=post.user.profile_image,
                liked=is_liked_by_me,
                like_count=like_count,
                tags=post.tags,
                images=post.images,
                comments=enriched_comments
            )
        )

    return response

@router.get("/forum/{forum_id}", response_model=List[schemas.PostResponse])
def get_posts_by_forum(
    forum_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    posts = db.query(models.Post).filter(models.Post.forum_id == forum_id).order_by(models.Post.pid.desc()).all()
    response = []

    for post in posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()
        response.append(
            schemas.PostResponse(
                pid=post.pid,
                post_content=post.post_content,
                forum_id=post.forum_id,
                user_id=post.user_id,
                username=post.user.username,
                profile_image=post.user.profile_image,
                like_count=like_count,
                tags=post.tags,
                images=post.images,
                comments=post.comments
            )
        )
    return response

@router.get("/{post_id}", response_model=schemas.PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    like_count = db.query(models.Like).filter(models.Like.post_id == post_id).count()

    return schemas.PostResponse(
        pid=post.pid,
        post_content=post.post_content,
        forum_id=post.forum_id,
        user_id=post.user_id,
        username=post.user.username,
        profile_image=post.user.profile_image,
        like_count=like_count,
        tags=post.tags,
        images=post.images,
        comments=post.comments
    )


@router.put("/{post_id}", response_model=schemas.PostResponse)
def update_post(
    post_id: int,
    updated_post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    post.post_content = updated_post.post_content
    post.forum_id = updated_post.forum_id

    # Update tags if provided
    if updated_post.tags is not None:
        tag_objects = db.query(models.PostTag).filter(models.PostTag.ptid.in_(updated_post.tags)).all()
        post.tags = tag_objects

    db.commit()
    db.refresh(post)

    like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()

    return schemas.PostResponse(
        pid=post.pid,
        post_content=post.post_content,
        forum_id=post.forum_id,
        user_id=post.user_id,
        username=post.user.username,  
        profile_image=post.user.profile_image,
        like_count=like_count,        
        tags=post.tags,
        images=post.images,
        comments=post.comments
    )

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

    post.tags = []
    db.commit()
    post_query.delete(synchronize_session=False)
    db.commit()
    return

@router.post("/{post_id}/comments", response_model=schemas.CommentResponse)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = models.Comment(
        content=comment.content,
        user_id=current_user.uid,
        post_id=post_id,
        username=current_user.username
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return schemas.CommentResponse(
        cid=new_comment.cid,
        content=new_comment.content,
        user_id=new_comment.user_id,
        post_id=new_comment.post_id,
        username=current_user.username,
        profile_image=current_user.profile_image,
        created_at=new_comment.created_at
    )


@router.get("/{post_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments_for_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(models.Comment)
        .filter(models.Comment.post_id == post_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )

    response = []
    for c in comments:
        comment_data = schemas.CommentResponse.from_orm(c).dict()
        user = db.query(models.User).filter(models.User.uid == c.user_id).first()
        comment_data["username"] = user.username if user else None
        comment_data["profile_image"] = user.profile_image if user else None
        response.append(comment_data)

    return response

@router.post("/{post_id}/like")
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like = db.query(models.Like).filter_by(post_id=post_id, user_id=current_user.uid).first()
    if like:
        db.delete(like)
        db.commit()
        return {"message": "Like removed"}

    new_like = models.Like(post_id=post_id, user_id=current_user.uid)
    db.add(new_like)
    db.commit()
    return {"message": "Post liked successfully"}

@router.delete("/{post_id}/like")
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    like = db.query(models.Like).filter_by(post_id=post_id, user_id=current_user.uid).first()
    if not like:
        raise HTTPException(status_code=404, detail="You haven’t liked this post yet")

    
