from sqlalchemy import Table, ForeignKey, Column, Integer, String, Boolean, TIMESTAMP, text, Text, func, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property

from .database import Base


class User(Base):
    __tablename__ = "users"

    uid = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=False, unique=True)  # ใช้ตอนสมัคร (login)
    name = Column(String, nullable=True)                    # ชื่อโปรไฟล์ (แก้ได้)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

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

    likes = relationship("Like", back_populates="user")
    posts = relationship("Post", back_populates="user")
    sessions = relationship("StudySession", back_populates="user")
    progress = relationship("DailyProgress", back_populates="user")
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", backref="follower")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", backref="following")

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
    user = relationship("User", back_populates="posts")
    tags = relationship(
        "PostTag",
        secondary=post_post_tags,
        back_populates="posts"
    )
    images = relationship("PostImage", back_populates="post")
    likes = relationship("Like", back_populates="post")
    comments = relationship("Comment", back_populates="post")

class PostImage(Base):
    __tablename__ = "post_images"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)
    path = Column(String, nullable=False)
    caption = Column(String)
    post = relationship("Post", back_populates="images")


class StudySession(Base):
    __tablename__ = "study_sessions"

    sid = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    start_time = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    end_time = Column(TIMESTAMP(timezone=True))
    duration_minutes = Column(Integer)

    user = relationship("User", back_populates="sessions")


class DailyProgress(Base):
    __tablename__ = "daily_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    date = Column(TIMESTAMP(timezone=True), nullable=False)
    total_minutes = Column(Integer, default=0)
    badge_level = Column(Integer, default=0)

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
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)
    username = Column(String, nullable=False)
    user = relationship("User")
    post = relationship("Post", back_populates="comments")

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

# class ChatMessage(Base):
#     __tablename__ = "chat_messages"
#     __table_args__ = (Index("ix_msg_chat_created", "chat_id", "created_at"),)

#     id = Column(Integer, primary_key=True)
#     chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
#     sender_id = Column(Integer, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
#     text = Column(Text, nullable=False)
#     created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

#     chat = relationship("Chat", back_populates="messages")
#     sender = relationship("User")

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
    