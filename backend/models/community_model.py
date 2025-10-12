from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    HELPFUL = "helpful"
    THINKING = "thinking"
    CELEBRATE = "celebrate"

class PostType(str, Enum):
    TEXT = "text"
    QUESTION = "question"
    RESOURCE_SHARE = "resource_share"
    ANNOUNCEMENT = "announcement"

class MediaAttachment(BaseModel):
    type: str  # "image", "document", "pdf"
    filename: str
    url: str
    size: Optional[int] = None
    mime_type: Optional[str] = None

class Reaction(BaseModel):
    user_id: str
    user_name: str
    reaction_type: ReactionType
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: Optional[str] = None
    author_id: str
    author_name: str
    content: str
    attachments: Optional[List[MediaAttachment]] = []
    reactions: Optional[List[Reaction]] = []
    replies: Optional[List[Any]] = []  # Changed from List['Comment'] to List[Any] to avoid circular reference
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_edited: bool = False

class PostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    post_type: PostType = PostType.TEXT
    tags: Optional[List[str]] = []
    subject_area: Optional[str] = None
    grade_level: Optional[str] = None
    attachments: Optional[List[MediaAttachment]] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    subject_area: Optional[str] = None
    grade_level: Optional[str] = None

class Post(BaseModel):
    id: Optional[str] = None
    author_id: str
    author_name: str
    author_school: Optional[str] = None
    title: Optional[str] = None
    content: str
    post_type: PostType = PostType.TEXT
    tags: Optional[List[str]] = []
    subject_area: Optional[str] = None
    grade_level: Optional[str] = None
    attachments: Optional[List[MediaAttachment]] = []
    reactions: Optional[List[Reaction]] = []
    comments: Optional[List[Comment]] = []
    view_count: int = 0
    is_pinned: bool = False
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_edited: bool = False

class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None  # For replies
    attachments: Optional[List[MediaAttachment]] = []

class ReactionCreate(BaseModel):
    reaction_type: ReactionType

class CommunityStats(BaseModel):
    total_posts: int
    total_comments: int
    total_reactions: int
    total_users: int
    recent_activity: int
    popular_tags: List[dict]
    active_discussions: List[dict]

class AIDiscussionSummary(BaseModel):
    post_id: str
    summary: str
    key_points: List[str]
    suggested_resources: List[dict]
    related_discussions: List[str]
    ai_insights: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationCreate(BaseModel):
    user_id: str
    type: str  # "new_comment", "new_reaction", "mention", "ai_suggestion"
    title: str
    message: str
    related_post_id: Optional[str] = None
    related_comment_id: Optional[str] = None
    data: Optional[dict] = None

class Notification(BaseModel):
    id: Optional[str] = None
    user_id: str
    type: str
    title: str
    message: str
    related_post_id: Optional[str] = None
    related_comment_id: Optional[str] = None
    data: Optional[dict] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)