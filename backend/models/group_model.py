from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GroupType(str, Enum):
    SUBJECT = "subject"  # Math, Science, etc.
    GRADE = "grade"     # Grade 1, Grade 2, etc.
    SCHOOL = "school"   # School-specific groups
    PROJECT = "project" # Project-based groups
    GENERAL = "general" # General discussion

class MemberRole(str, Enum):
    ADMIN = "admin"     # Can add/remove members, manage group
    MODERATOR = "moderator"  # Can manage posts, assignments
    MEMBER = "member"   # Regular member

class GroupMember(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    role: MemberRole = MemberRole.MEMBER
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class GroupSettings(BaseModel):
    allow_member_posts: bool = True
    allow_member_assignments: bool = False  # Only admins/moderators by default
    auto_approve_members: bool = True
    post_approval_required: bool = False
    assignment_notifications: bool = True

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    group_type: GroupType = GroupType.GENERAL
    subject_area: Optional[str] = None
    grade_level: Optional[str] = None
    is_private: bool = False
    color: Optional[str] = "bg-blue-500"  # UI color for the group
    settings: Optional[GroupSettings] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[GroupSettings] = None
    is_private: Optional[bool] = None

class Group(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    group_type: GroupType = GroupType.GENERAL
    subject_area: Optional[str] = None
    grade_level: Optional[str] = None
    created_by: str  # user_id of creator
    created_by_name: str
    members: List[GroupMember] = []
    member_count: int = 0
    is_private: bool = False
    color: Optional[str] = "bg-blue-500"  # UI color for the group
    settings: GroupSettings = Field(default_factory=GroupSettings)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# Assignment Models
class AssignmentType(str, Enum):
    HOMEWORK = "homework"
    PROJECT = "project"
    QUIZ = "quiz"
    READING = "reading"
    PRACTICE = "practice"

class AssignmentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class AssignmentAttachment(BaseModel):
    type: str  # "document", "image", "video", "link"
    name: str
    url: str
    size: Optional[int] = None

class AssignmentSubmission(BaseModel):
    id: Optional[str] = None
    student_id: str
    student_name: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    attachments: List[AssignmentAttachment] = []
    notes: Optional[str] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None
    status: str = "submitted"

class AssignmentCreate(BaseModel):
    title: str
    description: str
    assignment_type: AssignmentType = AssignmentType.HOMEWORK
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    attachments: List[AssignmentAttachment] = []
    instructions: Optional[str] = None
    group_id: str

class Assignment(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    assignment_type: AssignmentType = AssignmentType.HOMEWORK
    group_id: str
    group_name: str
    created_by: str
    created_by_name: str
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    attachments: List[AssignmentAttachment] = []
    instructions: Optional[str] = None
    submissions: List[AssignmentSubmission] = []
    status: AssignmentStatus = AssignmentStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# Group Message Models (for group chat)
class GroupMessageType(str, Enum):
    TEXT = "text"
    ASSIGNMENT = "assignment"
    ANNOUNCEMENT = "announcement"
    POLL = "poll"
    FILE = "file"

class GroupMessage(BaseModel):
    id: Optional[str] = None
    group_id: str
    sender_id: str
    sender_name: str
    message_type: GroupMessageType = GroupMessageType.TEXT
    content: str
    attachments: List[AssignmentAttachment] = []
    assignment_id: Optional[str] = None  # If message is about an assignment
    reply_to: Optional[str] = None  # Message ID being replied to
    reactions: List[dict] = []  # Same as community reactions
    is_pinned: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    is_edited: bool = False

class GroupMessageCreate(BaseModel):
    content: str
    message_type: GroupMessageType = GroupMessageType.TEXT
    reply_to: Optional[str] = None
    attachments: List[AssignmentAttachment] = []

# Group Statistics
class GroupStats(BaseModel):
    total_groups: int
    total_members: int
    active_assignments: int
    completed_assignments: int
    messages_today: int
    popular_subjects: List[dict]
    recent_activity: List[dict]