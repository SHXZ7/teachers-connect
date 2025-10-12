from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    name: str
    email: EmailStr
    bio: Optional[str] = ""
    school: Optional[str] = ""
    subject: Optional[str] = ""
    experience: Optional[str] = ""
    location: Optional[str] = ""
    phone: Optional[str] = ""

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    school: Optional[str] = None
    subject: Optional[str] = None
    experience: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
