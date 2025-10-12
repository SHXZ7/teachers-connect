from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.community_model import (
    Post, PostCreate, PostUpdate, Comment, CommentCreate, 
    ReactionCreate, CommunityStats, AIDiscussionSummary,
    Notification, NotificationCreate, MediaAttachment
)
from models.user_model import UserProfile
from database import (
    community_posts_collection, community_comments_collection, 
    community_reactions_collection, community_notifications_collection,
    users_collection, test_connection
)
from websocket_manager import manager
from bson import ObjectId
from jose import jwt, JWTError
from dotenv import load_dotenv
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json
import shutil
from pathlib import Path

load_dotenv()
router = APIRouter()
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

# Create uploads directory for community content
UPLOAD_DIR = Path("uploads/community")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ============= WEBSOCKET ROUTES =============

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time community updates"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "typing":
                await manager.send_typing_indicator(
                    message_data.get("post_id"),
                    message_data.get("user_name"),
                    message_data.get("is_typing", False)
                )
            elif message_data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Get user details from database
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "id": str(user["_id"]),
            "name": user.get("name", "Unknown User"),
            "email": user.get("email", ""),
            "school": user.get("school", ""),
            "subject": user.get("subject", "")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# ============= POST ROUTES =============

@router.get("/posts", response_model=List[dict])
async def get_posts(
    skip: int = 0,
    limit: int = 20,
    post_type: Optional[str] = None,
    subject_area: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated list of community posts"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Build query filter
        query_filter = {}
        if post_type:
            query_filter["post_type"] = post_type
        if subject_area:
            query_filter["subject_area"] = subject_area
        if search:
            query_filter["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}}
            ]
        
        # Get posts with aggregation pipeline for counts and user info
        pipeline = [
            {"$match": query_filter},
            {"$sort": {"is_pinned": -1, "created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$addFields": {
                    "reaction_count": {"$size": {"$ifNull": ["$reactions", []]}},
                    "comment_count": {"$size": {"$ifNull": ["$comments", []]}},
                    "id": {"$toString": "$_id"}
                }
            },
            {"$project": {"_id": 0}}
        ]
        
        posts = list(community_posts_collection.aggregate(pipeline))
        
        return posts
        
    except Exception as e:
        print(f"Error getting posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve posts"
        )

@router.post("/posts", response_model=dict)
async def create_post(
    post_data: PostCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new community post"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Create post document
        post_dict = {
            "author_id": current_user["id"],
            "author_name": current_user["name"],
            "author_school": current_user.get("school", ""),
            "title": post_data.title,
            "content": post_data.content,
            "post_type": post_data.post_type.value,
            "tags": post_data.tags or [],
            "subject_area": post_data.subject_area,
            "grade_level": post_data.grade_level,
            "attachments": [att.dict() for att in (post_data.attachments or [])],
            "reactions": [],
            "comments": [],
            "view_count": 0,
            "is_pinned": False,
            "is_featured": False,
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "is_edited": False
        }
        
        result = community_posts_collection.insert_one(post_dict)
        post_dict["id"] = str(result.inserted_id)
        post_dict.pop("_id", None)
        
        # Broadcast new post to all community members
        await manager.broadcast_post_update("new_post", post_dict)
        
        # Create notification for followers (if any)
        # This would be implemented with a follower system
        
        return {
            "success": True,
            "message": "Post created successfully",
            "post": post_dict
        }
        
    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create post"
        )

@router.get("/posts/{post_id}")
async def get_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific post with comments and reactions"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get post with aggregation for counts
        pipeline = [
            {"$match": {"_id": ObjectId(post_id)}},
            {
                "$addFields": {
                    "reaction_count": {"$size": {"$ifNull": ["$reactions", []]}},
                    "comment_count": {"$size": {"$ifNull": ["$comments", []]}},
                    "id": {"$toString": "$_id"}
                }
            },
            {"$project": {"_id": 0}}
        ]
        
        posts = list(community_posts_collection.aggregate(pipeline))
        if not posts:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post = posts[0]
        
        # Increment view count
        community_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"view_count": 1}}
        )
        
        return {
            "success": True,
            "post": post
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve post"
        )

@router.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a post (only by author)"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if post exists and user is author
        post = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post["author_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow(), "is_edited": True}
        
        if post_update.title is not None:
            update_data["title"] = post_update.title
        if post_update.content is not None:
            update_data["content"] = post_update.content
        if post_update.tags is not None:
            update_data["tags"] = post_update.tags
        if post_update.subject_area is not None:
            update_data["subject_area"] = post_update.subject_area
        if post_update.grade_level is not None:
            update_data["grade_level"] = post_update.grade_level
        
        result = community_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Post updated successfully",
            "modified_count": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update post"
        )

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a post (only by author)"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if post exists and user is author
        post = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post["author_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
        # Delete the post
        result = community_posts_collection.delete_one({"_id": ObjectId(post_id)})
        
        return {
            "success": True,
            "message": "Post deleted successfully",
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete post"
        )

# ============= REACTION ROUTES =============

@router.post("/posts/{post_id}/reactions")
async def toggle_reaction(
    post_id: str,
    reaction_data: ReactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add or remove a reaction to a post"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if post exists
        post = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user already reacted
        existing_reaction = None
        for reaction in post.get("reactions", []):
            if reaction["user_id"] == current_user["id"]:
                existing_reaction = reaction
                break
        
        if existing_reaction:
            # Remove existing reaction or update if different type
            if existing_reaction["reaction_type"] == reaction_data.reaction_type.value:
                # Remove reaction
                community_posts_collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$pull": {"reactions": {"user_id": current_user["id"]}}}
                )
                action = "removed"
            else:
                # Update reaction type
                community_posts_collection.update_one(
                    {"_id": ObjectId(post_id), "reactions.user_id": current_user["id"]},
                    {"$set": {"reactions.$.reaction_type": reaction_data.reaction_type.value}}
                )
                action = "updated"
        else:
            # Add new reaction
            new_reaction = {
                "user_id": current_user["id"],
                "user_name": current_user["name"],
                "reaction_type": reaction_data.reaction_type.value,
                "created_at": datetime.utcnow()
            }
            
            community_posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$push": {"reactions": new_reaction}}
            )
            action = "added"
        
        # Get updated reaction counts
        updated_post = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        reaction_counts = {}
        for reaction in updated_post.get("reactions", []):
            reaction_type = reaction["reaction_type"]
            reaction_counts[reaction_type] = reaction_counts.get(reaction_type, 0) + 1
        
        # Broadcast reaction update to all community members
        await manager.broadcast_reaction_update(post_id, {
            "action": action,
            "reaction_type": reaction_data.reaction_type.value,
            "user_name": current_user["name"],
            "reaction_counts": reaction_counts
        })
        
        return {
            "success": True,
            "message": f"Reaction {action}",
            "action": action,
            "reaction_counts": reaction_counts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling reaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle reaction"
        )

