"""
AI Model Configuration for OpenRouter Integration

This file contains configuration for different AI models available through OpenRouter.
You can easily switch between models or add new ones here.
"""

# Available AI Models on OpenRouter
AI_MODELS = {
    # OpenAI Models
    "gpt-4-turbo": {
        "name": "openai/gpt-4-turbo",
        "description": "Most capable GPT-4 model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.01,
        "best_for": ["complex_reasoning", "detailed_analysis", "creative_writing"]
    },
    
    "gpt-4": {
        "name": "openai/gpt-4",
        "description": "Standard GPT-4 model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.03,
        "best_for": ["general_purpose", "lesson_planning", "detailed_responses"]
    },
    
    "gpt-3.5-turbo": {
        "name": "openai/gpt-3.5-turbo",
        "description": "Fast and efficient ChatGPT model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.002,
        "best_for": ["quick_responses", "simple_qa", "cost_effective"]
    },
    
    # Anthropic Models
    "claude-3-opus": {
        "name": "anthropic/claude-3-opus",
        "description": "Most powerful Claude model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.015,
        "best_for": ["complex_analysis", "educational_content", "detailed_explanations"]
    },
    
    "claude-3-sonnet": {
        "name": "anthropic/claude-3-sonnet",
        "description": "Balanced Claude model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.003,
        "best_for": ["lesson_planning", "educational_qa", "balanced_performance"]
    },
    
    "claude-3-haiku": {
        "name": "anthropic/claude-3-haiku",
        "description": "Fast and efficient Claude model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.00025,
        "best_for": ["quick_responses", "simple_qa", "real_time_chat"]
    },
    
    # Google Models
    "gemini-pro": {
        "name": "google/gemini-pro",
        "description": "Google's advanced AI model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.0005,
        "best_for": ["multimodal_tasks", "educational_content", "analysis"]
    },
    
    # Meta Models
    "llama-2-70b": {
        "name": "meta-llama/llama-2-70b-chat",
        "description": "Meta's large language model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.0007,
        "best_for": ["open_source", "general_purpose", "cost_effective"]
    },
    
    # Mistral Models
    "mixtral-8x7b": {
        "name": "mistralai/mixtral-8x7b-instruct",
        "description": "Mistral's mixture of experts model",
        "max_tokens": 4096,
        "cost_per_1k_tokens": 0.0006,
        "best_for": ["multilingual", "efficient", "specialized_tasks"]
    }
}

# Model Selection Strategy
MODEL_SELECTION = {
    "lesson_generation": {
        "primary": "claude-3-sonnet",  # Best for educational content
        "backup": "gpt-3.5-turbo",    # Cost-effective fallback
        "premium": "claude-3-opus"     # For complex lesson plans
    },
    
    "qa_assistant": {
        "primary": "claude-3-haiku",   # Fast responses for real-time chat
        "backup": "gpt-3.5-turbo",    # Reliable alternative
        "complex": "claude-3-sonnet"   # For detailed explanations
    },
    
    "content_analysis": {
        "primary": "claude-3-sonnet",  # Good at analyzing educational content
        "backup": "gpt-4",            # Excellent reasoning
        "multimodal": "gemini-pro"     # For images/documents
    }
}

# Usage Scenarios
USAGE_SCENARIOS = {
    "quick_qa": {
        "model": "claude-3-haiku",
        "max_tokens": 500,
        "temperature": 0.7,
        "description": "Fast responses to simple questions"
    },
    
    "detailed_lesson": {
        "model": "claude-3-sonnet", 
        "max_tokens": 4000,
        "temperature": 0.6,
        "description": "Comprehensive lesson plan generation"
    },
    
    "creative_activities": {
        "model": "gpt-4",
        "max_tokens": 2000,
        "temperature": 0.8,
        "description": "Creative teaching activities and games"
    },
    
    "curriculum_analysis": {
        "model": "claude-3-opus",
        "max_tokens": 3000,
        "temperature": 0.5,
        "description": "Deep analysis of curriculum and standards"
    },
    
    "assessment_creation": {
        "model": "claude-3-sonnet",
        "max_tokens": 2000,
        "temperature": 0.6,
        "description": "Creating quizzes, tests, and rubrics"
    }
}

# Educational Prompts Templates
PROMPT_TEMPLATES = {
    "lesson_plan": """
Create a comprehensive {duration}-minute lesson plan for {grade_level} students on the topic "{topic}" in {subject}.

Learning Objectives:
{objectives}

Lesson Type: {lesson_type}
Difficulty: {difficulty}

{resource_context}

Please structure the lesson with:
1. Clear learning objectives
2. Engaging opening activity
3. Main content delivery with activities
4. Assessment methods
5. Closure and homework
6. Required materials

Make it interactive, age-appropriate, and pedagogically sound.
""",

    "quick_qa": """
As an expert education consultant, answer this teacher's question:

Question: {question}

{context}

Provide a practical, actionable response that the teacher can implement immediately.
""",

    "assessment_creation": """
Create assessment materials for a lesson on "{topic}" for {grade_level} students.

Include:
1. Formative assessment activities
2. Summative assessment options
3. Rubric for evaluation
4. Differentiation strategies

Learning objectives: {objectives}
""",

    "activity_suggestions": """
Suggest 5 engaging classroom activities for teaching "{topic}" to {grade_level} students.

Consider:
- Different learning styles
- Interactive elements
- Time constraints ({duration} minutes)
- Available resources

Make activities practical and fun!
"""
}

def get_model_config(scenario: str) -> dict:
    """Get model configuration for a specific usage scenario"""
    return USAGE_SCENARIOS.get(scenario, USAGE_SCENARIOS["quick_qa"])

def get_model_for_task(task: str) -> str:
    """Get the best model for a specific task"""
    task_mapping = {
        "lesson_generation": MODEL_SELECTION["lesson_generation"]["primary"],
        "qa_assistant": MODEL_SELECTION["qa_assistant"]["primary"],
        "content_analysis": MODEL_SELECTION["content_analysis"]["primary"]
    }
    
    model_key = task_mapping.get(task, "claude-3-haiku")
    return AI_MODELS[model_key]["name"]

def get_prompt_template(template_name: str) -> str:
    """Get a prompt template by name"""
    return PROMPT_TEMPLATES.get(template_name, PROMPT_TEMPLATES["quick_qa"])