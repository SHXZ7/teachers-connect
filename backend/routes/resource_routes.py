from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query, Header
from fastapi.responses import FileResponse
from models.resource_model import (
    ResourceCreate, ResourceUpdate, ResourceResponse, ResourceList, 
    ResourceRating, ResourceRatingResponse, ResourceLike, ResourceStats,
    FileUploadResponse, ResourceType, SubjectArea, GradeLevel
)
from database import resources_collection, ratings_collection, likes_collection, users_collection, test_connection
from bson import ObjectId
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List
import mimetypes
from pathlib import Path
import json

load_dotenv()
router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

# File storage settings
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg"
}

# Ensure upload directory exists with better error handling
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"✅ Upload directory ready: {UPLOAD_DIR}")
except PermissionError:
    print(f"⚠️ Warning: Cannot create upload directory {UPLOAD_DIR}. Using temp directory.")
    import tempfile
    UPLOAD_DIR = tempfile.mkdtemp(prefix="teachers_connect_")
    print(f"📁 Using temporary upload directory: {UPLOAD_DIR}")
except Exception as e:
    print(f"❌ Error setting up upload directory: {e}")
    import tempfile
    UPLOAD_DIR = tempfile.mkdtemp(prefix="teachers_connect_")
    print(f"📁 Fallback to temporary upload directory: {UPLOAD_DIR}")

def get_current_user_from_token(token: str):
    """Extract user from JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_user_from_header(authorization: Optional[str] = Header(None)):
    """Get user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    return get_current_user_from_token(token)

@router.post("/resources/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject_area: SubjectArea = Form(...),
    grade_level: GradeLevel = Form(...),
    resource_type: ResourceType = Form(...),
    tags: str = Form("[]"),  # JSON string of tags
    is_public: bool = Form(True),
    language: str = Form("en"),
    authorization: str = Header(None)
):
    """Upload a resource file with metadata"""
    try:
        # Test database connection
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate file size
        if file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        
        # Validate MIME type
        mime_type = file.content_type
        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {mime_type} not allowed"
            )
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse tags
        try:
            tags_list = json.loads(tags) if tags else []
        except json.JSONDecodeError:
            tags_list = []
        
        # Create resource document
        resource_doc = {
            "title": title,
            "description": description,
            "subject_area": subject_area,
            "grade_level": grade_level,
            "resource_type": resource_type,
            "tags": tags_list,
            "is_public": is_public,
            "language": language,
            "author_id": user_id,
            "author_name": user["name"],
            "file_url": f"/api/resources/files/{unique_filename}",
            "file_name": file.filename,
            "file_size": file.size,
            "mime_type": mime_type,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "likes_count": 0,
            "ratings_count": 0,
            "average_rating": 0.0,
            "download_count": 0,
            "view_count": 0
        }
        
        # Insert resource
        result = resources_collection.insert_one(resource_doc)
        
        return FileUploadResponse(
            filename=unique_filename,
            file_url=f"/api/resources/files/{unique_filename}",
            file_size=file.size,
            mime_type=mime_type,
            upload_success=True,
            message="File uploaded successfully"
        )
        
    except Exception as e:
        # Clean up file if upload failed
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/resources/files/{filename}")
async def download_file(filename: str):
    """Download a resource file"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Update download count
    resources_collection.update_one(
        {"file_url": f"/api/resources/files/{filename}"},
        {"$inc": {"download_count": 1}}
    )
    
    mime_type, _ = mimetypes.guess_type(file_path)
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=filename
    )

@router.get("/resources", response_model=ResourceList)
async def get_resources(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    subject_area: Optional[SubjectArea] = Query(None),
    grade_level: Optional[GradeLevel] = Query(None),
    resource_type: Optional[ResourceType] = Query(None),
    search: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    sort_by: str = Query("created_at", enum=["created_at", "likes_count", "average_rating", "download_count"]),
    sort_order: str = Query("desc", enum=["asc", "desc"])
):
    """Get all resources with filtering and pagination"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Build filter query
        filter_query = {"is_public": True}
        
        if subject_area:
            filter_query["subject_area"] = subject_area
        
        if grade_level:
            filter_query["grade_level"] = grade_level
        
        if resource_type:
            filter_query["resource_type"] = resource_type
        
        if author_id:
            filter_query["author_id"] = author_id
        
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]
        
        # Calculate pagination
        skip = (page - 1) * per_page
        
        # Sort configuration
        sort_direction = 1 if sort_order == "asc" else -1
        
        # Get total count
        total = resources_collection.count_documents(filter_query)
        
        # Get resources
        cursor = resources_collection.find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(per_page)
        
        resources = []
        for resource in cursor:
            resource_response = ResourceResponse(
                id=str(resource["_id"]),
                title=resource["title"],
                description=resource.get("description"),
                subject_area=resource["subject_area"],
                grade_level=resource["grade_level"],
                resource_type=resource["resource_type"],
                tags=resource.get("tags", []),
                is_public=resource["is_public"],
                language=resource.get("language", "en"),
                author_id=resource["author_id"],
                author_name=resource["author_name"],
                file_url=resource.get("file_url"),
                file_name=resource.get("file_name"),
                file_size=resource.get("file_size"),
                mime_type=resource.get("mime_type"),
                created_at=resource["created_at"],
                updated_at=resource["updated_at"],
                likes_count=resource.get("likes_count", 0),
                ratings_count=resource.get("ratings_count", 0),
                average_rating=resource.get("average_rating", 0.0),
                download_count=resource.get("download_count", 0),
                view_count=resource.get("view_count", 0)
            )
            resources.append(resource_response)
        
        total_pages = (total + per_page - 1) // per_page
        
        return ResourceList(
            resources=resources,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch resources: {str(e)}"
        )

