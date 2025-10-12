import pymongo
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")

# Create MongoDB client
client = pymongo.MongoClient(MONGO_URI)

# Database and collection
db = client["teachers_connect_db"]
users_collection = db["users"]
resources_collection = db["resources"]
ratings_collection = db["ratings"]
likes_collection = db["likes"]
lessons_collection = db["lessons"]

# Community collections
community_posts_collection = db["community_posts"]
community_comments_collection = db["community_comments"]
community_reactions_collection = db["community_reactions"]
community_notifications_collection = db["community_notifications"]

# Group collections
groups_collection = db["groups"]
group_messages_collection = db["group_messages"]
assignments_collection = db["assignments"]
assignment_submissions_collection = db["assignment_submissions"]

def get_database():
    """Get the database instance"""
    return db

def test_connection():
    """Test MongoDB connection"""
    try:
        # Test the connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False
