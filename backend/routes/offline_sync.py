"""
Offline Sync Routes for Teachers Connect
Handles syncing offline actions when users come back online
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

# Import database and auth dependencies
from database import get_database
from routes.auth_routes import get_current_user
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter()

class OfflineAction(BaseModel):
    id: str
    type: str  # POST, PUT, DELETE, ADD_RESOURCE, UPDATE_RESOURCE, etc.
    data: Dict[str, Any]
    timestamp: int
    retryCount: Optional[int] = 0
    status: Optional[str] = "pending"

class SyncRequest(BaseModel):
    actions: List[OfflineAction]

class ActionResult(BaseModel):
    actionId: str
    success: bool
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class SyncResponse(BaseModel):
    success: bool
    total: int
    successful: int
    failed: int
    results: List[ActionResult]
    message: str

@router.post("/sync", response_model=SyncResponse)
async def sync_offline_actions(
    request: SyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Sync offline actions with the database
    """
    try:
        db = get_database()
        results = []
        successful = 0
        failed = 0
        
        logger.info(f"Starting sync for user {current_user['id']} with {len(request.actions)} actions")
        
        for action in request.actions:
            try:
                result = await process_action(action, current_user, db)
                results.append(result)
                
                if result.success:
                    successful += 1
                    logger.info(f"Action {action.id} processed successfully: {action.type}")
                else:
                    failed += 1
                    logger.warning(f"Action {action.id} failed: {result.error}")
                    
            except Exception as e:
                failed += 1
                error_msg = str(e)
                logger.error(f"Error processing action {action.id}: {error_msg}")
                results.append(ActionResult(
                    actionId=action.id,
                    success=False,
                    error=error_msg
                ))
        
        return SyncResponse(
            success=True,
            total=len(request.actions),
            successful=successful,
            failed=failed,
            results=results,
            message=f"Sync completed: {successful} successful, {failed} failed"
        )
        
    except Exception as e:
        logger.error(f"Sync process failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Sync process failed: {str(e)}"
        )

async def process_action(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """
    Process individual offline action based on its type
    """
    try:
        action_type = action.type.upper()
        action_data = action.data
        
        # Handle different HTTP methods
        if action_type == "POST":
            return await handle_post_action(action, current_user, db)
        elif action_type == "PUT":
            return await handle_put_action(action, current_user, db)
        elif action_type == "DELETE":
            return await handle_delete_action(action, current_user, db)
        
        # Handle specific resource actions
        elif action_type == "ADD_RESOURCE":
            return await handle_add_resource(action, current_user, db)
        elif action_type == "UPDATE_RESOURCE":
            return await handle_update_resource(action, current_user, db)
        elif action_type == "DELETE_RESOURCE":
            return await handle_delete_resource(action, current_user, db)
        elif action_type == "RATE_RESOURCE":
            return await handle_rate_resource(action, current_user, db)
        elif action_type == "LIKE_RESOURCE":
            return await handle_like_resource(action, current_user, db)
        
        # Handle community actions
        elif action_type == "ADD_COMMENT":
            return await handle_add_comment(action, current_user, db)
        elif action_type == "UPDATE_COMMENT":
            return await handle_update_comment(action, current_user, db)
        elif action_type == "DELETE_COMMENT":
            return await handle_delete_comment(action, current_user, db)
        
        # Handle lesson actions
        elif action_type == "CREATE_LESSON":
            return await handle_create_lesson(action, current_user, db)
        elif action_type == "UPDATE_LESSON":
            return await handle_update_lesson(action, current_user, db)
        elif action_type == "DELETE_LESSON":
            return await handle_delete_lesson(action, current_user, db)
        
        else:
            return ActionResult(
                actionId=action.id,
                success=False,
                error=f"Unknown action type: {action_type}"
            )
            
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=str(e)
        )

