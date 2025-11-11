from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Follow, User
from ..oauth2 import get_current_user 

router = APIRouter(prefix="/follow", tags=["follow"])

@router.post("/{user_id}")
def follow_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_user = db.query(User).filter(User.uid == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    already_follow = db.query(Follow).filter_by(follower_id=current_user.uid, following_id=user_id).first()
    if already_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    new_follow = Follow(follower_id=current_user.uid, following_id=user_id)
    db.add(new_follow)
    db.commit()
    return {"message": "Followed successfully"}

@router.delete("/{user_id}")
def unfollow_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    follow = db.query(Follow).filter_by(follower_id=current_user.uid, following_id=user_id).first()
    if not follow:
        raise HTTPException(status_code=404, detail="You are not following this user")

    db.delete(follow)
    db.commit()
    return {"message": "Unfollowed successfully"}

@router.get("/following")
def get_following(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    following = (
        db.query(User)
        .join(Follow, Follow.following_id == User.uid)
        .filter(Follow.follower_id == current_user.uid)
        .all()
    )
    return [
        {"uid": u.uid, "name": u.name, "username": u.username, "profile_image": u.profile_image}
        for u in following
    ]