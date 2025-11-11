from fastapi import APIRouter, Depends, Form, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy.orm import joinedload
import os
import shutil
from .notification import create_notification_template
from .. import models, schemas, database, oauth2, utils

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

get_db = database.get_db

UPLOAD_DIR = "uploads/post"
COMMENT_UPLOAD_DIR = "uploads/comments"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(COMMENT_UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.PostResponse)
def create_post(
    post_content: str = Form(...),
    forum_id: int = Form(...),
    tags: Optional[str] = Form(None),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.check_ban_status)
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

    # บันทึกไฟล์แนบ
    for upload_file in files:
        filename = f"{new_post.pid}_{upload_file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        mime_type = upload_file.content_type or "application/octet-stream"

        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            file_type = "image"
        elif ext in [".mp4", ".mov", ".avi", ".mkv"]:
            file_type = "video"
        elif ext in [".pdf"]:
            file_type = "pdf"
        else:
            file_type = "file"

        # บันทึกโดยไม่อ้างถึงคอลัมน์ที่อาจยังไม่มีใน DB
        try:
            db.add(models.PostImage(
                post_id=new_post.pid,
                path=f"/{UPLOAD_DIR}/{filename}",
                caption=None,
                file_type=file_type,   # ใช้ได้ถ้ามีใน model
            ))
        except TypeError:
            # ถ้า model ยังไม่มี column file_type ให้ fallback
            db.add(models.PostImage(
                post_id=new_post.pid,
                path=f"/{UPLOAD_DIR}/{filename}",
                caption=None
            ))
    db.commit()

    # ดึงโพสต์ใหม่อีกครั้ง พร้อม images
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

    # คืนข้อมูลใหม่ที่มี images ด้วย
    return schemas.PostResponse(
        pid=refreshed_post.pid,
        post_content=refreshed_post.post_content,
        forum_id=refreshed_post.forum_id,
        user_id=refreshed_post.user_id,
        username=current_user.username,
        like_count=0,
        liked=False,
        profile_image=current_user.profile_image,
        tags=refreshed_post.tags,
        images=refreshed_post.images, 
        comments=refreshed_post.comments,
        created_at=refreshed_post.created_at
    )