# HTTP Method Handlers
async def handle_post_action(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Handle generic POST requests"""
    data = action.data
    url = data.get("url", "")
    payload = data.get("data", {})
    
    # Route to specific handlers based on URL
    if "/api/resources" in url:
        return await handle_add_resource_from_url(action, current_user, db, payload)
    elif "/api/community" in url:
        return await handle_add_comment_from_url(action, current_user, db, payload)
    elif "/api/lessons" in url:
        return await handle_create_lesson_from_url(action, current_user, db, payload)
    else:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Unsupported POST URL: {url}"
        )

async def handle_put_action(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Handle generic PUT requests"""
    data = action.data
    url = data.get("url", "")
    payload = data.get("data", {})
    
    # Extract resource ID from URL
    if "/api/resources/" in url:
        resource_id = url.split("/api/resources/")[-1].split("/")[0]
        return await handle_update_resource_from_url(action, current_user, db, resource_id, payload)
    elif "/api/lessons/" in url:
        lesson_id = url.split("/api/lessons/")[-1].split("/")[0]
        return await handle_update_lesson_from_url(action, current_user, db, lesson_id, payload)
    else:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Unsupported PUT URL: {url}"
        )

async def handle_delete_action(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Handle generic DELETE requests"""
    data = action.data
    url = data.get("url", "")
    
    # Extract resource ID from URL
    if "/api/resources/" in url:
        resource_id = url.split("/api/resources/")[-1].split("/")[0]
        return await handle_delete_resource_from_url(action, current_user, db, resource_id)
    elif "/api/lessons/" in url:
        lesson_id = url.split("/api/lessons/")[-1].split("/")[0]
        return await handle_delete_lesson_from_url(action, current_user, db, lesson_id)
    else:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Unsupported DELETE URL: {url}"
        )

# Resource Action Handlers
async def handle_add_resource(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Add a new resource"""
    try:
        resource_data = action.data.copy()
        resource_data["author_id"] = current_user["id"]
        resource_data["author_name"] = current_user.get("full_name", current_user.get("username", "Unknown"))
        resource_data["created_at"] = datetime.utcnow()
        resource_data["updated_at"] = datetime.utcnow()
        
        # Set default values
        resource_data.setdefault("likes_count", 0)
        resource_data.setdefault("ratings_count", 0)
        resource_data.setdefault("average_rating", 0.0)
        resource_data.setdefault("download_count", 0)
        resource_data.setdefault("view_count", 0)
        
        result = db.resources.insert_one(resource_data)
        
        return ActionResult(
            actionId=action.id,
            success=True,
            data={"resource_id": str(result.inserted_id)}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to add resource: {str(e)}"
        )

async def handle_add_resource_from_url(action: OfflineAction, current_user: dict, db, payload: dict) -> ActionResult:
    """Add resource from URL-based action"""
    # Convert URL-based action to resource action
    new_action = OfflineAction(
        id=action.id,
        type="ADD_RESOURCE",
        data=payload,
        timestamp=action.timestamp
    )
    return await handle_add_resource(new_action, current_user, db)

async def handle_update_resource(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Update an existing resource"""
    try:
        update_data = action.data.copy()
        resource_id = update_data.pop("resource_id", None)
        
        if not resource_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No resource_id provided"
            )
        
        # Verify ownership
        resource = db.resources.find_one({
            "_id": ObjectId(resource_id),
            "author_id": current_user["id"]
        })
        
        if not resource:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Resource not found or access denied"
            )
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": update_data}
        )
        
        return ActionResult(
            actionId=action.id,
            success=result.modified_count > 0,
            data={"resource_id": resource_id, "modified": result.modified_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to update resource: {str(e)}"
        )

async def handle_update_resource_from_url(action: OfflineAction, current_user: dict, db, resource_id: str, payload: dict) -> ActionResult:
    """Update resource from URL-based action"""
    payload["resource_id"] = resource_id
    new_action = OfflineAction(
        id=action.id,
        type="UPDATE_RESOURCE",
        data=payload,
        timestamp=action.timestamp
    )
    return await handle_update_resource(new_action, current_user, db)

async def handle_delete_resource(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Delete a resource"""
    try:
        resource_id = action.data.get("resource_id")
        
        if not resource_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No resource_id provided"
            )
        
        # Verify ownership
        resource = db.resources.find_one({
            "_id": ObjectId(resource_id),
            "author_id": current_user["id"]
        })
        
        if not resource:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Resource not found or access denied"
            )
        
        result = db.resources.delete_one({"_id": ObjectId(resource_id)})
        
        return ActionResult(
            actionId=action.id,
            success=result.deleted_count > 0,
            data={"resource_id": resource_id, "deleted": result.deleted_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to delete resource: {str(e)}"
        )

async def handle_delete_resource_from_url(action: OfflineAction, current_user: dict, db, resource_id: str) -> ActionResult:
    """Delete resource from URL-based action"""
    new_action = OfflineAction(
        id=action.id,
        type="DELETE_RESOURCE",
        data={"resource_id": resource_id},
        timestamp=action.timestamp
    )
    return await handle_delete_resource(new_action, current_user, db)

async def handle_rate_resource(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Rate a resource"""
    try:
        resource_id = action.data.get("resource_id")
        rating = action.data.get("rating")
        comment = action.data.get("comment", "")
        
        # Check if rating already exists
        existing_rating = db.resource_ratings.find_one({
            "resource_id": resource_id,
            "user_id": current_user["id"]
        })
        
        rating_data = {
            "resource_id": resource_id,
            "user_id": current_user["id"],
            "user_name": current_user.get("full_name", current_user.get("username", "Unknown")),
            "rating": rating,
            "comment": comment,
            "created_at": datetime.utcnow()
        }
        
        if existing_rating:
            # Update existing rating
            rating_data["updated_at"] = datetime.utcnow()
            result = db.resource_ratings.update_one(
                {"_id": existing_rating["_id"]},
                {"$set": rating_data}
            )
        else:
            # Create new rating
            result = db.resource_ratings.insert_one(rating_data)
        
        # Update resource statistics
        ratings = list(db.resource_ratings.find({"resource_id": resource_id}))
        average_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0
        
        db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {
                "$set": {
                    "ratings_count": len(ratings),
                    "average_rating": round(average_rating, 2)
                }
            }
        )
        
        return ActionResult(
            actionId=action.id,
            success=True,
            data={"resource_id": resource_id, "rating": rating}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to rate resource: {str(e)}"
        )

async def handle_like_resource(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Like/unlike a resource"""
    try:
        resource_id = action.data.get("resource_id")
        
        # Check if like already exists
        existing_like = db.resource_likes.find_one({
            "resource_id": resource_id,
            "user_id": current_user["id"]
        })
        
        if existing_like:
            # Unlike - remove the like
            db.resource_likes.delete_one({"_id": existing_like["_id"]})
            liked = False
        else:
            # Like - add the like
            like_data = {
                "resource_id": resource_id,
                "user_id": current_user["id"],
                "created_at": datetime.utcnow()
            }
            db.resource_likes.insert_one(like_data)
            liked = True
        
        # Update resource like count
        likes_count = db.resource_likes.count_documents({"resource_id": resource_id})
        db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"likes_count": likes_count}}
        )
        
        return ActionResult(
            actionId=action.id,
            success=True,
            data={"resource_id": resource_id, "liked": liked, "likes_count": likes_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to like/unlike resource: {str(e)}"
        )

# Community Action Handlers
async def handle_add_comment(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Add a community comment"""
    try:
        comment_data = action.data.copy()
        comment_data["author_id"] = current_user["id"]
        comment_data["author_name"] = current_user.get("full_name", current_user.get("username", "Unknown"))
        comment_data["created_at"] = datetime.utcnow()
        comment_data["updated_at"] = datetime.utcnow()
        
        result = db.community_posts.insert_one(comment_data)
        
        return ActionResult(
            actionId=action.id,
            success=True,
            data={"comment_id": str(result.inserted_id)}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to add comment: {str(e)}"
        )

async def handle_add_comment_from_url(action: OfflineAction, current_user: dict, db, payload: dict) -> ActionResult:
    """Add comment from URL-based action"""
    new_action = OfflineAction(
        id=action.id,
        type="ADD_COMMENT",
        data=payload,
        timestamp=action.timestamp
    )
    return await handle_add_comment(new_action, current_user, db)

async def handle_update_comment(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Update a community comment"""
    try:
        update_data = action.data.copy()
        comment_id = update_data.pop("comment_id", None)
        
        if not comment_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No comment_id provided"
            )
        
        # Verify ownership
        comment = db.community_posts.find_one({
            "_id": ObjectId(comment_id),
            "author_id": current_user["id"]
        })
        
        if not comment:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Comment not found or access denied"
            )
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = db.community_posts.update_one(
            {"_id": ObjectId(comment_id)},
            {"$set": update_data}
        )
        
        return ActionResult(
            actionId=action.id,
            success=result.modified_count > 0,
            data={"comment_id": comment_id, "modified": result.modified_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to update comment: {str(e)}"
        )

async def handle_delete_comment(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Delete a community comment"""
    try:
        comment_id = action.data.get("comment_id")
        
        if not comment_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No comment_id provided"
            )
        
        # Verify ownership
        comment = db.community_posts.find_one({
            "_id": ObjectId(comment_id),
            "author_id": current_user["id"]
        })
        
        if not comment:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Comment not found or access denied"
            )
        
        result = db.community_posts.delete_one({"_id": ObjectId(comment_id)})
        
        return ActionResult(
            actionId=action.id,
            success=result.deleted_count > 0,
            data={"comment_id": comment_id, "deleted": result.deleted_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to delete comment: {str(e)}"
        )

# Lesson Action Handlers
async def handle_create_lesson(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Create a new AI lesson"""
    try:
        lesson_data = action.data.copy()
        lesson_data["user_id"] = current_user["id"]
        lesson_data["user_name"] = current_user.get("full_name", current_user.get("username", "Unknown"))
        lesson_data["created_at"] = datetime.utcnow()
        lesson_data["updated_at"] = datetime.utcnow()
        
        result = db.ai_lessons.insert_one(lesson_data)
        
        return ActionResult(
            actionId=action.id,
            success=True,
            data={"lesson_id": str(result.inserted_id)}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to create lesson: {str(e)}"
        )

async def handle_create_lesson_from_url(action: OfflineAction, current_user: dict, db, payload: dict) -> ActionResult:
    """Create lesson from URL-based action"""
    new_action = OfflineAction(
        id=action.id,
        type="CREATE_LESSON",
        data=payload,
        timestamp=action.timestamp
    )
    return await handle_create_lesson(new_action, current_user, db)

async def handle_update_lesson(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Update an existing lesson"""
    try:
        update_data = action.data.copy()
        lesson_id = update_data.pop("lesson_id", None)
        
        if not lesson_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No lesson_id provided"
            )
        
        # Verify ownership
        lesson = db.ai_lessons.find_one({
            "_id": ObjectId(lesson_id),
            "user_id": current_user["id"]
        })
        
        if not lesson:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Lesson not found or access denied"
            )
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = db.ai_lessons.update_one(
            {"_id": ObjectId(lesson_id)},
            {"$set": update_data}
        )
        
        return ActionResult(
            actionId=action.id,
            success=result.modified_count > 0,
            data={"lesson_id": lesson_id, "modified": result.modified_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to update lesson: {str(e)}"
        )

async def handle_update_lesson_from_url(action: OfflineAction, current_user: dict, db, lesson_id: str, payload: dict) -> ActionResult:
    """Update lesson from URL-based action"""
    payload["lesson_id"] = lesson_id
    new_action = OfflineAction(
        id=action.id,
        type="UPDATE_LESSON",
        data=payload,
        timestamp=action.timestamp
    )
    return await handle_update_lesson(new_action, current_user, db)

async def handle_delete_lesson(action: OfflineAction, current_user: dict, db) -> ActionResult:
    """Delete a lesson"""
    try:
        lesson_id = action.data.get("lesson_id")
        
        if not lesson_id:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="No lesson_id provided"
            )
        
        # Verify ownership
        lesson = db.ai_lessons.find_one({
            "_id": ObjectId(lesson_id),
            "user_id": current_user["id"]
        })
        
        if not lesson:
            return ActionResult(
                actionId=action.id,
                success=False,
                error="Lesson not found or access denied"
            )
        
        result = db.ai_lessons.delete_one({"_id": ObjectId(lesson_id)})
        
        return ActionResult(
            actionId=action.id,
            success=result.deleted_count > 0,
            data={"lesson_id": lesson_id, "deleted": result.deleted_count}
        )
        
    except Exception as e:
        return ActionResult(
            actionId=action.id,
            success=False,
            error=f"Failed to delete lesson: {str(e)}"
        )

async def handle_delete_lesson_from_url(action: OfflineAction, current_user: dict, db, lesson_id: str) -> ActionResult:
    """Delete lesson from URL-based action"""
    new_action = OfflineAction(
        id=action.id,
        type="DELETE_LESSON",
        data={"lesson_id": lesson_id},
        timestamp=action.timestamp
    )
    return await handle_delete_lesson(new_action, current_user, db)

# Health check endpoint
@router.get("/sync/health")
async def sync_health_check():
    """Health check for sync service"""
    return {
        "status": "healthy",
        "service": "offline_sync",
        "message": "Offline sync service is operational"
    }