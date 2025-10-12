from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
from database import users_collection
from models.user_model import UserProfile, UserProfileUpdate
from bson import ObjectId
import os

load_dotenv()
router = APIRouter()
security = HTTPBearer()

# JWT configuration (matches auth_routes.py)
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: str = Depends(get_current_user)):
    """Get user profile"""
    try:
        user = users_collection.find_one({"email": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return profile with default values if fields don't exist
        profile = UserProfile(
            name=user.get("name", ""),
            email=user.get("email", ""),
            bio=user.get("bio", ""),
            school=user.get("school", ""),
            subject=user.get("subject", ""),
            experience=user.get("experience", ""),
            location=user.get("location", ""),
            phone=user.get("phone", "")
        )
        
        return profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update user profile"""
    try:
        user = users_collection.find_one({"email": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update dictionary with only provided fields
        update_data = {}
        if profile_update.name is not None:
            update_data["name"] = profile_update.name
        if profile_update.bio is not None:
            update_data["bio"] = profile_update.bio
        if profile_update.school is not None:
            update_data["school"] = profile_update.school
        if profile_update.subject is not None:
            update_data["subject"] = profile_update.subject
        if profile_update.experience is not None:
            update_data["experience"] = profile_update.experience
        if profile_update.location is not None:
            update_data["location"] = profile_update.location
        if profile_update.phone is not None:
            update_data["phone"] = profile_update.phone
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update user profile
        result = users_collection.update_one(
            {"email": current_user},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Profile update failed")
        
        # Return updated profile
        updated_user = users_collection.find_one({"email": current_user})
        profile = UserProfile(
            name=updated_user.get("name", ""),
            email=updated_user.get("email", ""),
            bio=updated_user.get("bio", ""),
            school=updated_user.get("school", ""),
            subject=updated_user.get("subject", ""),
            experience=updated_user.get("experience", ""),
            location=updated_user.get("location", ""),
            phone=updated_user.get("phone", "")
        )
        
        return {"message": "Profile updated successfully", "profile": profile}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@router.delete("/profile")
async def delete_profile(current_user: str = Depends(get_current_user)):
    """Delete user profile (soft delete by clearing profile fields)"""
    try:
        user = users_collection.find_one({"email": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Clear profile fields but keep essential user data
        result = users_collection.update_one(
            {"email": current_user},
            {"$unset": {
                "bio": "",
                "school": "",
                "subject": "",
                "experience": "",
                "location": "",
                "phone": ""
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Profile deletion failed")
        
        return {"message": "Profile cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")