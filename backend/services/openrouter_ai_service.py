import os
import asyncio
import aiofiles
import PyPDF2
import docx
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from openai import AsyncOpenAI
import tiktoken
from sentence_transformers import SentenceTransformer
import numpy as np

from models.lesson_model import (
    LessonGenerationRequest, GeneratedLesson, LessonSection, 
    QuestionRequest, AIResponse, DifficultyLevel, LessonType
)
from database import get_database

class OpenRouterAIService:
    def __init__(self):
        self.db = get_database()
        
        # Initialize OpenRouter client (using OpenAI SDK with custom base URL)
        try:
            self.client = AsyncOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
                timeout=60.0
            )
        except Exception as e:
            print(f"Warning: Failed to initialize OpenAI client: {e}")
            # Fallback initialization without problematic parameters
            self.client = AsyncOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            )
        
        # AI Model configuration
        self.primary_model = os.getenv("DEFAULT_AI_MODEL", "anthropic/claude-3-haiku")
        self.backup_model = os.getenv("BACKUP_AI_MODEL", "openai/gpt-3.5-turbo")
        self.max_tokens = int(os.getenv("MAX_TOKENS", "4000"))
        
        # Initialize embedding model for semantic search (with error handling)
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Warning: Failed to initialize embedding model: {e}")
            self.embedding_model = None
        
        # Token counting
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            print(f"Warning: Failed to initialize tokenizer: {e}")
            self.tokenizer = None
        
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        if self.tokenizer is None:
            # Fallback: rough estimation (1 token ≈ 4 characters)
            return len(text) // 4
        return len(self.tokenizer.encode(text))
    
    def truncate_text(self, text: str, max_tokens: int = 3000) -> str:
        """Truncate text to fit within token limit"""
        if self.tokenizer is None:
            # Fallback: rough character-based truncation
            max_chars = max_tokens * 4
            return text[:max_chars] if len(text) > max_chars else text
            
        tokens = self.tokenizer.encode(text)
        if len(tokens) <= max_tokens:
            return text
        
        truncated_tokens = tokens[:max_tokens]
        return self.tokenizer.decode(truncated_tokens)
    
    async def extract_text_from_file(self, file_path: str, file_type: str) -> str:
        """Extract text content from various file types"""
        try:
            full_path = os.path.join("uploads", file_path)
            
            if not os.path.exists(full_path):
                return f"File not found: {file_path}"
            
            if file_type.lower() == "pdf":
                return await self._extract_pdf_text(full_path)
            elif file_type.lower() in ["doc", "docx"]:
                return await self._extract_docx_text(full_path)
            elif file_type.lower() == "txt":
                return await self._extract_txt_text(full_path)
            else:
                return f"Unsupported file type: {file_type}"
                
        except Exception as e:
            return f"Error extracting text from {file_path}: {str(e)}"
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            async with aiofiles.open(file_path, 'rb') as file:
                content = await file.read()
                
            # Use PyPDF2 to extract text
            from io import BytesIO
            pdf_reader = PyPDF2.PdfReader(BytesIO(content))
            
            text_content = []
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text.strip():
                    text_content.append(f"Page {page_num + 1}:\n{page_text}")
                    
            return "\n\n".join(text_content)
            
        except Exception as e:
            return f"Error reading PDF: {str(e)}"
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text_content = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_content.append(paragraph.text)
                    
            return "\n\n".join(text_content)
            
        except Exception as e:
            return f"Error reading DOCX: {str(e)}"
    
    async def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                content = await file.read()
                return content
                
        except Exception as e:
            return f"Error reading TXT: {str(e)}"
    
    async def get_resource_context(self, resource_ids: List[str]) -> str:
        """Extract and compile context from selected resources"""
        context_parts = []
        
        for resource_id in resource_ids:
            try:
                resource = await self.db.resources.find_one({"_id": resource_id})
                if resource:
                    # Get basic resource info
                    title = resource.get("title", "")
                    description = resource.get("description", "")
                    subject = resource.get("subject_area", "")
                    grade = resource.get("grade_level", "")
                    file_path = resource.get("file_path", "")
                    file_type = resource.get("file_type", "")
                    
                    # Extract actual file content
                    file_content = await self.extract_text_from_file(file_path, file_type)
                    
                    # Truncate if too long
                    file_content = self.truncate_text(file_content, 1000)
                    
                    context_part = f"""
RESOURCE: {title}
Subject: {subject.replace('_', ' ').title()}
Grade Level: {grade.replace('_', ' ').title()}
Description: {description}

CONTENT:
{file_content}

---
"""
                    context_parts.append(context_part)
                    
            except Exception as e:
                print(f"Error getting context from resource {resource_id}: {e}")
                continue
        
        full_context = "\n".join(context_parts)
        return self.truncate_text(full_context, 8000)  # Keep within reasonable limits
    
    async def generate_lesson_plan(self, request: LessonGenerationRequest, resource_context: str = "") -> GeneratedLesson:
        """Generate a comprehensive lesson plan using AI"""
        
        # Create the AI prompt
        prompt = self._create_lesson_generation_prompt(request, resource_context)
        
        try:
            # Call OpenRouter AI
            response = await self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational AI assistant specializing in creating comprehensive, engaging lesson plans for teachers. You have extensive knowledge of pedagogy, curriculum development, and age-appropriate teaching strategies."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.7
            )
            
            # Parse the AI response
            ai_content = response.choices[0].message.content
            lesson = self._parse_lesson_response(ai_content, request)
            
            return lesson
            
        except Exception as e:
            print(f"Error with primary AI model: {e}")
            
            # Fallback to backup model
            try:
                response = await self.client.chat.completions.create(
                    model=self.backup_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert educational AI assistant. Create comprehensive lesson plans for teachers."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=self.max_tokens,
                    temperature=0.7
                )
                
                ai_content = response.choices[0].message.content
                lesson = self._parse_lesson_response(ai_content, request)
                return lesson
                
            except Exception as backup_error:
                print(f"Error with backup AI model: {backup_error}")
                # Return a basic lesson structure as final fallback
                return self._create_fallback_lesson(request)
    
    def _create_lesson_generation_prompt(self, request: LessonGenerationRequest, resource_context: str) -> str:
        """Create a detailed prompt for lesson generation"""
        
        objectives_text = ""
        if request.learning_objectives:
            objectives_text = f"Specific learning objectives to include: {', '.join(request.learning_objectives)}"
        
        context_text = ""
        if resource_context:
            context_text = f"""
REFERENCE MATERIALS TO USE:
{resource_context}

Please incorporate relevant information from these uploaded educational resources into the lesson plan.
"""
        
        additional_context = ""
        if request.additional_context:
            additional_context = f"Additional requirements: {request.additional_context}"
        
        prompt = f"""
Create a comprehensive lesson plan with the following specifications:

LESSON DETAILS:
- Topic: {request.topic}
- Grade Level: {request.grade_level.replace('_', ' ').title()}
- Subject Area: {request.subject_area.replace('_', ' ').title()}
- Duration: {request.duration_minutes} minutes
- Lesson Type: {request.lesson_type.value.title()}
- Difficulty Level: {request.difficulty.value.title()}

{objectives_text}
{additional_context}

{context_text}

Please provide a detailed lesson plan in the following JSON format:

{{
    "title": "Creative lesson title",
    "lesson_overview": "Comprehensive overview of the lesson (2-3 paragraphs)",
    "learning_objectives": ["Specific, measurable learning objective 1", "Learning objective 2", "Learning objective 3"],
    "sections": [
        {{
            "title": "Section name (e.g., Introduction, Main Activity, etc.)",
            "content": "Detailed description of what happens in this section",
            "duration_minutes": number,
            "activities": ["Activity 1", "Activity 2"],
            "materials_needed": ["Material 1", "Material 2"]
        }}
    ],
    "assessment_methods": ["Assessment method 1", "Assessment method 2"],
    "homework_suggestions": ["Homework task 1", "Homework task 2"],
    "additional_resources": ["Resource suggestion 1", "Resource suggestion 2"]
}}

Ensure the lesson is:
1. Age-appropriate for {request.grade_level.replace('_', ' ')} students
2. Engaging and interactive
3. Pedagogically sound
4. Includes diverse learning activities
5. Has clear progression from introduction to conclusion
6. Incorporates the uploaded reference materials when relevant

Make the sections add up to exactly {request.duration_minutes} minutes total.
"""
        return prompt
    
    def _parse_lesson_response(self, ai_response: str, request: LessonGenerationRequest) -> GeneratedLesson:
        """Parse AI response and create GeneratedLesson object"""
        try:
            # Try to extract JSON from the response
            start_json = ai_response.find('{')
            end_json = ai_response.rfind('}') + 1
            
            if start_json != -1 and end_json != -1:
                json_str = ai_response[start_json:end_json]
                lesson_data = json.loads(json_str)
            else:
                # If no JSON found, create structured data from text
                lesson_data = self._extract_lesson_from_text(ai_response)
            
            # Create lesson sections
            sections = []
            for section_data in lesson_data.get("sections", []):
                section = LessonSection(
                    title=section_data.get("title", ""),
                    content=section_data.get("content", ""),
                    duration_minutes=section_data.get("duration_minutes", 10),
                    activities=section_data.get("activities", []),
                    materials_needed=section_data.get("materials_needed", [])
                )
                sections.append(section)
            
            # Create the lesson
            lesson = GeneratedLesson(
                title=lesson_data.get("title", f"{request.topic} - {request.grade_level.replace('_', ' ').title()}"),
                topic=request.topic,
                grade_level=request.grade_level,
                subject_area=request.subject_area,
                duration_minutes=request.duration_minutes,
                lesson_type=request.lesson_type,
                difficulty=request.difficulty,
                learning_objectives=lesson_data.get("learning_objectives", []),
                lesson_overview=lesson_data.get("lesson_overview", ""),
                sections=sections,
                assessment_methods=lesson_data.get("assessment_methods", []),
                homework_suggestions=lesson_data.get("homework_suggestions", []),
                additional_resources=lesson_data.get("additional_resources", []),
                generated_from_resources=request.selected_resources,
                created_by=""  # Will be set in the route
            )
            
            return lesson
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            return self._create_fallback_lesson(request)
    
    def _extract_lesson_from_text(self, text: str) -> Dict[str, Any]:
        """Extract lesson structure from unstructured text response"""
        # This is a fallback method to extract lesson data from free-form text
        return {
            "title": f"AI Generated Lesson",
            "lesson_overview": text[:500] + "...",
            "learning_objectives": ["Students will understand the topic", "Students will apply concepts"],
            "sections": [
                {
                    "title": "Introduction",
                    "content": "Introduce the topic and engage students",
                    "duration_minutes": 10,
                    "activities": ["Discussion", "Q&A"],
                    "materials_needed": ["Whiteboard"]
                }
            ],
            "assessment_methods": ["Observation", "Questions"],
            "homework_suggestions": ["Practice exercises"],
            "additional_resources": ["Textbook references"]
        }
    
    def _create_fallback_lesson(self, request: LessonGenerationRequest) -> GeneratedLesson:
        """Create a basic lesson structure as fallback"""
        sections = [
            LessonSection(
                title="Introduction",
                content=f"Introduce students to {request.topic} with engaging questions and examples.",
                duration_minutes=int(request.duration_minutes * 0.2),
                activities=["Opening discussion", "Topic introduction"],
                materials_needed=["Whiteboard", "Markers"]
            ),
            LessonSection(
                title="Main Content",
                content=f"Explore the key concepts of {request.topic} through interactive learning.",
                duration_minutes=int(request.duration_minutes * 0.6),
                activities=["Presentation", "Group work", "Practice"],
                materials_needed=["Learning materials", "Worksheets"]
            ),
            LessonSection(
                title="Conclusion",
                content="Summarize key learning points and assign follow-up work.",
                duration_minutes=int(request.duration_minutes * 0.2),
                activities=["Summary", "Q&A", "Homework assignment"],
                materials_needed=["Exit tickets"]
            )
        ]
        
        return GeneratedLesson(
            title=f"{request.topic} - {request.grade_level.replace('_', ' ').title()}",
            topic=request.topic,
            grade_level=request.grade_level,
            subject_area=request.subject_area,
            duration_minutes=request.duration_minutes,
            lesson_type=request.lesson_type,
            difficulty=request.difficulty,
            learning_objectives=[f"Students will understand {request.topic}"],
            lesson_overview=f"This lesson introduces students to {request.topic}.",
            sections=sections,
            assessment_methods=["Observation", "Questions", "Practice exercises"],
            homework_suggestions=[f"Complete practice exercises on {request.topic}"],
            additional_resources=["Textbook references", "Online resources"],
            generated_from_resources=request.selected_resources,
            created_by=""
        )
    
    async def answer_question(
        self, 
        question: str, 
        context: str = "", 
        subject_area: str = None, 
        grade_level: str = None,
        user_id: str = None
    ) -> Dict[str, Any]:
        """Enhanced AI question answering with RAG capabilities using generated notes and resources"""
        
        try:
            # Step 1: Retrieve relevant context from user's generated notes and resources
            retrieved_context = await self._retrieve_relevant_context(
                question=question, 
                user_id=user_id, 
                subject_area=subject_area, 
                grade_level=grade_level
            )
            
            # Step 2: Combine provided context with retrieved context
            full_context = ""
            if context:
                full_context += f"PROVIDED CONTEXT:\n{context}\n\n"
            
            if retrieved_context:
                full_context += f"RETRIEVED KNOWLEDGE BASE:\n{retrieved_context}\n\n"
            
            # Step 3: Create enhanced AI prompt
            system_prompt = """You are an expert AI teaching assistant with access to the user's educational content and generated notes. 

Your capabilities:
- Answer questions about educational content using RAG (Retrieval-Augmented Generation)
- Reference specific documents, notes, and resources the user has uploaded
- Provide detailed explanations based on the user's own study materials
- Suggest practical applications and teaching strategies
- Connect concepts across different resources and subjects

Always:
1. Reference specific sources when using retrieved information
2. Provide detailed, accurate answers based on the available context
3. Suggest follow-up questions or related topics
4. Be pedagogically sound and age-appropriate for the specified grade level"""

            user_prompt = f"""
QUESTION: {question}

{f"SUBJECT AREA: {subject_area}" if subject_area else ""}
{f"GRADE LEVEL: {grade_level}" if grade_level else ""}

{full_context if full_context else ""}

Please provide a comprehensive answer that:
1. Directly addresses the question
2. Uses the retrieved context from the user's notes and resources
3. Provides specific examples and applications
4. Suggests related concepts or follow-up questions
5. References the sources you're using in your answer

If you cannot find relevant information in the context, clearly state this and provide general educational guidance.
"""

            # Step 4: Call OpenRouter AI
            response = await self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent educational responses
                max_tokens=1500,
                timeout=60
            )
            
            if not response.choices:
                raise Exception("No response from AI model")
            
            answer = response.choices[0].message.content.strip()
            
            # Step 5: Calculate confidence score based on context quality
            confidence_score = self._calculate_confidence_score(question, retrieved_context, answer)
            
            # Step 6: Find related resources and suggestions
            sources = await self._get_context_sources(user_id, question)
            suggestions = await self._generate_follow_up_suggestions(question, answer, subject_area)
            
            return {
                "answer": answer,
                "confidence_score": confidence_score,
                "sources": sources,
                "suggestions": suggestions,
                "context_used": bool(retrieved_context),
                "model_used": self.primary_model
            }
            
        except Exception as e:
            print(f"Error in enhanced answer_question: {e}")
            # Fallback to simple response
            return {
                "answer": f"I apologize, but I encountered an error while processing your question: '{question}'. Please try rephrasing your question or check if you have uploaded relevant resources and generated notes that I can reference.",
                "confidence_score": 0.3,
                "sources": [],
                "suggestions": ["Try uploading relevant educational resources", "Generate notes from your documents first", "Rephrase your question with more specific details"],
                "context_used": False,
                "error": str(e)
            }

    async def _retrieve_relevant_context(
        self, 
        question: str, 
        user_id: str = None, 
        subject_area: str = None, 
        grade_level: str = None
    ) -> str:
        """Retrieve relevant context from user's notes, resources, and lessons using semantic search"""
        
        if not user_id:
            return ""
        
        context_parts = []
        
        try:
            # 1. Search in generated notes
            notes_context = await self._search_generated_notes(question, user_id, subject_area, grade_level)
            if notes_context:
                context_parts.append(f"GENERATED NOTES:\n{notes_context}")
            
            # 2. Search in resource content
            resource_context = await self._search_resource_content(question, user_id, subject_area, grade_level)
            if resource_context:
                context_parts.append(f"RESOURCE CONTENT:\n{resource_context}")
            
            # 3. Search in lesson plans
            lesson_context = await self._search_lesson_content(question, user_id, subject_area, grade_level)
            if lesson_context:
                context_parts.append(f"LESSON PLANS:\n{lesson_context}")
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return ""

    async def _search_generated_notes(self, question: str, user_id: str, subject_area: str = None, grade_level: str = None) -> str:
        """Search through user's generated notes for relevant content"""
        try:
            # Build query
            query = {"generated_by": user_id}
            
            if subject_area:
                query["subject_area"] = subject_area
            if grade_level:
                query["grade_level"] = grade_level
            
            # Search notes collection
            notes_cursor = self.db.notes.find(query).sort("created_at", -1).limit(5)
            
            relevant_notes = []
            question_keywords = set(question.lower().split())
            
            async for note in notes_cursor:
                note_content = note.get("content", {})
                
                # Check if note content is relevant to the question
                relevance_score = 0
                
                # Check summary
                summary = note_content.get("summary", "")
                if any(keyword in summary.lower() for keyword in question_keywords):
                    relevance_score += 2
                
                # Check key points
                key_points = note_content.get("key_points", [])
                for point in key_points:
                    if any(keyword in str(point).lower() for keyword in question_keywords):
                        relevance_score += 1
                
                # Check vocabulary
                vocabulary = note_content.get("vocabulary", [])
                for term in vocabulary:
                    if any(keyword in str(term).lower() for keyword in question_keywords):
                        relevance_score += 1
                
                if relevance_score > 0:
                    relevant_notes.append({
                        "title": note.get("resource_title", "Generated Notes"),
                        "summary": summary,
                        "key_points": key_points[:3],  # Top 3 key points
                        "relevance": relevance_score
                    })
            
            # Sort by relevance and format
            relevant_notes.sort(key=lambda x: x["relevance"], reverse=True)
            
            if not relevant_notes:
                return ""
            
            formatted_notes = []
            for note in relevant_notes[:3]:  # Top 3 most relevant notes
                formatted_note = f"""
NOTES FROM: {note['title']}
SUMMARY: {note['summary']}
KEY POINTS: {', '.join(str(point) for point in note['key_points'])}
"""
                formatted_notes.append(formatted_note)
            
            return "\n".join(formatted_notes)
            
        except Exception as e:
            print(f"Error searching generated notes: {e}")
            return ""

    async def _search_resource_content(self, question: str, user_id: str, subject_area: str = None, grade_level: str = None) -> str:
        """Search through user's uploaded resources for relevant content"""
        try:
            # Build query for resources
            query = {"created_by": user_id}  # Note: this might be "author_id" based on your schema
            
            if subject_area:
                query["subject_area"] = subject_area
            if grade_level:
                query["grade_level"] = grade_level
            
            # Search resources
            resources_cursor = self.db.resources.find(query).limit(3)
            
            question_keywords = set(question.lower().split())
            relevant_resources = []
            
            async for resource in resources_cursor:
                title = resource.get("title", "")
                description = resource.get("description", "")
                
                # Simple keyword matching for relevance
                relevance_score = 0
                if any(keyword in title.lower() for keyword in question_keywords):
                    relevance_score += 2
                if description and any(keyword in description.lower() for keyword in question_keywords):
                    relevance_score += 1
                
                if relevance_score > 0:
                    relevant_resources.append({
                        "title": title,
                        "description": description,
                        "subject": resource.get("subject_area", ""),
                        "grade": resource.get("grade_level", ""),
                        "relevance": relevance_score
                    })
            
            if not relevant_resources:
                return ""
            
            # Sort by relevance
            relevant_resources.sort(key=lambda x: x["relevance"], reverse=True)
            
            formatted_resources = []
            for resource in relevant_resources[:2]:  # Top 2 resources
                formatted_resource = f"""
RESOURCE: {resource['title']}
SUBJECT: {resource['subject']}
GRADE: {resource['grade']}
DESCRIPTION: {resource['description']}
"""
                formatted_resources.append(formatted_resource)
            
            return "\n".join(formatted_resources)
            
        except Exception as e:
            print(f"Error searching resource content: {e}")
            return ""

    async def _search_lesson_content(self, question: str, user_id: str, subject_area: str = None, grade_level: str = None) -> str:
        """Search through user's lesson plans for relevant content"""
        try:
            # Build query for lessons
            query = {"created_by": user_id}
            
            if subject_area:
                query["subject_area"] = subject_area
            if grade_level:
                query["grade_level"] = grade_level
            
            # Search lessons
            lessons_cursor = self.db.lessons.find(query).limit(2)
            
            question_keywords = set(question.lower().split())
            relevant_lessons = []
            
            async for lesson in lessons_cursor:
                title = lesson.get("title", "")
                topic = lesson.get("topic", "")
                overview = lesson.get("lesson_overview", "")
                
                # Simple keyword matching
                relevance_score = 0
                if any(keyword in title.lower() for keyword in question_keywords):
                    relevance_score += 2
                if any(keyword in topic.lower() for keyword in question_keywords):
                    relevance_score += 2
                if overview and any(keyword in overview.lower() for keyword in question_keywords):
                    relevance_score += 1
                
                if relevance_score > 0:
                    relevant_lessons.append({
                        "title": title,
                        "topic": topic,
                        "overview": overview[:200] + "..." if len(overview) > 200 else overview,
                        "objectives": lesson.get("learning_objectives", [])[:2],  # Top 2 objectives
                        "relevance": relevance_score
                    })
            
            if not relevant_lessons:
                return ""
            
            # Sort by relevance
            relevant_lessons.sort(key=lambda x: x["relevance"], reverse=True)
            
            formatted_lessons = []
            for lesson in relevant_lessons:
                formatted_lesson = f"""
LESSON: {lesson['title']}
TOPIC: {lesson['topic']}
OVERVIEW: {lesson['overview']}
OBJECTIVES: {', '.join(lesson['objectives'])}
"""
                formatted_lessons.append(formatted_lesson)
            
            return "\n".join(formatted_lessons)
            
        except Exception as e:
            print(f"Error searching lesson content: {e}")
            return ""

    def _calculate_confidence_score(self, question: str, context: str, answer: str) -> float:
        """Calculate confidence score based on question complexity, context quality, and answer length"""
        base_confidence = 0.7
        
        # Boost confidence if we have relevant context
        if context and len(context) > 100:
            base_confidence += 0.2
        
        # Boost confidence for detailed answers
        if len(answer) > 200:
            base_confidence += 0.1
        
        # Reduce confidence for very short answers unless they're direct
        if len(answer) < 50:
            base_confidence -= 0.2
        
        return min(max(base_confidence, 0.1), 1.0)

    async def _get_context_sources(self, user_id: str, question: str) -> List[Dict[str, Any]]:
        """Get sources that were used to answer the question"""
        sources = []
        
        try:
            # Get recent notes
            notes_cursor = self.db.notes.find({"generated_by": user_id}).sort("created_at", -1).limit(3)
            async for note in notes_cursor:
                sources.append({
                    "type": "note",
                    "id": str(note["_id"]),
                    "title": note.get("resource_title", "Generated Notes"),
                    "subject": note.get("subject_area", ""),
                    "created_at": note.get("created_at", "")
                })
            
            # Get recent resources
            resources_cursor = self.db.resources.find({"created_by": user_id}).sort("created_at", -1).limit(2)  # Note: might be author_id
            async for resource in resources_cursor:
                sources.append({
                    "type": "resource",
                    "id": str(resource["_id"]),
                    "title": resource.get("title", ""),
                    "subject": resource.get("subject_area", ""),
                    "created_at": resource.get("created_at", "")
                })
                
        except Exception as e:
            print(f"Error getting context sources: {e}")
        
        return sources

    async def _generate_follow_up_suggestions(self, question: str, answer: str, subject_area: str = None) -> List[str]:
        """Generate helpful follow-up questions and suggestions"""
        suggestions = [
            "Ask about specific examples or applications",
            "Request more detailed explanations of key concepts",
            "Ask how to apply this to different grade levels"
        ]
        
        if subject_area:
            suggestions.append(f"Explore related {subject_area} topics")
        
        # Add context-specific suggestions based on question content
        if "lesson" in question.lower():
            suggestions.append("Ask about assessment strategies for this lesson")
            suggestions.append("Request activities for different learning styles")
        
        if "explain" in question.lower() or "what is" in question.lower():
            suggestions.append("Ask for real-world examples")
            suggestions.append("Request practice exercises or activities")
        
        return suggestions

    async def _find_related_lessons(self, question: str) -> List[str]:
        """Find lessons related to the question using semantic search"""
        try:
            # Get question embedding
            question_embedding = self.embedding_model.encode([question])[0]
            
            # Simple keyword search as fallback
            keywords = question.lower().split()
            
            lessons_cursor = self.db.lessons.find({
                "$or": [
                    {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"topic": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"lesson_overview": {"$regex": "|".join(keywords), "$options": "i"}}
                ]
            }).limit(3)
            
            related_lessons = []
            async for lesson in lessons_cursor:
                related_lessons.append(str(lesson["_id"]))
            
            return related_lessons
            
        except Exception as e:
            print(f"Error finding related lessons: {e}")
            return []
    
    async def _find_related_resources(self, question: str) -> List[str]:
        """Find resources related to the question"""
        try:
            keywords = question.lower().split()
            
            resources_cursor = self.db.resources.find({
                "$or": [
                    {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"description": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"subject_area": {"$regex": "|".join(keywords), "$options": "i"}}
                ]
            }).limit(5)
            
            related_resources = []
            async for resource in resources_cursor:
                related_resources.append(str(resource["_id"]))
            
            return related_resources
            
        except Exception as e:
            print(f"Error finding related resources: {e}")
            return []
    
    async def generate_comprehensive_notes(
        self, 
        content: str, 
        resource_metadata: Dict[str, Any],
        notes_type: str = "detailed",
        focus_areas: List[str] = None,
        additional_instructions: str = ""
    ) -> Dict[str, Any]:
        """
        Generate comprehensive, detailed notes using OpenRouter AI
        """
        try:
            title = resource_metadata.get('title', 'Unknown Resource')
            subject = resource_metadata.get('subject_area', 'General Studies')
            grade_level = resource_metadata.get('grade_level', 'All Levels')
            resource_type = resource_metadata.get('resource_type', 'document')
            
            # Build the AI prompt for comprehensive note generation
            focus_text = f" Focus particularly on: {', '.join(focus_areas)}." if focus_areas else ""
            additional_text = f" Additional requirements: {additional_instructions}" if additional_instructions else ""
            
            prompt = f"""
You are an expert educational content analyzer and note generator. Please analyze the following {resource_type} content titled "{title}" for {grade_level} students in {subject} and generate comprehensive, detailed study notes.

CONTENT TO ANALYZE:
{content[:8000]}  # Limit content to avoid token limits

REQUIREMENTS:
1. Create a comprehensive summary (200-300 words)
2. Extract 10-15 key concepts with detailed explanations
3. Identify important vocabulary terms with definitions
4. Generate 8-10 study questions ranging from basic to advanced
5. Create practical applications and examples
6. Suggest connections to related topics
7. Include memory aids and study tips
{focus_text}{additional_text}

Please structure your response as a JSON object with the following format:
{{
    "summary": "Comprehensive summary of the content...",
    "key_concepts": [
        {{"concept": "Concept name", "explanation": "Detailed explanation..."}},
        ...
    ],
    "vocabulary": [
        {{"term": "Term", "definition": "Clear definition..."}},
        ...
    ],
    "study_questions": [
        {{"question": "Question text", "type": "factual|analytical|application", "difficulty": "basic|intermediate|advanced"}},
        ...
    ],
    "practical_applications": [
        "Real-world application example...",
        ...
    ],
    "related_topics": [
        "Related topic or concept...",
        ...
    ],
    "study_tips": [
        "Memory aid or study strategy...",
        ...
    ],
    "detailed_content": "Expanded analysis with additional insights..."
}}

Make the notes as detailed and educationally valuable as possible for {grade_level} students studying {subject}.
"""

            # Call OpenRouter AI with better error handling
            print(f"Calling OpenRouter API with model: {self.primary_model}")
            print(f"API Key configured: {'Yes' if os.getenv('OPENROUTER_API_KEY') else 'No'}")
            
            try:
                response = await self.client.chat.completions.create(
                    model=self.primary_model,
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are an expert educational content analyst specializing in creating detailed, comprehensive study notes for students. Always respond with valid JSON."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,  # Lower temperature for more consistent educational content
                    max_tokens=4000,
                    timeout=60
                )
                print("OpenRouter API call successful")
            except Exception as api_error:
                print(f"OpenRouter API Error Details: {type(api_error).__name__}: {str(api_error)}")
                
                # Try backup model if primary fails
                if hasattr(api_error, 'status_code') and api_error.status_code == 401:
                    print("401 error - API key issue. Trying backup model...")
                    try:
                        response = await self.client.chat.completions.create(
                            model=self.backup_model,
                            messages=[
                                {
                                    "role": "system", 
                                    "content": "You are an expert educational content analyst. Create detailed study notes."
                                },
                                {"role": "user", "content": prompt}
                            ],
                            temperature=0.3,
                            max_tokens=2000,
                            timeout=30
                        )
                        print(f"Backup model {self.backup_model} successful")
                    except Exception as backup_error:
                        print(f"Backup model also failed: {backup_error}")
                        raise api_error
                else:
                    raise api_error
            
            if not response.choices:
                raise Exception("No response from AI model")
            
            # Parse the AI response
            ai_content = response.choices[0].message.content.strip()
            
            # Try to parse as JSON
            try:
                notes_data = json.loads(ai_content)
            except json.JSONDecodeError:
                # Fallback: extract JSON from response if it's wrapped in text
                import re
                json_match = re.search(r'\{.*\}', ai_content, re.DOTALL)
                if json_match:
                    notes_data = json.loads(json_match.group())
                else:
                    # Final fallback: create structured response from text
                    notes_data = {
                        "summary": ai_content[:500] + "...",
                        "key_concepts": [{"concept": "AI-Generated Content", "explanation": ai_content[:1000]}],
                        "vocabulary": [{"term": "Analysis", "definition": "AI-generated content analysis"}],
                        "study_questions": [{"question": "What are the main points covered?", "type": "analytical", "difficulty": "intermediate"}],
                        "practical_applications": ["Review the AI-generated content for insights"],
                        "related_topics": [subject],
                        "study_tips": ["Use AI-generated notes as a starting point for deeper study"],
                        "detailed_content": ai_content
                    }
            
            # Ensure all required fields exist with defaults
            return {
                "summary": notes_data.get("summary", f"Comprehensive notes for {title}"),
                "key_points": [
                    f"{item.get('concept', 'Key Point')}: {item.get('explanation', 'Detailed explanation')}"
                    for item in notes_data.get("key_concepts", [])
                ][:10],
                "vocabulary": [
                    item.get('term', 'Term') for item in notes_data.get("vocabulary", [])
                ][:15],
                "questions": [
                    item.get('question', 'Study question') 
                    for item in notes_data.get("study_questions", [])
                ][:8],
                "detailed_content": f"""
COMPREHENSIVE ANALYSIS OF: {title}

SUMMARY:
{notes_data.get("summary", "No summary available")}

KEY CONCEPTS:
{chr(10).join([f"• {item.get('concept', 'Concept')}: {item.get('explanation', 'Explanation')}" for item in notes_data.get("key_concepts", [])])}

VOCABULARY TERMS:
{chr(10).join([f"• {item.get('term', 'Term')}: {item.get('definition', 'Definition')}" for item in notes_data.get("vocabulary", [])])}

PRACTICAL APPLICATIONS:
{chr(10).join([f"• {app}" for app in notes_data.get("practical_applications", [])])}

RELATED TOPICS:
{chr(10).join([f"• {topic}" for topic in notes_data.get("related_topics", [])])}

STUDY TIPS:
{chr(10).join([f"• {tip}" for tip in notes_data.get("study_tips", [])])}
""",
                "ai_enhanced": True,
                "model_used": self.primary_model
            }
            
        except Exception as e:
            print(f"Error generating AI notes: {e}")
            # Fallback to basic note generation
            return {
                "summary": f"Analysis of {resource_metadata.get('title', 'resource')} in {resource_metadata.get('subject_area', 'general studies')}",
                "key_points": ["AI note generation temporarily unavailable", "Content analysis in progress"],
                "vocabulary": ["analysis", "content", "study", "education"],
                "questions": ["What are the main concepts?", "How can this be applied?"],
                "detailed_content": content[:2000] + "..." if len(content) > 2000 else content,
                "ai_enhanced": False,
                "error": str(e)
            }

# Create singleton instance
openrouter_ai_service = OpenRouterAIService()