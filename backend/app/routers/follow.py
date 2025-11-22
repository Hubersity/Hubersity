from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from .. import models , oauth2
from ..oauth2 import get_current_user
from .notification import create_notification_template

router = APIRouter(prefix="/follow", tags=["follow"])


# ---------------------------
#  POST /follow/{user_id}
#  - If the user is public → follow immediately
#  - If it is private → create a follow request
@router.post("/{user_id}")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Do not follow yourself
    if user_id == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    # Find target users
    target_user = db.query(models.User).filter(models.User.uid == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if you are already followed
    already_follow = (
        db.query(models.Follow)
        .filter_by(follower_id=current_user.uid, following_id=user_id)
        .first()
    )
    if already_follow:
        raise HTTPException(status_code=400, detail="Already following")

    # Check if there are any pending requests (to prevent duplicate clicks)
    existing_req = (
        db.query(models.FollowRequest)
        .filter(
            models.FollowRequest.requester_id == current_user.uid,
            models.FollowRequest.receiver_id == user_id,
            models.FollowRequest.status == "pending",
        )
        .first()
    )
    if existing_req:
        raise HTTPException(status_code=400, detail="Follow request already sent")

    # =====================================================================
    #                     PRIVATE ACCOUNT → SEND REQUEST
    # =====================================================================
    if target_user.is_private:

        follow_req = models.FollowRequest(
            requester_id=current_user.uid,
            receiver_id=user_id,
            status="pending",
        )
        db.add(follow_req)

        # Make a notification
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
    #              PUBLIC ACCOUNT → FOLLOW ทันที
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
#  → The person we follow (as usual)
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
#  GET /follow/followers
#  → Use with the Follower tab (who follows us)
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
#  Follow request (like IG)
# ---------------------------
# List of requests that "come to us"
@router.get("/requests")
def get_follow_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reqs = (
        db.query(models.FollowRequest, models.User)
        .join(models.User, models.FollowRequest.requester_id == models.User.uid)
        .filter(
            models.FollowRequest.receiver_id == current_user.uid, 
            models.FollowRequest.status == "pending",
        )
        .all()
    )

    result = []
    for fr, user in reqs:
        result.append(
            {
                "id": fr.id,  # It is recommended to use the key "id" to match the frontend.
                "uid": user.uid,
                "username": user.username,
                "name": user.name,
                "profile_image": user.profile_image,
                "status": fr.status,
            }
        )
    return result


# Approve the request
@router.post("/requests/{request_id}/approve")
def approve_follow_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Find a request
    follow_req = db.query(models.FollowRequest).filter(
        models.FollowRequest.id == request_id,
        models.FollowRequest.receiver_id == current_user.uid
    ).first()

    if not follow_req:
        raise HTTPException(status_code=404, detail="Follow request not found")

    # Approve → create follow
    new_follow = models.Follow(
        follower_id=follow_req.requester_id,
        following_id=current_user.uid,
    )

    db.add(new_follow)

    # Update request status
    follow_req.status = "approved"

    db.commit()
    db.refresh(follow_req)

    return {"message": "Follow request approved"}


# Reject the request
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
