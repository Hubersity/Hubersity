from sqlalchemy.sql import func
from sqlalchemy import Table, ForeignKey, Column, Integer, String, Boolean, TIMESTAMP, text, Text, func, UniqueConstraint, CheckConstraint, Index, Date , DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"

    uid = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=False, unique=True)  # ใช้ตอนสมัคร (login)
    name = Column(String, nullable=True)                    # ชื่อโปรไฟล์ (แก้ได้)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    # is_admin = Column(Boolean, default=False)

    birthdate = Column(TIMESTAMP(timezone=False), nullable=True)  # วันเกิด
    university = Column(String, nullable=True)                    # มหาวิทยาลัย
    privacy = Column(String, default="private")                   # private/public

    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text('now()')
    )
    profile_image = Column(String, nullable=True)
    description = Column(String, nullable=True)  # bio
    is_admin = Column(Boolean, nullable=False, default=False)
    is_banned = Column(Boolean, default=False)
    ban_until = Column(DateTime, nullable=True)

    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("DailyProgress", back_populates="user", cascade="all, delete-orphan")
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", backref="follower", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", backref="following", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", foreign_keys="[Report.reporter_id]")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")


    @hybrid_property
    def follower_count(self):
        return len(self.followers)

    @hybrid_property
    def following_count(self):
        return len(self.following)

forum_tags = Table(
    "forum_tags",
    Base.metadata,
    Column("forum_id", Integer, ForeignKey("forum.fid"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)

class Follow(Base):
    __tablename__ = "follows"
    follower_id = Column(Integer, ForeignKey("users.uid"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.uid"), primary_key=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text('now()')
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, unique=True, nullable=False)

    forums = relationship("Forum", secondary=forum_tags, back_populates="tags")


class Forum(Base):
    __tablename__ = "forum"

    fid = Column(Integer, primary_key=True, nullable=False)
    forum_name = Column(String, nullable=False)
    tags = relationship("Tag", secondary=forum_tags, back_populates="forums")

post_post_tags = Table(
    "post_post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("post.pid"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("post_tags.ptid"), primary_key=True)
)

class PostTag(Base):
    __tablename__ = "post_tags"

    ptid = Column(Integer, primary_key=True, nullable=False) # post tag id
    name = Column(String, unique=True, nullable=False)
    posts = relationship("Post", secondary=post_post_tags, back_populates="tags")


class Post(Base):
    __tablename__ = "post"
    
    pid = Column(Integer, primary_key=True, nullable=False)
    post_content = Column(String, nullable=False)
    forum_id = Column(Integer, ForeignKey("forum.fid"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)  # new column
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="posts")
    tags = relationship(
        "PostTag",
        secondary=post_post_tags,
        back_populates="posts"
    )
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text('now()')
    )
    images = relationship("PostImage", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="post", cascade="all, delete-orphan")

class PostImage(Base):
    __tablename__ = "post_images"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)
    path = Column(String, nullable=False)
    caption = Column(String)
    file_type = Column(String, nullable=True)
    post = relationship("Post", back_populates="images")


class StudySession(Base):
    __tablename__ = "study_sessions"

    sid = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    start_time = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    end_time = Column(TIMESTAMP(timezone=True))
    duration_minutes = Column(Integer)

    user = relationship("User", back_populates="sessions")

from sqlalchemy import Column, Integer, Date, TIMESTAMP, ForeignKey
# ถ้ายังใช้ TIMESTAMP ต่อ ก็ไม่ต้องเปลี่ยน type ตรง date

class DailyProgress(Base):
    __tablename__ = "daily_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    date = Column(TIMESTAMP(timezone=True), nullable=False)  # คุณใช้แบบนี้อยู่
    total_minutes = Column(Integer, default=0, nullable=False)
    badge_level = Column(Integer, default=0, nullable=False)

    # ใส่ให้ตรงกับ DB
    total_seconds = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="progress")

    def update_badge(self):
        self.badge_level = min(self.total_minutes // 180, 4)


class Like(Base):
    __tablename__ = "likes"

    user_id = Column(Integer, ForeignKey("users.uid"), primary_key=True)
    post_id = Column(Integer, ForeignKey("post.pid"), primary_key=True)

    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

class Comment(Base):
    __tablename__ = "comments"

    cid = Column(Integer, primary_key=True, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'))
    
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    post_id = Column(Integer, ForeignKey("post.pid", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    files = relationship("CommentFile", back_populates="comment", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    rid = Column(Integer, primary_key=True, index=True)

    post_id = Column(Integer, ForeignKey("post.pid"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=True)

    reporter_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    report_type = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="pending")

    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text('now()')
    )

    post = relationship("Post", back_populates="reports", foreign_keys=[post_id])
    reported_user = relationship("User", foreign_keys=[user_id])
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])


    
class CommentFile(Base):
    __tablename__ = "comment_files"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.cid", ondelete="CASCADE"), nullable=False)
    path = Column(String, nullable=False)
    file_type = Column(String, nullable=True)

    comment = relationship("Comment", back_populates="files")


class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = (
        CheckConstraint("user1_id < user2_id", name="ck_chat_order"),
        UniqueConstraint("user1_id", "user2_id", name="uq_chat_pair"),
    )

    id = Column(Integer, primary_key=True, nullable=False)
    user1_id = Column(Integer, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])

    messages = relationship(
        "ChatMessage", back_populates="chat", cascade="all, delete-orphan"
    )

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (Index("ix_msg_chat_created", "chat_id", "created_at"),)
    
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
    kind = Column(String, default="text")   # "text" | "system" (เน้นข้อความ)
    text = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User")
    attachments = relationship("ChatAttachment", back_populates="message", cascade="all, delete-orphan")


class ChatAttachment(Base):
    __tablename__ = "chat_attachments"
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String, nullable=False)   # "image" | "video" | "file"
    path = Column(String, nullable=False)
    original_name = Column(String)
    mime_type = Column(String)
    size = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    message = relationship("ChatMessage", back_populates="attachments")
    
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.uid"), nullable=True)
    receiver_id = Column(Integer, nullable=True)
    target_role = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"))
    user_id = Column(Integer, ForeignKey("users.uid"))
    read_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    notification = relationship("Notification", backref="reads")
    user = relationship("User")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.uid"))
    blocked_id = Column(Integer, ForeignKey("users.uid"))

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="unique_block"),
    )

    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])

class HelpReport(Base):
    __tablename__ = "help_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    message = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)

    user = relationship("User")
    created_at = Column(
        DateTime,
        default=datetime.utcnow,      # จะใส่เวลาอัตโนมัติ
        nullable=False
    )

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)        # ใช้โชว์ใน card / hover
    detail = Column(Text, nullable=True)         # เนื้อหาทั้งหมด
    hover_text = Column(String(255), nullable=True)  # text เล็ก ๆ ตอน hover card
    image_url = Column(String(255), nullable=True)   # path รูป เช่น /uploads/news/1.jpg

    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    created_by = Column(Integer, ForeignKey("users.uid"), nullable=True)
    creator = relationship("User", backref="news_items")
