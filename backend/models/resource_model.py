from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ResourceType(str, Enum):
    LESSON_PLAN = "lesson_plan"
    WORKSHEET = "worksheet"
    PRESENTATION = "presentation"
    VIDEO = "video"
    AUDIO = "audio"
    IMAGE = "image"
    PDF = "pdf"
    DOCUMENT = "document"
    OTHER = "other"

class SubjectArea(str, Enum):
    MATHEMATICS = "mathematics"
    SCIENCE = "science"
    ENGLISH = "english"
    HISTORY = "history"
    GEOGRAPHY = "geography"
    ART = "art"
    MUSIC = "music"
    PHYSICAL_EDUCATION = "physical_education"
    COMPUTER_SCIENCE = "computer_science"
    LANGUAGES = "languages"
    OTHER = "other"

class GradeLevel(str, Enum):
    PRESCHOOL = "preschool"
    KINDERGARTEN = "kindergarten"
    GRADE_1 = "grade_1"
    GRADE_2 = "grade_2"
    GRADE_3 = "grade_3"
    GRADE_4 = "grade_4"
    GRADE_5 = "grade_5"
    GRADE_6 = "grade_6"
    GRADE_7 = "grade_7"
    GRADE_8 = "grade_8"
    GRADE_9 = "grade_9"
    GRADE_10 = "grade_10"
    GRADE_11 = "grade_11"
    GRADE_12 = "grade_12"
    MIXED = "mixed"

class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject_area: SubjectArea
    grade_level: GradeLevel
    resource_type: ResourceType
    tags: Optional[List[str]] = Field(default=[], max_items=10)
    is_public: bool = Field(default=True)
    language: Optional[str] = Field(default="en", max_length=10)
    
class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject_area: Optional[SubjectArea] = None
    grade_level: Optional[GradeLevel] = None
    tags: Optional[List[str]] = Field(None, max_items=10)
    is_public: Optional[bool] = None
    language: Optional[str] = Field(None, max_length=10)

class ResourceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    subject_area: SubjectArea
    grade_level: GradeLevel
    resource_type: ResourceType
    tags: List[str]
    is_public: bool
    language: str
    author_id: str
    author_name: str
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    ratings_count: int = 0
    average_rating: float = 0.0
    download_count: int = 0
    view_count: int = 0

class ResourceList(BaseModel):
    resources: List[ResourceResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class ResourceRating(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)

class ResourceRatingResponse(BaseModel):
    id: str
    resource_id: str
    user_id: str
    user_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime

class ResourceLike(BaseModel):
    resource_id: str

class ResourceStats(BaseModel):
    total_resources: int
    total_downloads: int
    total_likes: int
    total_ratings: int
    popular_subjects: List[dict]
    popular_grades: List[dict]
    recent_uploads: int

# File upload related models
class FileUploadResponse(BaseModel):
    filename: str
    file_url: str
    file_size: int
    mime_type: str
    upload_success: bool
    message: str