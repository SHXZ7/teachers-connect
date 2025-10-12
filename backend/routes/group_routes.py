from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.group_model import (
    Group, GroupCreate, GroupUpdate, GroupMember, MemberRole, GroupSettings,
    Assignment, AssignmentCreate, AssignmentSubmission,
    GroupMessage, GroupMessageCreate, GroupStats, GroupMessageType
)
from database import (
    groups_collection, group_messages_collection, assignments_collection,
    assignment_submissions_collection, users_collection, test_connection
)
from websocket_manager import manager
from bson import ObjectId
from jose import jwt, JWTError
from dotenv import load_dotenv
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json

load_dotenv()
router = APIRouter()
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

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

# ============= GROUP MANAGEMENT ROUTES =============

@router.get("/groups", response_model=List[dict])
async def get_user_groups(current_user: dict = Depends(get_current_user)):
    """Get groups where user is a member"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Find groups where user is a member
        user_groups = list(groups_collection.find({
            "members.user_id": current_user["id"]
        }))
        
        # Format response
        formatted_groups = []
        for group in user_groups:
            group["id"] = str(group["_id"])
            group.pop("_id", None)
            
            # Get user's role in this group
            user_role = "member"
            for member in group.get("members", []):
                if member["user_id"] == current_user["id"]:
                    user_role = member["role"]
                    break
            
            group["user_role"] = user_role
            formatted_groups.append(group)
        
        return formatted_groups
        
    except Exception as e:
        print(f"Error getting user groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve groups"
        )

@router.post("/groups", response_model=dict)
async def create_group(
    group_data: GroupCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new group"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Create group document
        creator_member = GroupMember(
            user_id=current_user["id"],
            user_name=current_user["name"],
            user_email=current_user["email"],
            role=MemberRole.ADMIN
        )
        
        group_dict = {
            "name": group_data.name,
            "description": group_data.description,
            "group_type": group_data.group_type.value,
            "subject_area": group_data.subject_area,
            "grade_level": group_data.grade_level,
            "created_by": current_user["id"],
            "created_by_name": current_user["name"],
            "members": [creator_member.dict()],
            "member_count": 1,
            "is_private": group_data.is_private,
            "color": group_data.color or "bg-blue-500",
            "settings": (group_data.settings or GroupSettings()).dict(),
            "created_at": datetime.utcnow(),
            "updated_at": None
        }
        
        result = groups_collection.insert_one(group_dict)
        group_dict["id"] = str(result.inserted_id)
        group_dict.pop("_id", None)
        
        # Broadcast group creation
        await manager.broadcast_to_community(json.dumps({
            "type": "group_created",
            "data": group_dict,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        return {
            "success": True,
            "message": "Group created successfully",
            "group": group_dict
        }
        
    except Exception as e:
        print(f"Error creating group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create group"
        )

@router.get("/groups/{group_id}")
async def get_group(
    group_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get group details"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is a member
        is_member = any(member["user_id"] == current_user["id"] for member in group.get("members", []))
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        group["id"] = str(group["_id"])
        group.pop("_id", None)
        
        return {
            "success": True,
            "group": group
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve group"
        )

@router.post("/groups/{group_id}/members")
async def add_group_member(
    group_id: str,
    user_email: str,
    role: MemberRole = MemberRole.MEMBER,
    current_user: dict = Depends(get_current_user)
):
    """Add member to group"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if current user has permission (admin or moderator)
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        user_role = None
        for member in group.get("members", []):
            if member["user_id"] == current_user["id"]:
                user_role = member["role"]
                break
        
        if user_role not in ["admin", "moderator"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Find user to add
        new_user = users_collection.find_one({"email": user_email})
        if not new_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_user_id = str(new_user["_id"])
        
        # Check if user is already a member
        is_already_member = any(member["user_id"] == new_user_id for member in group.get("members", []))
        if is_already_member:
            raise HTTPException(status_code=400, detail="User is already a member")
        
        # Add new member
        new_member = GroupMember(
            user_id=new_user_id,
            user_name=new_user.get("name", "Unknown User"),
            user_email=user_email,
            role=role
        )
        
        groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {
                "$push": {"members": new_member.dict()},
                "$inc": {"member_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Send notification to new member
        await manager.send_notification(
            new_user_id,
            "group_invitation",
            "Added to Group",
            f"You've been added to the group '{group['name']}'",
            {"group_id": group_id, "group_name": group["name"]}
        )
        
        return {
            "success": True,
            "message": "Member added successfully",
            "member": new_member.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding group member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add member"
        )

# ============= GROUP MESSAGES ROUTES =============

@router.get("/groups/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get group messages"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if user is a member
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        is_member = any(member["user_id"] == current_user["id"] for member in group.get("members", []))
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Get messages
        messages = list(group_messages_collection.find(
            {"group_id": group_id}
        ).sort("created_at", -1).skip(skip).limit(limit))
        
        # Format messages
        formatted_messages = []
        for message in messages:
            message["id"] = str(message["_id"])
            message.pop("_id", None)
            formatted_messages.append(message)
        
        return {
            "success": True,
            "messages": list(reversed(formatted_messages))  # Return in chronological order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting group messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )

@router.post("/groups/{group_id}/messages")
async def send_group_message(
    group_id: str,
    message_data: GroupMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send message to group"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if user is a member
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        is_member = any(member["user_id"] == current_user["id"] for member in group.get("members", []))
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Create message
        message_dict = {
            "group_id": group_id,
            "sender_id": current_user["id"],
            "sender_name": current_user["name"],
            "message_type": message_data.message_type.value,
            "content": message_data.content,
            "attachments": [att.dict() for att in message_data.attachments],
            "reply_to": message_data.reply_to,
            "reactions": [],
            "is_pinned": False,
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "is_edited": False
        }
        
        result = group_messages_collection.insert_one(message_dict)
        message_dict["id"] = str(result.inserted_id)
        message_dict.pop("_id", None)
        
        # Broadcast message to group members
        await manager.broadcast_to_community(json.dumps({
            "type": "group_message",
            "group_id": group_id,
            "data": message_dict,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Send notifications to group members
        for member in group.get("members", []):
            if member["user_id"] != current_user["id"]:
                await manager.send_notification(
                    member["user_id"],
                    "group_message",
                    f"New message in {group['name']}",
                    f"{current_user['name']}: {message_data.content[:50]}...",
                    {"group_id": group_id, "message_id": message_dict["id"]}
                )
        
        return {
            "success": True,
            "message": "Message sent successfully",
            "data": message_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending group message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )

# ============= ASSIGNMENT ROUTES =============

@router.post("/groups/{group_id}/assignments")
async def create_assignment(
    group_id: str,
    assignment_data: AssignmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create assignment for group"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if user has permission to create assignments
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        user_role = None
        for member in group.get("members", []):
            if member["user_id"] == current_user["id"]:
                user_role = member["role"]
                break
        
        # Check if user can create assignments based on group settings
        can_create = (
            user_role in ["admin", "moderator"] or 
            group.get("settings", {}).get("allow_member_assignments", False)
        )
        
        if not can_create:
            raise HTTPException(status_code=403, detail="Permission denied to create assignments")
        
        # Create assignment
        assignment_dict = {
            "title": assignment_data.title,
            "description": assignment_data.description,
            "assignment_type": assignment_data.assignment_type.value,
            "group_id": group_id,
            "group_name": group["name"],
            "created_by": current_user["id"],
            "created_by_name": current_user["name"],
            "due_date": assignment_data.due_date,
            "points": assignment_data.points,
            "attachments": [att.dict() for att in assignment_data.attachments],
            "instructions": assignment_data.instructions,
            "submissions": [],
            "status": "published",
            "created_at": datetime.utcnow(),
            "updated_at": None
        }
        
        result = assignments_collection.insert_one(assignment_dict)
        assignment_dict["id"] = str(result.inserted_id)
        assignment_dict.pop("_id", None)
        
        # Send assignment notification message to group
        assignment_message = {
            "group_id": group_id,
            "sender_id": current_user["id"],
            "sender_name": current_user["name"],
            "message_type": "assignment",
            "content": f"📋 New Assignment: {assignment_data.title}",
            "assignment_id": assignment_dict["id"],
            "attachments": [],
            "reply_to": None,
            "reactions": [],
            "is_pinned": True,
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "is_edited": False
        }
        
        group_messages_collection.insert_one(assignment_message)
        
        # Broadcast assignment creation
        await manager.broadcast_to_community(json.dumps({
            "type": "assignment_created",
            "group_id": group_id,
            "data": assignment_dict,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Notify all group members
        for member in group.get("members", []):
            if member["user_id"] != current_user["id"]:
                await manager.send_notification(
                    member["user_id"],
                    "new_assignment",
                    f"New Assignment in {group['name']}",
                    f"{assignment_data.title}",
                    {"group_id": group_id, "assignment_id": assignment_dict["id"]}
                )
        
        return {
            "success": True,
            "message": "Assignment created successfully",
            "assignment": assignment_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assignment"
        )

@router.get("/groups/{group_id}/assignments")
async def get_group_assignments(
    group_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get assignments for group"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if user is a member
        group = groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        is_member = any(member["user_id"] == current_user["id"] for member in group.get("members", []))
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Get assignments
        assignments = list(assignments_collection.find(
            {"group_id": group_id}
        ).sort("created_at", -1))
        
        # Format assignments
        formatted_assignments = []
        for assignment in assignments:
            assignment["id"] = str(assignment["_id"])
            assignment.pop("_id", None)
            
            # Check if current user has submitted
            user_submission = None
            for submission in assignment.get("submissions", []):
                if submission["student_id"] == current_user["id"]:
                    user_submission = submission
                    break
            
            assignment["user_submission"] = user_submission
            formatted_assignments.append(assignment)
        
        return {
            "success": True,
            "assignments": formatted_assignments
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting group assignments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assignments"
        )

@router.get("/stats")
async def get_group_stats(current_user: dict = Depends(get_current_user)):
    """Get group statistics"""
    try:
        if not test_connection():
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Get user's groups
        user_groups = list(groups_collection.find({"members.user_id": current_user["id"]}))
        group_ids = [str(group["_id"]) for group in user_groups]
        
        # Calculate stats
        total_groups = len(user_groups)
        total_members = sum(group.get("member_count", 0) for group in user_groups)
        
        # Count assignments
        all_assignments = list(assignments_collection.find({"group_id": {"$in": group_ids}}))
        active_assignments = len([a for a in all_assignments if a.get("status") == "published"])
        
        # Messages today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        messages_today = group_messages_collection.count_documents({
            "group_id": {"$in": group_ids},
            "created_at": {"$gte": today}
        })
        
        return {
            "success": True,
            "stats": {
                "total_groups": total_groups,
                "total_members": total_members,
                "active_assignments": active_assignments,
                "completed_assignments": len(all_assignments) - active_assignments,
                "messages_today": messages_today
            }
        }
        
    except Exception as e:
        print(f"Error getting group stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve group stats"
        )