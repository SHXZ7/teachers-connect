from fastapi import APIRouter
import os
from openai import AsyncOpenAI

router = APIRouter()

@router.get("/test/simple")
async def simple_test():
    """Super simple test endpoint"""
    return {"status": "ok", "message": "Simple test works"}

@router.get("/test/stats") 
async def simple_stats():
    """Simple stats endpoint without dependencies"""
    return {
        "success": True,
        "total_lessons": 0,
        "recent_lessons": 0,
        "lessons_by_subject": []
    }

@router.get("/test/openrouter")
async def test_openrouter():
    """Test OpenRouter API connection"""
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        
        if not api_key:
            return {"success": False, "error": "API key not configured"}
        
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Simple test call
        response = await client.chat.completions.create(
            model="anthropic/claude-3-haiku",  # Use cheaper model for testing
            messages=[
                {"role": "user", "content": "Say 'Hello, test successful!' and nothing else."}
            ],
            max_tokens=50,
            timeout=10
        )
        
        return {
            "success": True,
            "api_key_configured": True,
            "api_key_length": len(api_key),
            "model_used": "anthropic/claude-3-haiku",
            "response": response.choices[0].message.content if response.choices else "No response"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "api_key_configured": bool(os.getenv("OPENROUTER_API_KEY"))
        }