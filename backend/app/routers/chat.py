from fastapi import (
    APIRouter, Depends, HTTPException, Query,
    File, UploadFile, Form, Body, WebSocket, BackgroundTasks
)
from sqlalchemy.orm import Session, selectinload
from .. import models, database
from fastapi import File, UploadFile, Form
# from fastapi.responses import JSONResponse
import os, uuid
# from fastapi import status
from typing import List
import os, uuid
from fastapi import HTTPException, Body, WebSocket, APIRouter
from starlette.status import HTTP_404_NOT_FOUND
from datetime import datetime, timezone
from sqlalchemy import or_, and_, func
# from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/chats", tags=["Chat"])
UPLOAD_ROOT = "uploads"  # มี mount /uploads แล้วใน main.py
UPLOAD_DIR = "uploads/chat"  # Use relative path for compatibility with GitHub Actions
os.makedirs(UPLOAD_DIR, exist_ok=True)
active_connections = {}

async def connect_user(user_id: int, websocket: WebSocket):
    await websocket.accept()
    active_connections[user_id] = websocket

async def send_to_user(user_id: int, data: dict):
    ws = active_connections.get(user_id)
    if ws:
        await ws.send_json(data)

async def notify_new_message(chat_id: int, user1: int, user2: int):
    data = {
        "type": "new_message",
        "chat_id": chat_id
    }

    # ส่งให้คนที่เกี่ยวข้องทั้ง 2 คน
    for uid in [user1, user2]:
        ws = active_connections.get(uid)
        if ws:
            await ws.send_json(data)

# ---------- Helper functions ----------

def is_friends(db: Session, a: int, b: int) -> bool:
    """เช็กว่า a และ b เป็นเพื่อนกัน (follow กันสองทางหรือไม่)"""
    return (
        db.query(models.Follow).filter_by(follower_id=a, following_id=b).first() is not None
        and
        db.query(models.Follow).filter_by(follower_id=b, following_id=a).first() is not None
    )

# db: Session = ขอ connection ไปยังฐานข้อมูล ผ่านระบบ dependency ของ FastAPI

def ensure_chat_if_friends(db: Session, uid1: int, uid2: int):
    """สร้างห้องแชตอัตโนมัติ ถ้า 2 คนนี้เป็นเพื่อนกันแล้ว"""
    if not is_friends(db, uid1, uid2):
        return None
    u1, u2 = (uid1, uid2) if uid1 < uid2 else (uid2, uid1)
    chat = db.query(models.Chat).filter_by(user1_id=u1, user2_id=u2).first()
    if chat:
        return chat
    chat = models.Chat(user1_id=u1, user2_id=u2)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

def forward(target_chat_id, source_message_id, attachment_id=None, prefix=None, by_user_id=None):
    # 1) authz: ผู้ส่งต้องเห็นข้อความต้นทางได้
    src = get_message_or_404(source_message_id)
    assert can_view_message(by_user_id, src)

    with db.transaction():
        # 2) สร้างข้อความเปล่า (ถ้าอยากใส่ prefix ก็ใส่ที่ text)
        text = (prefix + " " + (src.text or "")) if prefix and not attachment_id else (prefix or "")
        new_msg = create_message(
            chat_id=target_chat_id,
            sender_id=by_user_id,
            text=text,
            forwarded_from_message_id=src.id,
            forwarded_from_chat_id=src.chat_id,
        )

        if attachment_id:
            att = get_attachment_or_404(attachment_id, message_id=src.id)
            copy_or_link_attachment(att, to_message=new_msg)
        else:
            # ส่งต่อทั้งข้อความ (ทุกไฟล์)
            for att in list_attachments(src.id):
                copy_or_link_attachment(att, to_message=new_msg)

    return new_msg

# ---------- Endpoints ----------

