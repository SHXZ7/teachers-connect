from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import json
import os
from pathlib import Path

# Import file processing libraries
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    from docx import Document
except ImportError:
    Document = None

from models.lesson_model import (
    LessonGenerationRequest, GeneratedLesson, LessonSummary,
    QuestionRequest, AIResponse
)
from services.openrouter_ai_service import openrouter_ai_service
from database import get_database, test_connection
from routes.auth_routes import get_current_user

router = APIRouter()
security = HTTPBearer()

# Get database instance
db = get_database()

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    try:
        db_connected = test_connection()
        if not db_connected:
            return {"status": "error", "message": "Database connection failed", "database_connected": False}
        
        # Test basic database operation
        count = db.lessons.count_documents({})
        return {
            "status": "ok", 
            "database": "connected",
            "total_lessons_in_db": count
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/lessons/generate", response_model=Dict[str, Any])
async def generate_lesson(
    request: LessonGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a lesson plan using AI based on topic and selected resources"""
    try:
        print(f"Generating lesson for user: {current_user['email']}")
        print(f"Lesson request: {request}")
        
        # Get resource content if resources are specified
        resource_content = ""
        db = get_database()
        
        if request.selected_resources:
            resources_collection = db.resources
            for resource_id in request.selected_resources:
                try:
                    resource = resources_collection.find_one(
                        {"_id": ObjectId(resource_id), "created_by": current_user["id"]}
                    )
                    if resource:
                        # Try to extract content from the resource
                        content = await extract_file_content(resource)
                        if content and not content.startswith("Error"):
                            resource_content += f"\n\n--- Content from {resource.get('title', 'Resource')} ---\n{content[:1000]}..."
                except Exception as e:
                    print(f"Error processing resource {resource_id}: {e}")
                    continue
        
        # Use OpenRouter AI to generate the lesson
        lesson = await openrouter_ai_service.generate_lesson_plan(
            request=request,
            resource_context=resource_content
        )
        
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate lesson plan"
            )
        
        # Set the created_by field to current user
        lesson.created_by = current_user["id"]
        
        # Prepare lesson data for database
        lesson_data = {
            "title": lesson.title,
            "topic": lesson.topic,
            "grade_level": lesson.grade_level,
            "subject_area": lesson.subject_area,
            "duration_minutes": lesson.duration_minutes,
            "lesson_type": lesson.lesson_type.value,
            "difficulty": lesson.difficulty.value,
            "learning_objectives": lesson.learning_objectives,
            "lesson_overview": lesson.lesson_overview,
            "sections": [
                {
                    "title": section.title,
                    "content": section.content,
                    "duration_minutes": section.duration_minutes,
                    "activities": section.activities,
                    "materials_needed": section.materials_needed
                }
                for section in lesson.sections
            ],
            "assessment_methods": lesson.assessment_methods,
            "homework_suggestions": lesson.homework_suggestions,
            "additional_resources": lesson.additional_resources,
            "generated_from_resources": lesson.generated_from_resources,
            "created_by": lesson.created_by,
            "created_at": lesson.created_at,
            "updated_at": lesson.updated_at
        }
        
        # Save to database
        result = db.lessons.insert_one(lesson_data)
        lesson_id = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Lesson generated successfully",
            "lesson_id": lesson_id,
            "lesson": {
                "id": lesson_id,
                "title": lesson.title,
                "topic": lesson.topic,
                "grade_level": lesson.grade_level,
                "subject_area": lesson.subject_area,
                "duration_minutes": lesson.duration_minutes,
                "lesson_type": lesson.lesson_type.value,
                "difficulty": lesson.difficulty.value,
                "learning_objectives": lesson.learning_objectives,
                "lesson_overview": lesson.lesson_overview,
                "sections": [
                    {
                        "title": section.title,
                        "content": section.content,
                        "duration_minutes": section.duration_minutes,
                        "activities": section.activities,
                        "materials_needed": section.materials_needed
                    }
                    for section in lesson.sections
                ],
                "assessment_methods": lesson.assessment_methods,
                "homework_suggestions": lesson.homework_suggestions,
                "additional_resources": lesson.additional_resources,
                "generated_from_resources": lesson.generated_from_resources,
                "created_at": lesson.created_at.isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error generating lesson: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate lesson: {str(e)}"
        )

@router.get("/lessons", response_model=Dict[str, Any])
async def get_lessons(
    page: int = 1,
    per_page: int = 10,
    grade_level: str = None,
    subject_area: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get lessons created by the current user"""
    try:
        # Test database connection
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Build query
        query = {"created_by": current_user["id"]}
        
        if grade_level:
            query["grade_level"] = grade_level
        if subject_area:
            query["subject_area"] = subject_area
        
        # Calculate pagination
        skip = (page - 1) * per_page
        
        # Get total count
        total_count = db.lessons.count_documents(query)
        
        # Get lessons with pagination
        lessons_cursor = db.lessons.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(per_page)
        
        lessons = []
        for lesson_doc in lessons_cursor:
            lessons.append({
                "id": str(lesson_doc["_id"]),
                "title": lesson_doc.get("title", ""),
                "topic": lesson_doc.get("topic", ""),
                "grade_level": lesson_doc.get("grade_level", ""),
                "subject_area": lesson_doc.get("subject_area", ""),
                "duration_minutes": lesson_doc.get("duration_minutes", 0),
                "lesson_type": lesson_doc.get("lesson_type", ""),
                "difficulty": lesson_doc.get("difficulty", ""),
                "created_at": lesson_doc.get("created_at", datetime.utcnow()).isoformat()
            })
        
        return {
            "success": True,
            "lessons": lessons,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": (total_count + per_page - 1) // per_page
            }
        }
        
    except Exception as e:
        print(f"Error getting lessons: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve lessons: {str(e)}"
        )

@router.get("/lessons/stats", response_model=Dict[str, Any])
async def get_lesson_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get lesson generation statistics"""
    try:
        print(f"Stats endpoint called for user: {current_user.get('email', 'unknown')}")
        
        # Check database connection
        if not test_connection():
            print("Database connection failed")
            return {
                "success": True,
                "total_lessons": 0,
                "recent_lessons": 0,
                "lessons_by_subject": [],
                "notes_count": 0,
                "message": "Database temporarily unavailable"
            }
        
        user_id = current_user.get("id")
        if not user_id:
            print("User ID not found in current_user")
            return {
                "success": True,
                "total_lessons": 0,
                "recent_lessons": 0,
                "lessons_by_subject": [],
                "notes_count": 0,
                "message": "User authentication issue"
            }
        
        try:
            # Get total lessons count
            total_lessons = db.lessons.count_documents({"created_by": user_id})
            print(f"Total lessons for user: {total_lessons}")
            
            # Get recent lessons (last 7 days)
            from datetime import timedelta
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_lessons = db.lessons.count_documents({
                "created_by": user_id,
                "created_at": {"$gte": week_ago}
            })
            print(f"Recent lessons: {recent_lessons}")
            
            # Get lessons by subject
            pipeline = [
                {"$match": {"created_by": user_id}},
                {"$group": {
                    "_id": "$subject_area",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            lessons_by_subject = []
            for result in db.lessons.aggregate(pipeline):
                lessons_by_subject.append({
                    "subject": result.get("_id", "Unknown"),
                    "count": result.get("count", 0)
                })
            
            print(f"Lessons by subject: {lessons_by_subject}")
            
            # Get notes count
            notes_count = 0
            try:
                notes_count = db.notes.count_documents({"generated_by": user_id})
                print(f"Notes count: {notes_count}")
            except Exception as notes_error:
                print(f"Error counting notes: {notes_error}")
            
            return {
                "success": True,
                "total_lessons": total_lessons,
                "recent_lessons": recent_lessons,
                "lessons_by_subject": lessons_by_subject,
                "notes_count": notes_count,
                "user_id": user_id
            }
            
        except Exception as db_error:
            print(f"Database operation error: {db_error}")
            import traceback
            traceback.print_exc()
            
            # Return safe fallback data
            return {
                "success": True,
                "total_lessons": 0,
                "recent_lessons": 0,
                "lessons_by_subject": [],
                "notes_count": 0,
                "error": "Database query failed",
                "user_id": user_id
            }
        
    except Exception as e:
        print(f"Error in stats endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a safe response instead of raising an exception
        return {
            "success": False,
            "total_lessons": 0,
            "recent_lessons": 0,
            "lessons_by_subject": [],
            "notes_count": 0,
            "error": str(e),
            "message": "Statistics temporarily unavailable"
        }

@router.get("/lessons/{lesson_id}", response_model=Dict[str, Any])
async def get_lesson(
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific lesson by ID"""
    try:
        lesson_doc = db.lessons.find_one({
            "_id": ObjectId(lesson_id),
            "created_by": current_user["id"]
        })
        
        if not lesson_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        lesson = {
            "id": str(lesson_doc["_id"]),
            "title": lesson_doc.get("title", ""),
            "topic": lesson_doc.get("topic", ""),
            "grade_level": lesson_doc.get("grade_level", ""),
            "subject_area": lesson_doc.get("subject_area", ""),
            "duration_minutes": lesson_doc.get("duration_minutes", 0),
            "lesson_type": lesson_doc.get("lesson_type", ""),
            "difficulty": lesson_doc.get("difficulty", ""),
            "learning_objectives": lesson_doc.get("learning_objectives", []),
            "lesson_overview": lesson_doc.get("lesson_overview", ""),
            "sections": lesson_doc.get("sections", []),
            "assessment_methods": lesson_doc.get("assessment_methods", []),
            "homework_suggestions": lesson_doc.get("homework_suggestions", []),
            "additional_resources": lesson_doc.get("additional_resources", []),
            "generated_from_resources": lesson_doc.get("generated_from_resources", []),
            "created_at": lesson_doc.get("created_at", datetime.utcnow()).isoformat()
        }
        
        return {
            "success": True,
            "lesson": lesson
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting lesson: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve lesson: {str(e)}"
        )

@router.delete("/lessons/{lesson_id}", response_model=Dict[str, Any])
async def delete_lesson(
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific lesson"""
    try:
        result = db.lessons.delete_one({
            "_id": ObjectId(lesson_id),
            "created_by": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        return {
            "success": True,
            "message": "Lesson deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting lesson: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete lesson: {str(e)}"
        )

@router.post("/ai/ask", response_model=Dict[str, Any])
async def ask_ai_question(
    question_request: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Ask a question to the AI assistant with RAG capabilities"""
    try:
        print(f"AI question from user {current_user['email']}: {question_request.question}")
        
        # Use OpenRouter AI with RAG to answer the question
        response = await openrouter_ai_service.answer_question(
            question=question_request.question,
            context=getattr(question_request, 'context', ''),
            subject_area=getattr(question_request, 'subject_area', None),
            grade_level=getattr(question_request, 'grade_level', None),
            user_id=current_user["id"]  # Pass user ID for RAG
        )
        
        if not response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get AI response"
            )
            
        return {
            "success": True,
            "answer": response.get("answer", "No response generated"),
            "confidence_score": response.get("confidence_score", 0.8),
            "sources": response.get("sources", []),
            "suggestions": response.get("suggestions", []),
            "context_used": response.get("context_used", False),
            "model_used": response.get("model_used", "OpenRouter AI")
        }
        
    except Exception as e:
        print(f"Error processing AI question: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "answer": "I apologize, but I encountered an error while processing your question. Please ensure you have uploaded resources and generated notes, then try again with a clear, specific question.",
            "confidence_score": 0.3,
            "sources": [],
            "suggestions": [
                "Upload relevant educational resources first",
                "Generate notes from your documents using the Smart Notes Generator",
                "Try asking a more specific question",
                "Check your internet connection and try again"
            ],
            "context_used": False,
            "error": str(e)
        }

@router.get("/ai/suggestions/resources", response_model=Dict[str, Any])
async def get_resource_suggestions(
    topic: str = None,
    grade_level: str = None,
    subject_area: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get AI suggestions for resources based on topic/grade/subject"""
    try:
        query = {}
        
        if topic:
            query["$or"] = [
                {"title": {"$regex": topic, "$options": "i"}},
                {"description": {"$regex": topic, "$options": "i"}}
            ]
        
        if grade_level:
            query["grade_level"] = grade_level
            
        if subject_area:
            query["subject_area"] = subject_area
        
        # Get matching resources
        resources_cursor = db.resources.find(query)\
            .sort("average_rating", -1)\
            .limit(10)
        
        suggestions = []
        async for resource in resources_cursor:
            suggestions.append({
                "id": str(resource["_id"]),
                "title": resource.get("title", ""),
                "description": resource.get("description", ""),
                "subject_area": resource.get("subject_area", ""),
                "grade_level": resource.get("grade_level", ""),
                "file_type": resource.get("file_type", ""),
                "average_rating": resource.get("average_rating", 0),
                "likes_count": resource.get("likes_count", 0)
            })
        
        return {
            "success": True,
            "suggestions": suggestions,
            "message": f"Found {len(suggestions)} relevant resources"
        }
        
    except Exception as e:
        print(f"Error getting resource suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )

@router.post("/notes/generate", response_model=Dict[str, Any])
async def generate_notes_from_resource(
    request: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered notes from uploaded resources"""
    try:
        print(f"Notes generation request received: {request}")
        print(f"Current user: {current_user}")
        
        resource_id = request.get("resource_id")
        notes_type = request.get("notes_type", "detailed")
        focus_areas = request.get("focus_areas", [])
        additional_instructions = request.get("additional_instructions", "")
        
        print(f"Resource ID: {resource_id}")
        
        if not resource_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resource ID is required"
            )
        
        try:
            # Get resource from database
            resource = db.resources.find_one({"_id": ObjectId(resource_id)})
            print(f"Found resource: {resource is not None}")
            
            if not resource:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Resource not found"
                )
        except Exception as e:
            print(f"Error finding resource: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error accessing resource: {str(e)}"
            )
        
        try:
            # Extract content from file based on type
            print("Extracting file content...")
            file_content = await extract_file_content(resource)
            print(f"File content extracted, length: {len(file_content)}")
        except Exception as e:
            print(f"Error extracting file content: {e}")
            file_content = f"Error extracting content: {str(e)}"
        
        try:
            # Generate AI notes from content using OpenRouter
            print("Generating AI notes using OpenRouter...")
            notes = await openrouter_ai_service.generate_comprehensive_notes(
                content=file_content,
                resource_metadata=resource,
                notes_type=notes_type,
                focus_areas=focus_areas,
                additional_instructions=additional_instructions
            )
            print("AI notes generated successfully with OpenRouter")
        except Exception as e:
            print(f"Error generating AI notes: {e}")
            import traceback
            traceback.print_exc()
            # Create fallback notes
            notes = {
                "summary": f"Notes for {resource.get('title', 'Unknown resource')}",
                "key_points": ["Error occurred during note generation", f"Error: {str(e)}"],
                "detailed_content": file_content[:1000] if file_content else "No content available",
                "vocabulary": [],
                "questions": ["What can we learn from this resource?"]
            }
        
        try:
            # Save notes to database
            print("Saving notes to database...")
            notes_data = {
                "title": f"AI Notes: {resource['title']}",
                "resource_id": resource_id,
                "resource_title": resource["title"],
                "resource_type": resource["resource_type"],
                "subject_area": resource["subject_area"],
                "grade_level": resource["grade_level"],
                "content": notes,
                "notes_type": notes_type,
                "focus_areas": focus_areas,
                "generated_by": current_user["id"],
                "created_at": datetime.utcnow(),
                "ai_model": notes.get("model_used", "OpenRouter AI"),
                "ai_enhanced": notes.get("ai_enhanced", True)
            }
            
            result = db.notes.insert_one(notes_data)
            notes_id = str(result.inserted_id)
            print(f"Notes saved with ID: {notes_id}")
        except Exception as e:
            print(f"Error saving notes: {e}")
            # Continue without saving to database
            notes_id = "temp-id"
        
        return {
            "success": True,
            "message": "Notes generated successfully",
            "notes_id": notes_id,
            "notes": {
                "id": notes_id,
                "title": f"AI Notes: {resource['title']}",
                "summary": notes.get("summary", ""),
                "key_points": notes.get("key_points", []),
                "detailed_content": notes.get("detailed_content", ""),
                "vocabulary": notes.get("vocabulary", []),
                "questions": notes.get("questions", []),
                "resource_info": {
                    "title": resource["title"],
                    "type": resource["resource_type"],
                    "subject": resource["subject_area"],
                    "grade_level": resource["grade_level"]
                },
                "generated_at": datetime.utcnow(),
                "ai_model": "Content Extraction + Analysis"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in notes generation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate notes: {str(e)}"
        )

async def extract_file_content(resource):
    """Extract text content from uploaded file based on its type"""
    try:
        print(f"Resource data: {resource}")  # Debug log
        
        # Check if filename exists in resource
        filename = resource.get("filename") or resource.get("file_name") or resource.get("original_filename")
        
        if not filename:
            # Try to construct filename from title and type
            title = resource.get('title', 'unknown')
            file_type = resource.get('resource_type', 'unknown')
            filename = f"{title}.{file_type}"
            print(f"No filename found, constructed: {filename}")
        
        # Get file path - check multiple possible locations
        upload_dirs = [
            Path("uploads"),
            Path("../uploads"), 
            Path("../../uploads"),
            Path("backend/uploads"),
            Path("./backend/uploads"),
            Path("frontend/public/uploads"),
            Path("../frontend/public/uploads")
        ]
        
        file_path = None
        for upload_dir in upload_dirs:
            potential_path = upload_dir / filename
            if potential_path.exists():
                file_path = potential_path
                print(f"Found file at: {file_path}")
                break
        
        if not file_path:
            # Check if there's a file_url or file_path in the resource
            file_url = resource.get("file_url") or resource.get("file_path") or resource.get("url")
            
            if file_url:
                return f"""File stored remotely: {filename}
                
Resource Information:
- Title: {resource.get('title', 'Unknown')}
- Type: {resource.get('resource_type', 'Unknown')}
- Subject: {resource.get('subject_area', 'Unknown')}
- Grade Level: {resource.get('grade_level', 'Unknown')}
- Description: {resource.get('description', 'No description available')}
- File URL: {file_url}

Note: This resource appears to be stored remotely or as a URL reference. To extract content from remote files, additional implementation would be needed.

Based on the resource metadata, here are some study points:
- This is a {resource.get('resource_type', 'unknown type')} resource about {resource.get('subject_area', 'the subject')}
- Suitable for {resource.get('grade_level', 'students')}
- Focus areas might include the core concepts of {resource.get('subject_area', 'the subject area')}"""
            
            # If no file found anywhere, return content based on metadata
            return f"""Local file not found: {filename}
            
Resource Information:
- Title: {resource.get('title', 'Unknown')}
- Type: {resource.get('resource_type', 'Unknown')}
- Subject: {resource.get('subject_area', 'Unknown')}
- Grade Level: {resource.get('grade_level', 'Unknown')}
- Description: {resource.get('description', 'No description available')}

Study Content Based on Metadata:

Topic Overview:
This {resource.get('resource_type', 'resource')} covers material in {resource.get('subject_area', 'the subject area')} for {resource.get('grade_level', 'students')}.

Key Study Areas:
- Fundamental concepts in {resource.get('subject_area', 'this subject')}
- Core principles relevant to {resource.get('grade_level', 'this grade level')}
- Practical applications and examples
- Critical thinking and analysis skills

Learning Objectives:
- Understand the main concepts presented in '{resource.get('title', 'this resource')}'
- Apply knowledge of {resource.get('subject_area', 'the subject')} to real-world scenarios
- Develop skills appropriate for {resource.get('grade_level', 'this level')}

Note: The original file content could not be accessed. This study guide is based on the resource metadata. To get detailed content extraction, ensure the file is properly uploaded and accessible."""
        
        file_type = resource.get("resource_type", "").lower()
        
        if file_type == "pdf":
            return extract_pdf_content(file_path)
        elif file_type in ["doc", "docx"]:
            return extract_docx_content(file_path)
        elif file_type == "txt":
            return extract_txt_content(file_path)
        else:
            return f"""File type '{file_type}' processing:

File found at: {file_path}
Resource Information:
- Title: {resource.get('title', 'Unknown')}
- Subject: {resource.get('subject_area', 'Unknown')}
- Grade Level: {resource.get('grade_level', 'Unknown')}
- Description: {resource.get('description', 'No description available')}

Note: Text extraction is currently supported for PDF, DOCX, and TXT files. 
For {file_type} files, you can:
1. Convert the file to a supported format (PDF, DOCX, or TXT)
2. Manually copy key content to create study notes
3. Use the file as a reference while studying the subject matter"""
            
    except Exception as e:
        print(f"Error extracting file content: {e}")
        import traceback
        traceback.print_exc()
        
        return f"""Error accessing resource: {resource.get('title', 'Unknown resource')}

Error details: {str(e)}

Resource Information:
- Title: {resource.get('title', 'Unknown')}
- Type: {resource.get('resource_type', 'Unknown')}
- Subject: {resource.get('subject_area', 'Unknown')}
- Grade Level: {resource.get('grade_level', 'Unknown')}

Study Guide Based on Available Information:

Subject Focus: {resource.get('subject_area', 'General studies')}
This resource appears to cover topics in {resource.get('subject_area', 'this subject area')} suitable for {resource.get('grade_level', 'students')}.

Learning Approach:
- Review fundamental concepts in {resource.get('subject_area', 'the subject')}
- Connect theoretical knowledge to practical applications
- Practice problem-solving and critical thinking
- Prepare for assessments at the {resource.get('grade_level', 'appropriate')} level

You can still generate meaningful study notes based on the resource metadata and your knowledge of the subject area."""

def extract_pdf_content(file_path):
    """Extract text from PDF file"""
    try:
        if PyPDF2 is None:
            return f"PDF processing not available. PyPDF2 library is not installed.\n\nFile: {file_path.name}\nTo enable PDF text extraction, install PyPDF2: pip install PyPDF2"
        
        text_content = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_content.append(f"--- Page {page_num + 1} ---\n{page_text}")
                except Exception as e:
                    text_content.append(f"--- Page {page_num + 1} ---\n[Error extracting page: {str(e)}]")
        
        if not text_content:
            return f"No readable text content found in PDF: {file_path.name}\n\nThis may be because:\n- The PDF contains only images\n- The PDF is password protected\n- The PDF uses unsupported text encoding"
            
        return "\n\n".join(text_content)
        
    except Exception as e:
        return f"Error reading PDF file {file_path.name}: {str(e)}"

def extract_docx_content(file_path):
    """Extract text from DOCX file"""
    try:
        if Document is None:
            return f"DOCX processing not available. python-docx library is not installed.\n\nFile: {file_path.name}\nTo enable DOCX text extraction, install python-docx: pip install python-docx"
        
        doc = Document(file_path)
        text_content = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text)
        
        if not text_content:
            return f"No readable text content found in DOCX: {file_path.name}\n\nThis may be because the document contains only images, tables, or other non-text elements."
            
        return "\n\n".join(text_content)
        
    except Exception as e:
        return f"Error reading DOCX file {file_path.name}: {str(e)}"