@router.get("/resources/stats/overview", response_model=ResourceStats)
async def get_resource_stats():
    """Get overall resource statistics"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Total resources
        total_resources = resources_collection.count_documents({"is_public": True})
        
        # Total downloads
        total_downloads = list(resources_collection.aggregate([
            {"$match": {"is_public": True}},
            {"$group": {"_id": None, "total": {"$sum": "$download_count"}}}
        ]))
        total_downloads = total_downloads[0]["total"] if total_downloads else 0
        
        # Total likes
        total_likes = likes_collection.count_documents({})
        
        # Total ratings
        total_ratings = ratings_collection.count_documents({})
        
        # Popular subjects
        popular_subjects = list(resources_collection.aggregate([
            {"$match": {"is_public": True}},
            {"$group": {"_id": "$subject_area", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        # Popular grades
        popular_grades = list(resources_collection.aggregate([
            {"$match": {"is_public": True}},
            {"$group": {"_id": "$grade_level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        # Recent uploads (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = resources_collection.count_documents({
            "is_public": True,
            "created_at": {"$gte": week_ago}
        })
        
        return ResourceStats(
            total_resources=total_resources,
            total_downloads=total_downloads,
            total_likes=total_likes,
            total_ratings=total_ratings,
            popular_subjects=[{"subject": item["_id"], "count": item["count"]} for item in popular_subjects],
            popular_grades=[{"grade": item["_id"], "count": item["count"]} for item in popular_grades],
            recent_uploads=recent_uploads
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )

@router.get("/resources/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: str):
    """Get a specific resource by ID"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Update view count
        resources_collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$inc": {"view_count": 1}}
        )
        
        return ResourceResponse(
            id=str(resource["_id"]),
            title=resource["title"],
            description=resource.get("description"),
            subject_area=resource["subject_area"],
            grade_level=resource["grade_level"],
            resource_type=resource["resource_type"],
            tags=resource.get("tags", []),
            is_public=resource["is_public"],
            language=resource.get("language", "en"),
            author_id=resource["author_id"],
            author_name=resource["author_name"],
            file_url=resource.get("file_url"),
            file_name=resource.get("file_name"),
            file_size=resource.get("file_size"),
            mime_type=resource.get("mime_type"),
            created_at=resource["created_at"],
            updated_at=resource["updated_at"],
            likes_count=resource.get("likes_count", 0),
            ratings_count=resource.get("ratings_count", 0),
            average_rating=resource.get("average_rating", 0.0),
            download_count=resource.get("download_count", 0),
            view_count=resource.get("view_count", 0)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch resource: {str(e)}"
        )

@router.put("/resources/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: str,
    resource_update: ResourceUpdate,
    authorization: str = Header(None)
):
    """Update a resource (only by the author)"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        # Check if resource exists and user is the author
        resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        if resource["author_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own resources"
            )
        
        # Build update document
        update_doc = {"updated_at": datetime.utcnow()}
        update_data = resource_update.dict(exclude_unset=True)
        update_doc.update(update_data)
        
        # Update resource
        resources_collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": update_doc}
        )
        
        # Get updated resource
        updated_resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        
        return ResourceResponse(
            id=str(updated_resource["_id"]),
            title=updated_resource["title"],
            description=updated_resource.get("description"),
            subject_area=updated_resource["subject_area"],
            grade_level=updated_resource["grade_level"],
            resource_type=updated_resource["resource_type"],
            tags=updated_resource.get("tags", []),
            is_public=updated_resource["is_public"],
            language=updated_resource.get("language", "en"),
            author_id=updated_resource["author_id"],
            author_name=updated_resource["author_name"],
            file_url=updated_resource.get("file_url"),
            file_name=updated_resource.get("file_name"),
            file_size=updated_resource.get("file_size"),
            mime_type=updated_resource.get("mime_type"),
            created_at=updated_resource["created_at"],
            updated_at=updated_resource["updated_at"],
            likes_count=updated_resource.get("likes_count", 0),
            ratings_count=updated_resource.get("ratings_count", 0),
            average_rating=updated_resource.get("average_rating", 0.0),
            download_count=updated_resource.get("download_count", 0),
            view_count=updated_resource.get("view_count", 0)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update resource: {str(e)}"
        )

@router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, authorization: str = Header(None)):
    """Delete a resource (only by the author)"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        # Check if resource exists and user is the author
        resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        if resource["author_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own resources"
            )
        
        # Delete associated file
        if resource.get("file_url"):
            filename = resource["file_url"].split("/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Delete resource from database
        resources_collection.delete_one({"_id": ObjectId(resource_id)})
        
        # Delete associated ratings and likes
        ratings_collection.delete_many({"resource_id": resource_id})
        likes_collection.delete_many({"resource_id": resource_id})
        
        return {"message": "Resource deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete resource: {str(e)}"
        )

@router.post("/resources/{resource_id}/rate", response_model=ResourceRatingResponse)
async def rate_resource(
    resource_id: str,
    rating_data: ResourceRating,
    authorization: str = Header(None)
):
    """Rate a resource"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        # Check if resource exists
        resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Check if user already rated this resource
        existing_rating = ratings_collection.find_one({
            "resource_id": resource_id,
            "user_id": user_id
        })
        
        rating_doc = {
            "resource_id": resource_id,
            "user_id": user_id,
            "user_name": user["name"],
            "rating": rating_data.rating,
            "comment": rating_data.comment,
            "created_at": datetime.utcnow()
        }
        
        if existing_rating:
            # Update existing rating
            ratings_collection.update_one(
                {"_id": existing_rating["_id"]},
                {"$set": rating_doc}
            )
            rating_id = str(existing_rating["_id"])
        else:
            # Create new rating
            result = ratings_collection.insert_one(rating_doc)
            rating_id = str(result.inserted_id)
        
        # Recalculate average rating
        ratings = list(ratings_collection.find({"resource_id": resource_id}))
        total_ratings = len(ratings)
        average_rating = sum(r["rating"] for r in ratings) / total_ratings if total_ratings > 0 else 0.0
        
        # Update resource statistics
        resources_collection.update_one(
            {"_id": ObjectId(resource_id)},
            {
                "$set": {
                    "ratings_count": total_ratings,
                    "average_rating": round(average_rating, 2)
                }
            }
        )
        
        return ResourceRatingResponse(
            id=rating_id,
            resource_id=resource_id,
            user_id=user_id,
            user_name=user["name"],
            rating=rating_data.rating,
            comment=rating_data.comment,
            created_at=rating_doc["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rate resource: {str(e)}"
        )

@router.get("/resources/{resource_id}/ratings", response_model=List[ResourceRatingResponse])
async def get_resource_ratings(resource_id: str):
    """Get all ratings for a resource"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        ratings = list(ratings_collection.find({"resource_id": resource_id}).sort("created_at", -1))
        
        return [
            ResourceRatingResponse(
                id=str(rating["_id"]),
                resource_id=rating["resource_id"],
                user_id=rating["user_id"],
                user_name=rating["user_name"],
                rating=rating["rating"],
                comment=rating.get("comment"),
                created_at=rating["created_at"]
            ) for rating in ratings
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch ratings: {str(e)}"
        )

@router.post("/resources/{resource_id}/like")
async def like_resource(resource_id: str, authorization: str = Header(None)):
    """Like or unlike a resource"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        # Check if resource exists
        resource = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Check if user already liked this resource
        existing_like = likes_collection.find_one({
            "resource_id": resource_id,
            "user_id": user_id
        })
        
        if existing_like:
            # Unlike - remove the like
            likes_collection.delete_one({"_id": existing_like["_id"]})
            action = "unliked"
        else:
            # Like - add the like
            like_doc = {
                "resource_id": resource_id,
                "user_id": user_id,
                "created_at": datetime.utcnow()
            }
            likes_collection.insert_one(like_doc)
            action = "liked"
        
        # Update likes count
        likes_count = likes_collection.count_documents({"resource_id": resource_id})
        resources_collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"likes_count": likes_count}}
        )
        
        return {
            "message": f"Resource {action} successfully",
            "action": action,
            "likes_count": likes_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like resource: {str(e)}"
        )

@router.get("/resources/{resource_id}/like-status")
async def get_like_status(resource_id: str, authorization: str = Header(None)):
    """Check if current user has liked a resource"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        
        # Validate ObjectId
        if not ObjectId.is_valid(resource_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )
        
        # Check if user liked this resource
        is_liked = likes_collection.find_one({
            "resource_id": resource_id,
            "user_id": user_id
        }) is not None
        
        # Get total likes count
        likes_count = likes_collection.count_documents({"resource_id": resource_id})
        
        return {
            "is_liked": is_liked,
            "likes_count": likes_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get like status: {str(e)}"
        )

@router.get("/my-resources", response_model=ResourceList)
async def get_my_resources(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    authorization: str = Header(None)
):
    """Get current user's resources"""
    try:
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable"
            )
        
        # Get current user
        user_id = get_user_from_header(authorization)
        
        # Calculate pagination
        skip = (page - 1) * per_page
        
        # Get total count
        total = resources_collection.count_documents({"author_id": user_id})
        
        # Get resources
        cursor = resources_collection.find({"author_id": user_id}).sort("created_at", -1).skip(skip).limit(per_page)
        
        resources = []
        for resource in cursor:
            resource_response = ResourceResponse(
                id=str(resource["_id"]),
                title=resource["title"],
                description=resource.get("description"),
                subject_area=resource["subject_area"],
                grade_level=resource["grade_level"],
                resource_type=resource["resource_type"],
                tags=resource.get("tags", []),
                is_public=resource["is_public"],
                language=resource.get("language", "en"),
                author_id=resource["author_id"],
                author_name=resource["author_name"],
                file_url=resource.get("file_url"),
                file_name=resource.get("file_name"),
                file_size=resource.get("file_size"),
                mime_type=resource.get("mime_type"),
                created_at=resource["created_at"],
                updated_at=resource["updated_at"],
                likes_count=resource.get("likes_count", 0),
                ratings_count=resource.get("ratings_count", 0),
                average_rating=resource.get("average_rating", 0.0),
                download_count=resource.get("download_count", 0),
                view_count=resource.get("view_count", 0)
            )
            resources.append(resource_response)
        
        total_pages = (total + per_page - 1) // per_page
        
        return ResourceList(
            resources=resources,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user resources: {str(e)}"
        )