# ฟังก์ชันที่ทำงานเมื่อมีคนเรียก URL นั้น
@router.get("")
def list_my_chats(
    me_id: int = Query(...),
    db: Session = Depends(database.get_db),
):
   # 1) หา mutuals
    following = {f.following_id for f in db.query(models.Follow).filter_by(follower_id=me_id).all()}
    followers = {f.follower_id for f in db.query(models.Follow).filter_by(following_id=me_id).all()}
    mutuals = following & followers

    # 2) ensure chat for each mutual
    for uid in mutuals:
        ensure_chat_if_friends(db, me_id, uid)

    # 3) แล้วค่อย query chats ตามเดิม
    chats = (
        db.query(models.Chat)
        .filter((models.Chat.user1_id == me_id) | (models.Chat.user2_id == me_id))
        .all()
    )

    result = []
    for c in chats:
        other_id = c.user2_id if c.user1_id == me_id else c.user1_id
        # ข้ามคู่ที่ไม่ได้เป็นเพื่อนแล้ว (กรณี unfriend)
        if not is_friends(db, me_id, other_id):
            continue
        friend = c.user2 if c.user1_id == me_id else c.user1

        # ข้อความล่าสุด
        last = (
            db.query(models.ChatMessage)
            .options(selectinload(models.ChatMessage.attachments))
            .filter(models.ChatMessage.chat_id == c.id)
            .order_by(models.ChatMessage.created_at.desc())
            .first()
        )

        # preview เหมือนเดิม
        if last and last.attachments:
            a = last.attachments[0]
            if a.kind == "image":
                preview = "[image]"
            elif a.kind == "video":
                preview = "[video]"
            else:
                preview = a.original_name or "[file]"
        else:
            preview = last.text or "" if last else ""

        # ---------- นับ unread ----------
        my_last_read = (
            c.user1_last_read_at if me_id == c.user1_id else c.user2_last_read_at
        )

        # ถ้าไม่เคยอ่านเลย → นับตั้งแต่เริ่มต้น
        base_time = my_last_read or datetime.min.replace(tzinfo=timezone.utc)

        unread_count = (
            db.query(func.count(models.ChatMessage.id))
            .filter(
                models.ChatMessage.chat_id == c.id,
                models.ChatMessage.sender_id != me_id,      # ไม่รวมของตัวเอง
                models.ChatMessage.created_at > base_time,  # หลังเวลาที่อ่านล่าสุด
            )
            .scalar()
        )

        result.append({
            "id": c.id,
            "name": friend.name or friend.username,
            "username": friend.username,
            "avatar": getattr(friend, "profile_image", None) or "/images/default.jpg",
            "lastMessage": preview,
            "last_ts": last.created_at.isoformat() if last else None,
            "unread": unread_count,
        })

    # ---------- sort: ห้องที่มีข้อความล่าสุดอยู่ข้างบน ----------
    result.sort(key=lambda x: x["last_ts"] or "", reverse=True)

    return result


@router.post("/with/{other_user_id}")
def open_chat_with(
    other_user_id: int,
    me_id: int = Query(..., description="uid ของฉัน"),
    db: Session = Depends(database.get_db),
):
    """
    เปิดหรือสร้างห้องแชตกับเพื่อน (เฉพาะถ้าเป็นเพื่อนกันจริง)
    """
    if other_user_id == me_id:
        raise HTTPException(400, "Cannot chat with yourself")
    if not is_friends(db, me_id, other_user_id):
        raise HTTPException(403, "You must be friends to start a chat")

    chat = ensure_chat_if_friends(db, me_id, other_user_id)
    return {"chat_id": chat.id}


@router.post("/sync-my-friend-chats")
def sync_my_friend_chats(
    me_id: int = Query(..., description="uid ของฉัน"),
    db: Session = Depends(database.get_db),
):
    """
    ใช้เมื่ออยากแน่ใจว่าเพื่อนทุกคนที่ follow กันสองทาง มีห้องแชตครบ
    """
    following = {f.following_id for f in db.query(models.Follow).filter_by(follower_id=me_id).all()}
    followers = {f.follower_id for f in db.query(models.Follow).filter_by(following_id=me_id).all()}
    mutuals = sorted(list(following & followers))

    created = []
    for uid in mutuals:
        chat = ensure_chat_if_friends(db, me_id, uid)
        if chat:
            created.append({"chat_id": chat.id, "with": uid})

    return {"created_or_existing": created, "total": len(mutuals)}

