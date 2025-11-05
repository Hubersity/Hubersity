from sqlalchemy import Table, ForeignKey, Column, Integer, String, Boolean, TIMESTAMP, text, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from .database import Base


class User(Base):
    __tablename__ = "users"

    uid = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    profile_image = Column(String, nullable=True)
    description = Column(String, nullable=True)
    likes = relationship("Like", back_populates="user")
    posts = relationship("Post", back_populates="user")

    sessions = relationship("StudySession", back_populates="user")
    progress = relationship("DailyProgress", back_populates="user")


forum_tags = Table(
    "forum_tags",
    Base.metadata,
    Column("forum_id", Integer, ForeignKey("forum.fid"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    forums = relationship(
        "Forum", secondary=forum_tags, back_populates="tags")


class Forum(Base):
    __tablename__ = "forum"

    fid = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    tags = relationship("Tag", secondary=forum_tags,
                        back_populates="forums")
    posts = relationship("Post", back_populates="forum")


class Post(Base):
    __tablename__ = "post"

    pid = Column(Integer, primary_key=True, nullable=False)
    post_content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    user_id = Column(Integer, ForeignKey(
        "users.uid", ondelete="CASCADE"), nullable=False)
    forum_id = Column(Integer, ForeignKey(
        "forum.fid", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", back_populates="posts")
    forum = relationship("Forum", back_populates="posts")
    likes = relationship("Like", back_populates="post")
    comments = relationship("Comment", back_populates="post")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    start_time = Column(TIMESTAMP(timezone=True), nullable=False)
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
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    user_id = Column(Integer, ForeignKey("users.uid"), nullable=False)
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)

    user = relationship("User")
    post = relationship("Post", back_populates="comments")