# ============= COMMENT ROUTES =============

@router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a post"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if post exists
        post = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Create comment
        new_comment = {
            "id": str(ObjectId()),
            "author_id": current_user["id"],
            "author_name": current_user["name"],
            "content": comment_data.content,
            "attachments": [att.dict() for att in (comment_data.attachments or [])],
            "reactions": [],
            "replies": [],
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "is_edited": False
        }
        
        # Add comment to post
        community_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": new_comment}}
        )
        
        # Broadcast new comment to all community members
        await manager.broadcast_comment_update("new_comment", post_id, new_comment)
        
        # Create notification for post author
        if post["author_id"] != current_user["id"]:
            notification = {
                "user_id": post["author_id"],
                "type": "new_comment",
                "title": "New Comment",
                "message": f"{current_user['name']} commented on your post",
                "related_post_id": post_id,
                "related_comment_id": new_comment["id"],
                "is_read": False,
                "created_at": datetime.utcnow()
            }
            community_notifications_collection.insert_one(notification)
            
            # Send real-time notification
            await manager.send_notification(
                post["author_id"],
                "new_comment",
                "New Comment",
                f"{current_user['name']} commented on your post",
                {"post_id": post_id, "comment_id": new_comment["id"]}
            )
        
        return {
            "success": True,
            "message": "Comment added successfully",
            "comment": new_comment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add comment"
        )

# ============= STATS AND UTILITY ROUTES =============

@router.get("/stats")
async def get_community_stats(current_user: dict = Depends(get_current_user)):
    """Get community statistics"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Calculate stats
        total_posts = community_posts_collection.count_documents({})
        
        # Count total comments across all posts
        pipeline = [
            {"$project": {"comment_count": {"$size": {"$ifNull": ["$comments", []]}}}},
            {"$group": {"_id": None, "total": {"$sum": "$comment_count"}}}
        ]
        total_comments_result = list(community_posts_collection.aggregate(pipeline))
        total_comments = total_comments_result[0]["total"] if total_comments_result else 0
        
        # Count total reactions across all posts
        pipeline = [
            {"$project": {"reaction_count": {"$size": {"$ifNull": ["$reactions", []]}}}},
            {"$group": {"_id": None, "total": {"$sum": "$reaction_count"}}}
        ]
        total_reactions_result = list(community_posts_collection.aggregate(pipeline))
        total_reactions = total_reactions_result[0]["total"] if total_reactions_result else 0
        
        # Count unique users who posted
        total_users = len(community_posts_collection.distinct("author_id"))
        
        # Recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_activity = community_posts_collection.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        # Popular tags
        pipeline = [
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        popular_tags = list(community_posts_collection.aggregate(pipeline))
        
        # Active discussions (posts with most recent comments)
        pipeline = [
            {"$match": {"comments": {"$ne": []}}},
            {"$addFields": {
                "latest_comment": {"$max": "$comments.created_at"},
                "comment_count": {"$size": "$comments"}
            }},
            {"$sort": {"latest_comment": -1}},
            {"$limit": 5},
            {"$project": {
                "title": 1,
                "comment_count": 1,
                "latest_comment": 1,
                "id": {"$toString": "$_id"}
            }}
        ]
        active_discussions = list(community_posts_collection.aggregate(pipeline))
        
        return {
            "success": True,
            "stats": {
                "total_posts": total_posts,
                "total_comments": total_comments,
                "total_reactions": total_reactions,
                "total_users": total_users,
                "recent_activity": recent_activity,
                "popular_tags": popular_tags,
                "active_discussions": active_discussions
            }
        }
        
    except Exception as e:
        print(f"Error getting community stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve community stats"
        )

# ============= FILE UPLOAD ROUTE =============

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a file for community posts/comments"""
    try:
        # Validate file type and size
        allowed_types = {
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf", "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="File type not allowed"
            )
        
        # 10MB limit
        max_size = 10 * 1024 * 1024
        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size too large (max 10MB)"
            )
        
        # Create unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user['id']}_{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create media attachment object
        attachment = {
            "type": "image" if file.content_type.startswith("image/") else "document",
            "filename": file.filename,
            "url": f"/uploads/community/{filename}",
            "size": file.size,
            "mime_type": file.content_type
        }
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "attachment": attachment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )