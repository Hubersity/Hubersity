from sqlalchemy import Table, ForeignKey, Column, Integer, String, Boolean, TIMESTAMP, text, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    uid = Column(Integer, primary_key=True, nullable=False) # for user id
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default=text('now()'))
    profile_image = Column(String, nullable=True)
    description = Column(String, nullable=True)

    posts = relationship("Post", back_populates="user")

forum_tags = Table(
    "forum_tags",
    Base.metadata,
    Column("forum_id", Integer, ForeignKey("forum.fid"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.tid"), primary_key=True)
)

class Tag(Base):
    __tablename__ = "tags"

    tid = Column(Integer, primary_key=True, nullable=False) # for tag id
    name = Column(String, unique=True, nullable=False)
    
    forums = relationship(
        "Forum", secondary=forum_tags, back_populates="tags"
    )

class Forum(Base):
    __tablename__ = "forum"
    
    fid = Column(Integer, primary_key=True, nullable=False)
    forum_name = Column(String, nullable=False)
    
    tags = relationship(
        "Tag", secondary=forum_tags, back_populates="forums"
    )

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
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class PostImage(Base):
    __tablename__ = "post_images"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)
    path = Column(String, nullable=False)
    caption = Column(String)
    post = relationship("Post", back_populates="images")

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