# ดึงข้อความทั้งหมดในห้อง
@router.get("/{chat_id}/messages")
def get_messages(chat_id: int, me_id: int = Query(...), db: Session = Depends(database.get_db)):
    msgs = (db.query(models.ChatMessage)
            .options(selectinload(models.ChatMessage.attachments),
                     selectinload(models.ChatMessage.sender))
            .filter(models.ChatMessage.chat_id == chat_id)
            .order_by(models.ChatMessage.created_at.asc())
            .all())

    out = []
    for m in msgs:
        sender = "me" if m.sender_id == me_id else (m.sender.name or m.sender.username)

        # ✅ ถ้าโดนลบแล้ว → ส่ง bubble เดียวว่า deleted และ "ไม่แตกไฟล์"
        if (m.kind or "").lower() == "deleted":
            out.append({
                "id": m.id,
                "sender": sender,
                "text": "",
                "kind": "deleted",
                "url": None,
                "name": "",
                "created_at": m.created_at.isoformat(),
            })
            continue

        if m.attachments:
            for a in m.attachments:
                out.append({
                    "id": f"{m.id}:{a.id}",     # ให้ฝั่งหน้าใช้เป็น key เดิม
                    "sender": sender,
                    "text": m.text or "",
                    "kind": a.kind,
                    "url":  f"/uploads/{a.path}",
                    "name": a.original_name or "",
                    "created_at": m.created_at.isoformat(),
                })
        else:
            out.append({
                "id": m.id,
                "sender": sender,
                "text": m.text or "",
                "kind": m.kind or "text",
                "url":  None,
                "name": "",
                "created_at": m.created_at.isoformat(),
            })
    return out

@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: int,
    payload: dict,
    me_id: int = Query(...),
    db: Session = Depends(database.get_db),
):
    chat = db.query(models.Chat).filter_by(id=chat_id).first()
    if not chat:
        raise HTTPException(404, "Chat not found")
    if me_id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(403, "You are not in this chat")

    text = (payload or {}).get("text")
    if not text:
        raise HTTPException(400, "Message text is required")

    message = models.ChatMessage(chat_id=chat_id, sender_id=me_id, kind="text", text=text)
    db.add(message)
    db.commit()
    db.refresh(message)

    other_id = chat.user2_id if me_id == chat.user1_id else chat.user1_id

    # ✅ ใช้อันเดิมตัวเดียวพอ
    await send_to_user(other_id, {
        "type": "new_message",
        "chat_id": chat_id,
        "from_user_id": me_id,
        "message": {
            "id": message.id,
            "text": message.text,
            "created_at": message.created_at.isoformat(),
        },
    })

    return {
        "id": message.id,
        "sender": "me",
        "text": message.text,
        "kind": "text",
        "url": None,
        "created_at": message.created_at.isoformat(),
    }