@router.post("/{post_id}/upload-files")
def upload_post_files(
    post_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Validate post ownership
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this post")

    # Prepare upload directory
    UPLOAD_DIR = "uploads/post"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    saved_files = []

    for upload_file in files:
        # Sanitize filename
        original_name = os.path.basename(upload_file.filename)
        filename = f"{post_id}_{original_name}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        mime_type = upload_file.content_type or "application/octet-stream"

        # Create DB record
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            file_type = "image"
        elif ext in [".mp4", ".mov", ".avi", ".mkv"]:
            file_type = "video"
        elif ext in [".pdf"]:
            file_type = "pdf"
        else:
            file_type = "file"

        try:
            image_record = models.PostImage(
                post_id=post_id,
                path=f"/{UPLOAD_DIR}/{filename}",
                caption=None,
                file_type=file_type,
            )
        except TypeError:
            image_record = models.PostImage(
                post_id=post_id,
                path=f"/{UPLOAD_DIR}/{filename}",
                caption=None
            )

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
                comments=post.comments,
                created_at=post.created_at
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

            # ดึงไฟล์แนบของคอมเมนต์
            files = db.query(models.CommentFile).filter(models.CommentFile.comment_id == c.cid).all()
            files_response = [
                schemas.CommentFileResponse(
                    id=f.id,
                    path=f.path,
                    file_type=f.file_type
                )
                for f in files
            ]

            enriched_comments.append(
                schemas.CommentResponse(
                    cid=c.cid,
                    content=c.content,
                    user_id=c.user_id,
                    post_id=c.post_id,
                    username=user.username if user else None,
                    profile_image=user.profile_image if user else None,
                    created_at=c.created_at,
                    files=files_response   
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
                comments=enriched_comments,
                created_at=post.created_at
            )
        )

    return response

@router.get("/", response_model=List[schemas.PostResponse])
def get_posts(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # เริ่มต้น query หลัก
    query = db.query(models.Post)

    # ถ้ามี user_id → ดึงเฉพาะโพสต์ของคนนั้น
    if user_id is not None:
        query = query.filter(models.Post.user_id == user_id)

    # เรียงโพสต์จากใหม่ไปเก่า
    posts = (
        query.options(
            joinedload(models.Post.images),
            joinedload(models.Post.tags),
            joinedload(models.Post.comments),
            joinedload(models.Post.user)
        )
        .order_by(models.Post.created_at.desc())
        .all()
    )

    response = []

    for post in posts:
        # นับจำนวนไลก์
        like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()

        # enrich ข้อมูลคอมเมนต์
        enriched_comments = []
        for c in post.comments:
            user = db.query(models.User).filter(models.User.uid == c.user_id).first()

            # ดึงไฟล์แนบของคอมเมนต์
            files = db.query(models.CommentFile).filter(models.CommentFile.comment_id == c.cid).all()
            files_response = [
                schemas.CommentFileResponse(
                    id=f.id,
                    path=f.path,
                    file_type=f.file_type
                )
                for f in files
            ]

            enriched_comments.append(
                schemas.CommentResponse(
                    cid=c.cid,
                    content=c.content,
                    user_id=c.user_id,
                    post_id=c.post_id,
                    username=user.username if user else None,
                    profile_image=user.profile_image if user else None,
                    created_at=c.created_at,
                    files=files_response  
                )
            )

        # เพิ่มข้อมูลแต่ละโพสต์ลง response
        response.append(
            schemas.PostResponse(
                pid=post.pid,
                post_content=post.post_content,
                forum_id=post.forum_id,
                user_id=post.user_id,
                username=post.user.username if post.user else "Unknown",
                profile_image=post.user.profile_image if post.user else None,
                like_count=like_count,
                tags=post.tags,
                images=post.images,
                comments=enriched_comments,
                created_at=post.created_at
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
                comments=post.comments,
                created_at=post.created_at
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

    # ✅ Serialize comments
    serialized_comments = [
    schemas.CommentResponse(
        cid=comment.cid,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else "Unknown",
        profile_image=comment.user.profile_image if comment.user else None,
        content=comment.content,
        created_at=comment.created_at
    )
    for comment in post.comments
]

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
        comments=serialized_comments
    )


@router.put("/{post_id}", response_model=schemas.PostResponse)
def update_post(
    post_id: int,
    updated_post: schemas.PostUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.check_ban_status)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    if updated_post.post_content is not None:
        post.post_content = updated_post.post_content
    if updated_post.forum_id is not None:
        post.forum_id = updated_post.forum_id
    if updated_post.tags is not None:
        tag_objects = db.query(models.PostTag).filter(models.PostTag.ptid.in_(updated_post.tags)).all()
        post.tags = tag_objects

    db.commit()
    db.refresh(post)

    like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()

    # ดึง comments พร้อม user และไฟล์แนบ
    enriched_comments = []
    for c in post.comments:
        user = db.query(models.User).filter(models.User.uid == c.user_id).first()
        files = db.query(models.CommentFile).filter(models.CommentFile.comment_id == c.cid).all()

        files_response = [
            schemas.CommentFileResponse(
                id=f.id,
                path=f.path,
                file_type=f.file_type
            )
            for f in files
        ]

        enriched_comments.append(
            schemas.CommentResponse(
                cid=c.cid,
                content=c.content,
                user_id=c.user_id,
                post_id=c.post_id,
                username=user.username if user else None,
                profile_image=user.profile_image if user else None,
                created_at=c.created_at,
                files=files_response
            )
        )

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
        comments=enriched_comments, 
        created_at=post.created_at
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
async def create_comment(
    post_id: int,
    content: str = Form(""), 
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.check_ban_status)
):
    # ตรวจสอบว่าโพสต์มีอยู่จริงไหม
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # สร้างคอมเมนต์ใหม่
    new_comment = models.Comment(
        content=content,
        user_id=current_user.uid,
        post_id=post_id,
        username=current_user.username
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # ถ้ามีไฟล์แนบ
    saved_files = []
    if files:
        for upload_file in files:
            # สร้างชื่อไฟล์ใหม่ ป้องกันซ้ำ
            filename = f"{new_comment.cid}_{upload_file.filename}"
            file_path = os.path.join(COMMENT_UPLOAD_DIR, filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)

            ext = os.path.splitext(upload_file.filename)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
                file_type = "image"
            elif ext in [".mp4", ".mov", ".avi", ".mkv"]:
                file_type = "video"
            elif ext in [".pdf"]:
                file_type = "pdf"
            else:
                file_type = "file"

            # บันทึกลงตาราง comment_files (ต้องมีใน models.py)
            file_record = models.CommentFile(
                comment_id=new_comment.cid,
                path=f"/{COMMENT_UPLOAD_DIR}/{filename}",
                file_type=file_type
            )
            db.add(file_record)
            saved_files.append(file_record)
        db.commit()

    # ดึงไฟล์ที่เพิ่งบันทึกใหม่ทั้งหมด (มี id แล้ว)
    db.refresh(new_comment)
    files_response = []
    for f in new_comment.files:
        files_response.append(
            schemas.CommentFileResponse(
                id=f.id,
                path=f.path,
                file_type=f.file_type
            )
        )

    # เตรียมส่งกลับไปให้ Frontend
    return schemas.CommentResponse(
        cid=new_comment.cid,
        content=new_comment.content,
        user_id=new_comment.user_id,
        post_id=new_comment.post_id,
        username=current_user.username,
        profile_image=current_user.profile_image,
        created_at=new_comment.created_at,
        files=files_response
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
        user = db.query(models.User).filter(models.User.uid == c.user_id).first()

        # ดึงไฟล์แนบของคอมเมนต์ (CommentFile)
        files = db.query(models.CommentFile).filter(models.CommentFile.comment_id == c.cid).all()
        files_response = [
            schemas.CommentFileResponse(
                id=f.id,
                path=f.path,
                file_type=f.file_type
            ) for f in files
        ]

        # รวมข้อมูลทั้งหมดกลับไป
        response.append(
            schemas.CommentResponse(
                cid=c.cid,
                content=c.content,
                user_id=c.user_id,
                post_id=c.post_id,
                username=user.username if user else None,
                profile_image=user.profile_image if user else None,
                created_at=c.created_at,
                files=files_response  # ตรงนี้คือของที่หายไป
            )
        )

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

@router.post("/{post_id}/report", status_code=status.HTTP_201_CREATED)
def report_post(
    post_id: int,
    report_data: schemas.ReportRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    post = db.query(models.Post).filter(models.Post.pid == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    report = models.Report(
        post_id=post_id,
        reporter_id=current_user.uid,
        report_type="post",
        reason=report_data.reason
    )
    db.add(report)

    noti_payload = {
        "title": "ReportPost",
        "receiver_id": post_id,
        "target_role": "admin"
    }

    try:
        create_notification_template(
            db=db,
            current_user=current_user,
            payload_data=noti_payload
        )
    except Exception as e:
        print(f"Error creating internal notification: {e}")

    db.commit()
    return {"message": "Post report submitted"}



    
@router.get("/{id}/posts", response_model=List[schemas.PostResponse])
def get_user_posts(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.uid == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # preload ความสัมพันธ์ทั้งหมด (เหมือน /posts)
    posts = (
        db.query(models.Post)
        .options(
            joinedload(models.Post.images),
            joinedload(models.Post.tags),
            joinedload(models.Post.comments),
            joinedload(models.Post.user)
        )
        .filter(models.Post.user_id == id)
        .order_by(models.Post.created_at.desc())
        .all()
    )

    response = []
    for post in posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == post.pid).count()

        # enrich comments พร้อม username/profile
        enriched_comments = []
        for c in post.comments:
            user = db.query(models.User).filter(models.User.uid == c.user_id).first()

            # ดึงไฟล์แนบของคอมเมนต์
            files = db.query(models.CommentFile).filter(models.CommentFile.comment_id == c.cid).all()
            files_response = [
                schemas.CommentFileResponse(
                    id=f.id,
                    path=f.path,
                    file_type=f.file_type
                )
                for f in files
            ]

            enriched_comments.append(
                schemas.CommentResponse(
                    cid=c.cid,
                    content=c.content,
                    user_id=c.user_id,
                    post_id=c.post_id,
                    username=user.username if user else None,
                    profile_image=user.profile_image if user else None,
                    created_at=c.created_at,
                    files=files_response  
                )
            )

        response.append(
            schemas.PostResponse(
                pid=post.pid,
                post_content=post.post_content,
                forum_id=post.forum_id,
                user_id=post.user_id,
                username=user.username,
                profile_image=user.profile_image,
                like_count=like_count,
                tags=post.tags,
                images=post.images,        
                comments=enriched_comments,
                created_at=post.created_at
            )
        )

    return response

@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    current_user: models.User = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.Comment).filter(models.Comment.cid == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted"}


@router.post("/comments/{comment_id}/report")
def report_comment(
    comment_id: int,
    reason: str = Form(...),
    details: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.cid == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    print(f"🧾 Comment {comment_id} reported by user {current_user.uid}: {reason} | {details}")

    # ถ้าอยากให้บันทึกจริงไว้ใน DB ก็สามารถเพิ่ม model ใหม่ได้ทีหลัง
    return {"detail": "Report received"}