def extract_txt_content(file_path):
    """Extract text from TXT file"""
    try:
        # Try different encodings
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    content = file.read()
                
                if content.strip():
                    return content
                else:
                    return f"Text file {file_path.name} appears to be empty."
                    
            except UnicodeDecodeError:
                continue
        
        # If all encodings fail
        return f"Could not read text file {file_path.name}. The file may be in an unsupported encoding or corrupted."
        
    except Exception as e:
        return f"Error reading text file {file_path.name}: {str(e)}"

async def generate_ai_notes(file_content, resource, notes_type, focus_areas, additional_instructions):
    """Generate structured notes from extracted file content"""
    try:
        # Check if this is an error message or metadata-based content
        is_error_content = "Error accessing" in file_content or "File not found" in file_content or "Local file not found" in file_content
        
        lines = file_content.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        # Get resource information
        title = resource.get('title', 'Unknown Resource')
        subject = resource.get('subject_area', 'General Studies')
        grade_level = resource.get('grade_level', 'All Levels')
        
        if is_error_content or len(non_empty_lines) < 3:
            # Generate notes based on metadata when file content is not available
            return generate_metadata_based_notes(resource, focus_areas, additional_instructions)
        
        # Generate summary (first few meaningful lines)
        summary_lines = []
        for line in non_empty_lines[:5]:
            if len(line) > 20 and not line.startswith('-') and not line.startswith('•'):  # Skip short lines and list items
                summary_lines.append(line)
                if len(summary_lines) >= 3:
                    break
        
        summary = " ".join(summary_lines) if summary_lines else f"Study notes for {title} in {subject}."
        
        # Extract key points (lines that look like headers or important statements)
        key_points = []
        for line in non_empty_lines:
            # Look for lines that might be headings or key points
            if (len(line) < 150 and 
                (line.isupper() or 
                 line.endswith(':') or 
                 line.startswith('•') or
                 line.startswith('-') or
                 any(keyword in line.lower() for keyword in ['definition', 'important', 'note', 'key', 'main', 'concept', 'principle']))):
                clean_point = line.strip('•- ').strip()
                if clean_point and len(clean_point) > 10:
                    key_points.append(clean_point)
                if len(key_points) >= 8:
                    break
        
        if not key_points:
            # If no clear key points, take some meaningful lines
            key_points = [line for line in non_empty_lines[1:6] if 20 < len(line) < 120]
        
        # If still no key points, create some based on subject
        if not key_points:
            key_points = [
                f"Core concepts in {subject}",
                f"Key principles for {grade_level} students",
                f"Practical applications of {subject}",
                "Critical thinking and analysis skills"
            ]
        
        # Extract vocabulary (words that might be technical terms)
        vocabulary = set()
        subject_keywords = {
            'science': ['hypothesis', 'experiment', 'observation', 'analysis', 'conclusion', 'theory', 'evidence'],
            'mathematics': ['equation', 'formula', 'calculation', 'theorem', 'proof', 'variable', 'function'],
            'english': ['literature', 'character', 'theme', 'metaphor', 'analysis', 'interpretation', 'narrative'],
            'history': ['chronology', 'civilization', 'revolution', 'democracy', 'empire', 'culture', 'society'],
            'geography': ['continent', 'climate', 'population', 'resources', 'environment', 'ecosystem', 'territory']
        }
        
        # Add subject-specific vocabulary
        for key, words in subject_keywords.items():
            if key.lower() in subject.lower():
                vocabulary.update(words[:5])
        
        # Extract vocabulary from content
        for line in non_empty_lines:
            words = line.split()
            for word in words:
                word_clean = word.strip('.,!?()[]{}":;').lower()
                if (len(word_clean) > 6 and 
                    word_clean.isalpha() and 
                    word_clean not in ['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'been', 'their', 'would', 'could', 'should', 'information', 'resource', 'content']):
                    vocabulary.add(word.strip('.,!?()[]{}":;'))
                    if len(vocabulary) >= 15:
                        break
            if len(vocabulary) >= 15:
                break
        
        # Generate study questions
        questions = [
            f"What are the main concepts covered in '{title}'?",
            f"How does this content relate to {subject}?",
            "What are the key takeaways from this material?",
            "How can you apply this information in practice?"
        ]
        
        if focus_areas:
            questions.append(f"How do the focus areas ({', '.join(focus_areas)}) relate to the content?")
        
        # Add subject-specific questions
        if 'science' in subject.lower():
            questions.append("What scientific methods or principles are demonstrated?")
        elif 'math' in subject.lower():
            questions.append("What mathematical concepts and problem-solving strategies are involved?")
        elif 'english' in subject.lower():
            questions.append("What literary devices or language techniques are used?")
        elif 'history' in subject.lower():
            questions.append("What historical context and cause-effect relationships are important?")
        
        return {
            "summary": summary[:500] + "..." if len(summary) > 500 else summary,
            "key_points": list(key_points[:10]),
            "detailed_content": file_content[:2000] + "..." if len(file_content) > 2000 else file_content,
            "vocabulary": list(vocabulary)[:15],
            "questions": questions[:6]
        }
        
    except Exception as e:
        print(f"Error generating AI notes: {e}")
        return generate_metadata_based_notes(resource, focus_areas, additional_instructions)

def generate_metadata_based_notes(resource, focus_areas, additional_instructions):
    """Generate study notes based only on resource metadata"""
    title = resource.get('title', 'Unknown Resource')
    subject = resource.get('subject_area', 'General Studies')
    grade_level = resource.get('grade_level', 'All Levels')
    resource_type = resource.get('resource_type', 'Document')
    description = resource.get('description', '')
    
    # Create subject-specific content
    subject_content = {
        'science': {
            'summary': f"This {resource_type.lower()} covers scientific concepts in {subject} for {grade_level} students, focusing on observation, experimentation, and analysis.",
            'key_points': [
                "Scientific method and experimental design",
                "Data collection and analysis techniques",
                "Theory and hypothesis formation",
                "Real-world applications of scientific principles",
                "Critical thinking in scientific contexts"
            ],
            'vocabulary': ['hypothesis', 'experiment', 'observation', 'analysis', 'theory', 'evidence', 'variable', 'conclusion'],
            'questions': [
                "What scientific principles are being studied?",
                "How can you design experiments to test hypotheses?",
                "What evidence supports the scientific theories presented?",
                "How do these concepts apply to real-world situations?"
            ]
        },
        'mathematics': {
            'summary': f"This {resource_type.lower()} presents mathematical concepts for {grade_level}, emphasizing problem-solving and logical reasoning.",
            'key_points': [
                "Mathematical reasoning and proof techniques",
                "Problem-solving strategies and methods",
                "Applications of mathematical concepts",
                "Logical thinking and pattern recognition",
                "Computational skills and accuracy"
            ],
            'vocabulary': ['equation', 'formula', 'theorem', 'proof', 'variable', 'function', 'calculation', 'algorithm'],
            'questions': [
                "What mathematical concepts are being explored?",
                "How can you solve problems using these methods?",
                "What patterns or relationships do you notice?",
                "How are these concepts used in practical situations?"
            ]
        }
    }
    
    # Get subject-specific content or use general template
    content_template = subject_content.get(subject.lower().split()[0], {
        'summary': f"This {resource_type.lower()} titled '{title}' provides educational content in {subject} for {grade_level} students.",
        'key_points': [
            f"Fundamental concepts in {subject}",
            f"Core principles for {grade_level} understanding",
            "Critical thinking and analysis skills",
            "Practical applications and examples",
            "Study strategies and learning objectives"
        ],
        'vocabulary': ['concept', 'principle', 'analysis', 'application', 'understanding', 'knowledge', 'learning'],
        'questions': [
            f"What are the main topics in {subject}?",
            "How can you apply this knowledge?",
            "What connections can you make to other subjects?",
            "How does this relate to your current studies?"
        ]
    })
    
    # Add focus areas if provided
    if focus_areas:
        content_template['key_points'].extend([f"Focus on {area}" for area in focus_areas[:3]])
        content_template['questions'].append(f"How do the focus areas ({', '.join(focus_areas)}) enhance understanding?")
    
    # Add description content if available
    if description:
        content_template['summary'] += f" {description}"
        content_template['key_points'].append("Key information from resource description")
    
    return {
        "summary": content_template['summary'],
        "key_points": content_template['key_points'][:8],
        "detailed_content": f"Resource: {title}\nSubject: {subject}\nLevel: {grade_level}\n\n{description if description else 'This resource provides educational content for studying ' + subject + '.'}",
        "vocabulary": content_template['vocabulary'][:10],
        "questions": content_template['questions'][:5]
    }