# ---------- อัปโหลดไฟล์/รูป/วิดีโอ ----------
@router.post("/{chat_id}/upload")
def upload_attachments(
    chat_id: int,
    background_tasks: BackgroundTasks = None,
    me_id: int = Query(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
):
    # ตรวจสิทธิ์เหมือนเดิม
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat or (me_id not in (chat.user1_id, chat.user2_id)):
        raise HTTPException(status_code=404, detail="Chat not found or not a member")

    # สร้าง parent message ว่าง
    msg = models.ChatMessage(chat_id=chat_id, sender_id=me_id, kind="text", text=None)
    db.add(msg)
    db.flush()

    # >>> โฟลเดอร์ย่อยตามห้อง
    chat_dir = os.path.join(UPLOAD_DIR, str(chat_id))
    os.makedirs(chat_dir, exist_ok=True)

    saved = []
    for f in files:
        ext = os.path.splitext(f.filename)[1]
        fname = f"{uuid.uuid4().hex}{ext}"

        # >>> ที่เซฟไฟล์จริง
        dest = os.path.join(chat_dir, fname)

        # >>> path แบบสัมพันธ์ เก็บลง DB
        rel_path = os.path.join("chat", str(chat_id), fname)  # e.g. chat/1/xxx.png

        with open(dest, "wb") as out:
            out.write(f.file.read())

        att_kind = "image" if f.content_type.startswith("image/") else \
                   "video" if f.content_type.startswith("video/") else "file"

        att = models.ChatAttachment(
            message_id=msg.id,
            kind=att_kind,
            path=rel_path,                # << สำคัญ: เก็บ path แบบสัมพันธ์
            original_name=f.filename,
            mime_type=f.content_type,
        )
        db.add(att)
        saved.append(att)

    db.commit()
    if background_tasks:
        background_tasks.add_task(
            notify_new_message,
            chat.id,
            chat.user1_id,
            chat.user2_id,
        )
    # background_tasks.add_task(notify_new_message, chat.id, chat.user1_id, chat.user2_id)

    return {
        "message_id": msg.id,
        "attachments": [
            {
                "id": a.id,
                "kind": a.kind,
                "url": f"/uploads/{a.path}",   # => /uploads/chat/<chat_id>/<file>
                "name": a.original_name,
                "mime_type": a.mime_type,
            }
            for a in saved
        ],
    }

@router.delete("/{chat_id}/messages/{message_id}")
def delete_message(
    chat_id: int,
    message_id: int,
    background_tasks: BackgroundTasks = None,
    me_id: int = Query(...),
    db: Session = Depends(database.get_db),
):
    # หา message เฉพาะในห้องนี้
    msg = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.id == message_id,
                models.ChatMessage.chat_id == chat_id)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # เช็กสิทธิ์อยู่ในห้อง
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat or me_id not in (chat.user1_id, chat.user2_id):
        raise HTTPException(status_code=403, detail="Not allowed in this chat")

    # (ถ้าอยากบังคับว่า 'ลบได้เฉพาะเจ้าของข้อความ')
    # if msg.sender_id != me_id:
    #     raise HTTPException(status_code=403, detail="Only sender can delete")

    # ถ้าลบไปแล้ว ไม่ต้องทำซ้ำ
    if msg.kind == "deleted":
        return {"ok": True}

    # SOFT DELETE: ไม่แตะไฟล์/attachment
    msg.kind = "deleted"
    msg.text = None
    db.add(msg)
    db.commit()
    if background_tasks:
        background_tasks.add_task(
            notify_new_message,
            chat.id,
            chat.user1_id,
            chat.user2_id,
        )

    return {"ok": True}

