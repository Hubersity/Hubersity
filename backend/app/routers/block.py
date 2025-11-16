from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.models import User
from app.utils import get_current_user

router = APIRouter(
    prefix="/block",
    tags=["Block System"]
)


@router.post("/{uid}")
def block_user(uid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    # ❗ แก้จาก id → uid
    if uid == current_user.uid:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    exists = db.query(models.Block).filter(
        models.Block.blocker_id == current_user.uid,   # แก้ id → uid
        models.Block.blocked_id == uid
    ).first()

    if exists:
        raise HTTPException(status_code=400, detail="Already blocked")

    block = models.Block(
        blocker_id=current_user.uid,  # แก้ id → uid
        blocked_id=uid
    )
    db.add(block)
    db.commit()

    return {"message": "User blocked successfully", "blocked_id": uid}


@router.delete("/{uid}")
def unblock_user(uid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    block = db.query(models.Block).filter(
        models.Block.blocker_id == current_user.uid,  # แก้ id → uid
        models.Block.blocked_id == uid
    ).first()

    if not block:
        raise HTTPException(status_code=404, detail="Block record not found")

    db.delete(block)
    db.commit()

    return {"message": "User unblocked", "unblocked_id": uid}


@router.get("/list")
def get_block_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    blocks = db.query(models.Block).filter(
        models.Block.blocker_id == current_user.uid   # แก้ id → uid
    ).all()

    return [{"blocked_id": b.blocked_id} for b in blocks]