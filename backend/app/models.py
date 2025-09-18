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

body = Column(Text, nullable=False)
image_urls = Column(JSONB, nullable=True)

class PostTag(Base):
    __tablename__ = "post_tags"

    ptid = Column(Integer, primary_key=True, nullable=False) # post tag id
    name = Column(String, unique=True, nullable=False)

post_post_tags = Table(
    "post_post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("post.pid"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("post_tags.ptid"), primary_key=True)
)

class Post(Base):
    __tablename__ = "post"
    
    pid = Column(Integer, primary_key=True, nullable=False) # for post id
    post_name = Column(String, nullable=False)
    forum_id = Column(Integer, nullable=False)
    
    tags = relationship(
        "PostTag",
        secondary=post_post_tags,
        back_populates="posts"
    )

class PostImage(Base):
    __tablename__ = "post_images"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("post.pid"), nullable=False)
    url = Column(String, nullable=False)
    caption = Column(String)
