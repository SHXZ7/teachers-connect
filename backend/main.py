import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set environment variables for Hugging Face and other services
os.environ['TRANSFORMERS_CACHE'] = '/tmp/transformers_cache'
os.environ['HF_HOME'] = '/tmp/huggingface'
os.environ['TORCH_HOME'] = '/tmp/torch'

# Create cache directories if they don't exist
for cache_dir in ['/tmp/transformers_cache', '/tmp/huggingface', '/tmp/torch']:
    os.makedirs(cache_dir, exist_ok=True)

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Now import our modules
from routes.auth_routes import router as AuthRouter
from routes.resource_routes import router as ResourceRouter
from routes.lesson_routes import router as LessonRouter
from routes.multilingual_routes import router as MultilingualRouter
from routes.offline_sync import router as OfflineSyncRouter
from routes.profile_routes import router as ProfileRouter
from routes.community_routes import router as CommunityRouter
from routes.group_routes import router as GroupRouter
from routes.simple_test_routes import router as TestRouter
from database import test_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Teachers Connect API...")
    connection_status = test_connection()
    if connection_status:
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")
    yield
    # Shutdown
    print("Shutting down Teachers Connect API...")

app = FastAPI(
    title="Teachers Connect API",
    description="AI-powered platform for rural education with resource sharing and lesson generation",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(AuthRouter, prefix="/api", tags=["Authentication"])
app.include_router(ProfileRouter, prefix="/api", tags=["Profile"])
app.include_router(ResourceRouter, prefix="/api", tags=["Resources"])
app.include_router(LessonRouter, prefix="/api", tags=["AI Lessons"])
app.include_router(MultilingualRouter, prefix="/api/multilingual", tags=["Multilingual Translation"])
app.include_router(OfflineSyncRouter, prefix="/api/offline", tags=["Offline Sync"])
app.include_router(CommunityRouter, prefix="/api/community", tags=["Community"])
app.include_router(GroupRouter, prefix="/api/groups", tags=["Groups & Assignments"])
app.include_router(TestRouter, prefix="/api", tags=["Testing"])

@app.get("/")
def home():
    return {
        "message": "Teachers Connect API is running!",
        "version": "2.0.0",
        "status": "active",
        "endpoints": {
            "auth": "/api/signup, /api/login",
            "resources": "/api/resources",
            "community": "/api/community",
            "multilingual": "/api/multilingual",
            "websocket": "/api/community/ws/{user_id}"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected"
    }
