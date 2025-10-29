from sqlalchemy import Table, ForeignKey, Column, Integer, String, Boolean, TIMESTAMP, text, Text, DateTime
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
    is_admin = Column(Boolean, nullable=False, default=False)
    is_banned = Column(Boolean, default=False)
    ban_until = Column(DateTime, nullable=True)

    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("DailyProgress", back_populates="user", cascade="all, delete-orphan")
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", backref="follower", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", backref="following", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", cascade="all, delete-orphan")
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
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    

class Report(Base):
    __tablename__ = "reports"

    rid = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.pid"))
    reporter_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    reason = Column(String)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text('now()')
    )
    status = Column(String, default="pending")
    post = relationship("Post", back_populates="reports")
    reporter = relationship("User", back_populates="reports")

