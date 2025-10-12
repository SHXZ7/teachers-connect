from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user_model import UserSignup, UserLogin
from database import users_collection, test_connection
from bson import ObjectId
from jose import jwt, JWTError
from dotenv import load_dotenv
import os, bcrypt

load_dotenv()
router = APIRouter()
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

@router.post("/signup")
def signup(user: UserSignup):
    try:
        # Test database connection first
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable. Please try again later."
            )
        
        # Check if user already exists
        existing = users_collection.find_one({"email": user.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Hash password
        hashed_pw = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
        
        # Create new user document
        new_user = {
            "name": user.name,
            "email": user.email, 
            "password": hashed_pw.decode("utf-8"),
            "role": "teacher",  # default role
            "is_active": True
        }
        
        # Insert user into database
        result = users_collection.insert_one(new_user)
        
        print(f"New user created: {user.email}")
        return {
            "message": "Account created successfully",
            "user_id": str(result.inserted_id),
            "email": user.email
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account creation. Please try again."
        )

@router.post("/login")
def login(user: UserLogin):
    try:
        # Test database connection first
        if not test_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable. Please try again later."
            )
        
        # Find user by email
        existing = users_collection.find_one({"email": user.email})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        valid = bcrypt.checkpw(
            user.password.encode("utf-8"), 
            existing["password"].encode("utf-8")
        )
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Create JWT token
        token_data = {
            "user_id": str(existing["_id"]),
            "email": existing["email"],
            "role": existing.get("role", "teacher")
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        print(f"User logged in: {user.email}")
        return {
            "message": "Login successful", 
            "token": token,
            "user": {
                "id": str(existing["_id"]),
                "name": existing.get("name"),
                "email": existing["email"],
                "role": existing.get("role", "teacher")
            }
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except JWTError:
        print("JWT token creation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication token creation failed"
        )
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login. Please try again."
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user from JWT token
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Get user from database
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user["email"],
            "role": user.get("role", "teacher")
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )
