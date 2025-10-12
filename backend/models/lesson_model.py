from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class LessonType(str, Enum):
    LECTURE = "lecture"
    WORKSHOP = "workshop"
    DISCUSSION = "discussion"
    PRACTICAL = "practical"
    ASSESSMENT = "assessment"
    REVIEW = "review"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class LessonGenerationRequest(BaseModel):
    topic: str = Field(..., description="Main topic/subject for the lesson")
    grade_level: str = Field(..., description="Target grade level")
    subject_area: str = Field(..., description="Subject area (math, science, etc.)")
    duration_minutes: int = Field(default=45, description="Lesson duration in minutes")
    lesson_type: LessonType = Field(default=LessonType.LECTURE, description="Type of lesson")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.INTERMEDIATE, description="Difficulty level")
    learning_objectives: List[str] = Field(default=[], description="Specific learning objectives")
    selected_resources: List[str] = Field(default=[], description="IDs of selected resources to use as reference")
    additional_context: Optional[str] = Field(default=None, description="Additional context or requirements")

class LessonSection(BaseModel):
    title: str
    content: str
    duration_minutes: int
    activities: List[str] = Field(default=[])
    materials_needed: List[str] = Field(default=[])

class GeneratedLesson(BaseModel):
    id: Optional[str] = Field(default=None)
    title: str
    topic: str
    grade_level: str
    subject_area: str
    duration_minutes: int
    lesson_type: LessonType
    difficulty: DifficultyLevel
    learning_objectives: List[str]
    lesson_overview: str
    sections: List[LessonSection]
    assessment_methods: List[str]
    homework_suggestions: List[str]
    additional_resources: List[str]
    generated_from_resources: List[str] = Field(default=[], description="Resource IDs used for generation")
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionRequest(BaseModel):
    question: str = Field(..., description="Question to ask the AI assistant")
    lesson_id: Optional[str] = Field(default=None, description="ID of specific lesson for context")
    resource_ids: List[str] = Field(default=[], description="Specific resource IDs to search in")
    context_type: str = Field(default="general", description="Type of context: general, lesson, resource")

class AIResponse(BaseModel):
    answer: str
    confidence_score: float = Field(default=0.0, description="Confidence score from 0.0 to 1.0")
    sources: List[Dict[str, Any]] = Field(default=[], description="Sources used to generate the answer")
    related_lessons: List[str] = Field(default=[], description="Related lesson IDs")
    suggested_resources: List[str] = Field(default=[], description="Suggested resource IDs")

class LessonSummary(BaseModel):
    id: str
    title: str
    topic: str
    grade_level: str
    subject_area: str
    duration_minutes: int
    lesson_type: LessonType
    created_at: datetime

# Database models (for MongoDB storage)
class LessonInDB(BaseModel):
    title: str
    topic: str
    grade_level: str
    subject_area: str
    duration_minutes: int
    lesson_type: str
    difficulty: str
    learning_objectives: List[str]
    lesson_overview: str
    sections: List[Dict[str, Any]]
    assessment_methods: List[str]
    homework_suggestions: List[str]
    additional_resources: List[str]
    generated_from_resources: List[str]
    created_by: str
    created_at: datetime
    updated_at: datetime