@router.post("/{chat_id}/forward")
def forward_message(
    chat_id: int,
    me_id: int = Query(...),
    payload: dict = Body(...),
    db: Session = Depends(database.get_db),
):
    target = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not target or me_id not in (target.user1_id, target.user2_id):
        raise HTTPException(status_code=403, detail="Not in target chat")

    src_msg_id_raw = (payload or {}).get("source_message_id")
    if not src_msg_id_raw:
        raise HTTPException(400, "source_message_id required")

    try:
        src_msg_id = int(str(src_msg_id_raw).split(":")[0])
    except:
        raise HTTPException(400, "invalid source_message_id")

    src = (
        db.query(models.ChatMessage)
        .options(selectinload(models.ChatMessage.attachments))
        .filter(models.ChatMessage.id == src_msg_id)
        .first()
    )
    if not src:
        raise HTTPException(404, "Source message not found")

    # ต้องเป็นสมาชิกห้องต้นทางด้วย
    src_chat = db.query(models.Chat).filter(models.Chat.id == src.chat_id).first()
    if not src_chat or me_id not in (src_chat.user1_id, src_chat.user2_id):
        raise HTTPException(403, "Not allowed to forward this message")

    text_prefix = (payload or {}).get("prefix") or ""
    new_text = (text_prefix + " " if text_prefix else "") + (src.text or "")

    new_msg = models.ChatMessage(
        chat_id=chat_id,
        sender_id=me_id,
        kind="text",
        text=new_text if new_text else None,
    )
    db.add(new_msg)
    db.flush()

    # ---- คัดลอกไฟล์แนบแบบเลือกได้ ----
    only_att_id = (payload or {}).get("attachment_id")  # optional
    out_attachments = []

    if only_att_id:
        att = (
            db.query(models.ChatAttachment)
            .filter(models.ChatAttachment.id == int(only_att_id),
                    models.ChatAttachment.message_id == src.id)
            .first()
        )
        if not att:
            raise HTTPException(404, "Attachment not found for this message")

        new_att = models.ChatAttachment(
            message_id=new_msg.id,
            kind=att.kind,
            path=att.path,  # reuse
            original_name=att.original_name,
            mime_type=att.mime_type,
        )
        db.add(new_att)
        db.flush()
        out_attachments.append({
            "id": new_att.id, "kind": new_att.kind,
            "url": f"/uploads/{new_att.path}",
            "name": new_att.original_name, "mime_type": new_att.mime_type,
        })
    else:
        for a in src.attachments or []:
            new_att = models.ChatAttachment(
                message_id=new_msg.id,
                kind=a.kind, path=a.path,
                original_name=a.original_name, mime_type=a.mime_type,
            )
            db.add(new_att); db.flush()
            out_attachments.append({
                "id": new_att.id, "kind": new_att.kind,
                "url": f"/uploads/{new_att.path}",
                "name": new_att.original_name, "mime_type": new_att.mime_type,
            })

    db.commit()
    return {"message_id": new_msg.id, "sender": "me", "text": new_msg.text, "attachments": out_attachments}

@router.get("/{chat_id}/messages")
def list_messages(chat_id: int, me_id: int = Query(...), db: Session = Depends(database.get_db)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat or me_id not in (chat.user1_id, chat.user2_id):
        raise HTTPException(403, "Not allowed")

    rows = (
        db.query(models.ChatMessage)
        .options(selectinload(models.ChatMessage.attachments))
        .filter(models.ChatMessage.chat_id == chat_id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )

    out = []
    for m in rows:
        sender = "me" if m.sender_id == me_id else "other"

        if m.kind == "deleted":
            out.append({
                "id": m.id,
                "sender": sender,
                "kind": "deleted",
                "text": None,
                "url": None,
                "name": None,
                "attachments": [],  # ไม่ส่งไฟล์กลับ
            })
            continue

        # ปกติ
        atts = [{
            "id": a.id,
            "kind": a.kind,
            "url": f"/uploads/{a.path}",
            "name": a.original_name,
            "mime_type": a.mime_type,
        } for a in (m.attachments or [])]

        # เผื่อ frontend ใช้ฟิลด์ url/name เดี่ยว ๆ
        url = atts[0]["url"] if atts else None
        name = atts[0]["name"] if atts else None

        out.append({
            "id": m.id,
            "sender": sender,
            "kind": m.kind or ("text" if not atts else atts[0]["kind"]),
            "text": m.text or "",
            "url": url,
            "name": name,
            "attachments": atts,
        })

    return out

@router.post("/{chat_id}/read")
def mark_read(
    chat_id: int,
    me_id: int = Query(...),
    db: Session = Depends(database.get_db),
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(404, "Chat not found")

    now = datetime.now(timezone.utc)

    if me_id == chat.user1_id:
        chat.user1_last_read_at = now
    elif me_id == chat.user2_id:
        chat.user2_last_read_at = now
    else:
        raise HTTPException(403, "Not in this chat")

    db.commit()
    return {"ok": True}

@router.websocket("/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    await connect_user(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except:
        active_connections.pop(user_id, None)
