# app/routers/follow.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db
from .. import models , oauth2
from ..oauth2 import get_current_user
from .notification import create_notification_template  # มีใช้ในโปรเจกต์อยู่แล้ว

router = APIRouter(prefix="/follow", tags=["follow"])

# ---------------------------
#  POST /follow/{user_id}
#  - ถ้า user เป็น public → follow ทันที
#  - ถ้าเป็น private → สร้าง follow request
# ---------------------------@router.post("/{user_id}")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ❌ ห้าม follow ตัวเอง
    if user_id == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    # ✔ หา target user
    target_user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # ❌ เช็คว่ามี follow แล้วหรือยัง
    already_follow = (
        db.query(models.Follow)
        .filter_by(follower_id=current_user.uid, following_id=user_id)
        .first()
    )
    if already_follow:
        raise HTTPException(status_code=400, detail="Already following")

    # ❌ เช็คว่ามี request ค้างอยู่หรือยัง (กันกดซ้ำ)
    existing_req = (
        db.query(models.FollowRequest)
        .filter(
            models.FollowRequest.requester_id == current_user.uid,
            models.FollowRequest.target_id == user_id,
            models.FollowRequest.status == "pending",
        )
        .first()
    )
    if existing_req:
        raise HTTPException(status_code=400, detail="Follow request already sent")

    # =====================================================================
    #                     🔒 PRIVATE ACCOUNT → SEND REQUEST
    # =====================================================================
    if target_user.is_private:

        follow_req = models.FollowRequest(
            requester_id=current_user.uid,
            target_id=user_id,
            status="pending",
        )
        db.add(follow_req)

        # ทำแจ้งเตือน
        try:
            create_notification_template(
                db=db,
                current_user=current_user,
                payload_data={
                    "title": "Follow Request",
                    "receiver_id": user_id,
                    "target_role": "user",
                    "message": f"{current_user.username} requested to follow you",
                },
            )
        except Exception as e:
            print(f"Error creating follow-request notification: {e}")

        db.commit()
        db.refresh(follow_req)

        return {
            "mode": "request",
            "message": "Follow request sent",
            "request_id": follow_req.id,
        }

    # =====================================================================
    #              🌍 PUBLIC ACCOUNT → FOLLOW ทันที
    # =====================================================================
    new_follow = models.Follow(
        follower_id=current_user.uid,
        following_id=user_id,
    )
    db.add(new_follow)

    noti_payload = {
        "title": "Follow",
        "receiver_id": user_id,
        "target_role": "user",
        "message": f"{current_user.name} started following you"
    }

    try:
        create_notification_template(
            db=db,
            current_user=current_user,
            payload_data={
                "title": "Follow",
                "receiver_id": user_id,
                "target_role": "user",
                "message": f"{current_user.username} started following you",
            },
        )
    except Exception as e:
        print(f"Error creating follow notification: {e}")

    db.commit()

    return {
        "mode": "follow",
        "message": "Followed successfully",
    }

# ---------------------------
#  DELETE /follow/{user_id}
# ---------------------------

@router.delete("/{user_id}")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    follow = (
        db.query(models.Follow)
        .filter_by(follower_id=current_user.uid, following_id=user_id)
        .first()
    )
    if not follow:
        raise HTTPException(status_code=404, detail="You are not following this user")

    db.delete(follow)

    noti = (
        db.query(models.Notification)
        .filter_by(
            title="Follow",
            sender_id=current_user.uid,
            receiver_id=user_id,
        )
        .first()
    )
    if noti:
        db.delete(noti)

    db.commit()
    return {"message": "Unfollowed successfully"}


# ---------------------------
#  GET /follow/following
#  → คนที่เราไป follow เขา (เหมือนเดิม)
# ---------------------------

@router.get("/following")
def get_following(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    following = (
        db.query(models.User)
        .join(models.Follow, models.Follow.following_id == models.User.uid)
        .filter(models.Follow.follower_id == current_user.uid)
        .all()
    )
    return [
        {
            "uid": u.uid,
            "name": u.name,
            "username": u.username,
            "profile_image": u.profile_image,
        }
        for u in following
    ]


# ---------------------------
#  🔥 ใหม่: GET /follow/followers
#  → ใช้กับแท็บ Follower (ใคร follow เรา)
# ---------------------------

@router.get("/followers")
def get_followers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    followers = (
        db.query(models.User)
        .join(models.Follow, models.Follow.follower_id == models.User.uid)
        .filter(models.Follow.following_id == current_user.uid)
        .all()
    )
    return [
        {
            "uid": u.uid,
            "name": u.name,
            "username": u.username,
            "profile_image": u.profile_image,
        }
        for u in followers
    ]


# ---------------------------
#  🔥 ใหม่: คำขอติดตาม (เหมือน IG)
# ---------------------------

# list คำขอที่ "เข้ามาหาเรา"
@router.get("/requests")
def get_follow_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reqs = (
        db.query(models.FollowRequest, models.User)
        .join(models.User, models.FollowRequest.requester_id == models.User.uid)
        .filter(
            models.FollowRequest.receiver_id == current_user.uid,  # ✅ แก้ตรงนี้
            models.FollowRequest.status == "pending",
        )
        .all()
    )

    result = []
    for fr, user in reqs:
        result.append(
            {
                "id": fr.id,  # แนะนำใช้ key "id" ให้ตรงกับ frontend
                "uid": user.uid,
                "username": user.username,
                "name": user.name,
                "profile_image": user.profile_image,
                "status": fr.status,
            }
        )
    return result


# อนุมัติคำขอ
@router.post("/requests/{request_id}/approve")
def approve_follow_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # หาคำขอ
    follow_req = db.query(models.FollowRequest).filter(
        models.FollowRequest.id == request_id,
        models.FollowRequest.receiver_id == current_user.uid
    ).first()

    if not follow_req:
        raise HTTPException(status_code=404, detail="Follow request not found")

    # อนุมัติ → create follow
    new_follow = models.Follow(
        follower_id=follow_req.requester_id,
        following_id=current_user.uid,
    )

    db.add(new_follow)

    # update status ของ request
    follow_req.status = "approved"

    db.commit()
    db.refresh(follow_req)

    return {"message": "Follow request approved"}

# ปฏิเสธคำขอ
@router.post("/requests/{request_id}/reject")
def reject_follow_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    follow_req = db.query(models.FollowRequest).filter(
        models.FollowRequest.id == request_id,
        models.FollowRequest.receiver_id == current_user.uid
    ).first()

    if not follow_req:
        raise HTTPException(status_code=404, detail="Follow request not found")

    follow_req.status = "rejected"
    db.commit()

    return {"message": "Follow request rejected"}


@router.post("/{id}/follow", status_code=201)
def test_follow_user_compat(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # ใช้ logic เดิมใน follow router
    from .follow import follow_user
    return follow_user(id, db, current_user)


@router.delete("/{id}/follow", status_code=200)
def test_unfollow_user_compat(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    from .follow import unfollow_user
    return unfollow_user(id, db, current_user)