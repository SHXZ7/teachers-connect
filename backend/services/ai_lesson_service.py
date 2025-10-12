import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from models.lesson_model import (
    LessonGenerationRequest, GeneratedLesson, LessonSection, 
    QuestionRequest, AIResponse, DifficultyLevel, LessonType
)
from models.resource_model import ResourceInDB
from database import get_database
import PyPDF2
import io
import base64

class AILessonService:
    def __init__(self):
        self.db = get_database()
        
    async def extract_text_from_resource(self, resource_id: str) -> str:
        """Extract text content from uploaded resource file"""
        try:
            resource = await self.db.resources.find_one({"_id": resource_id})
            if not resource:
                return ""
            
            file_path = resource.get("file_path", "")
            file_type = resource.get("file_type", "").lower()
            
            # For now, we'll simulate text extraction
            # In production, you'd implement actual file parsing
            if file_type == "pdf":
                return f"Content from {resource.get('title', 'PDF file')}: This is educational content related to {resource.get('subject_area', '')} for {resource.get('grade_level', '')} students."
            elif file_type in ["doc", "docx"]:
                return f"Document content from {resource.get('title', 'Document')}: Educational material covering topics in {resource.get('subject_area', '')}."
            elif file_type == "txt":
                return f"Text content from {resource.get('title', 'Text file')}: Learning materials for {resource.get('grade_level', '')} level."
            else:
                return f"Content from {resource.get('title', 'File')}: Educational resource about {resource.get('description', '')}."
                
        except Exception as e:
            print(f"Error extracting text from resource {resource_id}: {e}")
            return ""
    
    async def get_resource_context(self, resource_ids: List[str]) -> str:
        """Get context from selected resources"""
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
                    
                    # Extract file content
                    file_content = await self.extract_text_from_resource(resource_id)
                    
                    context_part = f"""
Resource: {title}
Subject: {subject.replace('_', ' ').title()}
Grade Level: {grade.replace('_', ' ').title()}
Description: {description}
Content: {file_content}
---
"""
                    context_parts.append(context_part)
                    
            except Exception as e:
                print(f"Error getting context from resource {resource_id}: {e}")
                continue
        
        return "\n".join(context_parts)
    
    def generate_lesson_structure(self, request: LessonGenerationRequest, resource_context: str = "") -> GeneratedLesson:
        """Generate a structured lesson plan using AI-like logic"""
        
        # Create learning objectives if not provided
        if not request.learning_objectives:
            objectives = self._generate_learning_objectives(request.topic, request.grade_level, request.subject_area)
        else:
            objectives = request.learning_objectives
        
        # Generate lesson sections based on duration and type
        sections = self._generate_lesson_sections(request, resource_context)
        
        # Generate assessment methods
        assessments = self._generate_assessments(request.lesson_type, request.difficulty)
        
        # Generate homework suggestions
        homework = self._generate_homework(request.topic, request.grade_level, request.difficulty)
        
        # Create lesson overview
        overview = self._generate_lesson_overview(request, objectives, resource_context)
        
        # Generate additional resources
        additional_resources = self._generate_additional_resources(request.topic, request.subject_area)
        
        lesson = GeneratedLesson(
            title=f"{request.topic} - {request.grade_level.replace('_', ' ').title()} {request.subject_area.replace('_', ' ').title()}",
            topic=request.topic,
            grade_level=request.grade_level,
            subject_area=request.subject_area,
            duration_minutes=request.duration_minutes,
            lesson_type=request.lesson_type,
            difficulty=request.difficulty,
            learning_objectives=objectives,
            lesson_overview=overview,
            sections=sections,
            assessment_methods=assessments,
            homework_suggestions=homework,
            additional_resources=additional_resources,
            generated_from_resources=request.selected_resources,
            created_by="",  # Will be set in the route
        )
        
        return lesson
    
    def _generate_learning_objectives(self, topic: str, grade_level: str, subject_area: str) -> List[str]:
        """Generate learning objectives based on topic and level"""
        grade_display = grade_level.replace('_', ' ').title()
        subject_display = subject_area.replace('_', ' ').title()
        
        objectives = [
            f"Students will understand the key concepts of {topic}",
            f"Students will be able to apply {topic} knowledge to solve problems",
            f"Students will demonstrate comprehension through practical exercises"
        ]
        
        # Add subject-specific objectives
        if "math" in subject_area.lower():
            objectives.append("Students will solve mathematical problems using learned concepts")
        elif "science" in subject_area.lower():
            objectives.append("Students will conduct observations and analyze scientific phenomena")
        elif "language" in subject_area.lower():
            objectives.append("Students will improve reading, writing, and communication skills")
        elif "social" in subject_area.lower():
            objectives.append("Students will analyze historical events and cultural contexts")
        
        return objectives
    
    def _generate_lesson_sections(self, request: LessonGenerationRequest, resource_context: str) -> List[LessonSection]:
        """Generate lesson sections based on duration and type"""
        sections = []
        
        # Calculate time allocation
        total_minutes = request.duration_minutes
        
        if request.lesson_type == LessonType.LECTURE:
            sections = [
                LessonSection(
                    title="Introduction & Warm-up",
                    content=f"Begin with a brief review of previous concepts and introduce today's topic: {request.topic}. Engage students with thought-provoking questions.",
                    duration_minutes=int(total_minutes * 0.15),
                    activities=["Opening discussion", "Quick review quiz", "Topic introduction"],
                    materials_needed=["Whiteboard", "Markers", "Handouts"]
                ),
                LessonSection(
                    title="Main Content Delivery",
                    content=f"Present the core concepts of {request.topic}. Use examples, diagrams, and real-world applications to illustrate key points." + 
                           (f"\n\nReference materials from uploaded resources:\n{resource_context[:200]}..." if resource_context else ""),
                    duration_minutes=int(total_minutes * 0.6),
                    activities=["Lecture presentation", "Interactive examples", "Q&A session"],
                    materials_needed=["Presentation slides", "Projector", "Student handouts"]
                ),
                LessonSection(
                    title="Practice & Application",
                    content=f"Students work on guided practice exercises related to {request.topic}. Provide immediate feedback and clarification.",
                    duration_minutes=int(total_minutes * 0.2),
                    activities=["Guided practice", "Peer collaboration", "Individual work"],
                    materials_needed=["Worksheets", "Calculators", "Reference materials"]
                ),
                LessonSection(
                    title="Conclusion & Wrap-up",
                    content="Summarize key learning points, address any remaining questions, and preview the next lesson.",
                    duration_minutes=int(total_minutes * 0.05),
                    activities=["Summary discussion", "Exit ticket", "Homework assignment"],
                    materials_needed=["Exit tickets", "Homework sheets"]
                )
            ]
        
        elif request.lesson_type == LessonType.WORKSHOP:
            sections = [
                LessonSection(
                    title="Workshop Introduction",
                    content=f"Set up the workshop environment and explain the hands-on activities for {request.topic}.",
                    duration_minutes=int(total_minutes * 0.1),
                    activities=["Setup explanation", "Safety briefing", "Group formation"],
                    materials_needed=["Workshop materials", "Safety equipment", "Instructions"]
                ),
                LessonSection(
                    title="Hands-on Activity",
                    content=f"Students engage in practical work related to {request.topic}. Facilitate learning through doing." + 
                           (f"\n\nUsing guidelines from resources:\n{resource_context[:150]}..." if resource_context else ""),
                    duration_minutes=int(total_minutes * 0.7),
                    activities=["Practical work", "Experimentation", "Problem-solving"],
                    materials_needed=["Lab equipment", "Tools", "Materials", "Instruction sheets"]
                ),
                LessonSection(
                    title="Reflection & Sharing",
                    content="Students reflect on their work and share findings with the class.",
                    duration_minutes=int(total_minutes * 0.2),
                    activities=["Group presentations", "Peer feedback", "Reflection discussion"],
                    materials_needed=["Presentation space", "Feedback forms"]
                )
            ]
        
        else:  # Default structure for other lesson types
            sections = [
                LessonSection(
                    title="Opening",
                    content=f"Introduction to {request.topic} and lesson objectives.",
                    duration_minutes=int(total_minutes * 0.15),
                    activities=["Greeting", "Objective review", "Motivation"],
                    materials_needed=["Lesson plan", "Materials list"]
                ),
                LessonSection(
                    title="Main Activity",
                    content=f"Core learning activities for {request.topic}." + 
                           (f"\n\nBased on resources:\n{resource_context[:200]}..." if resource_context else ""),
                    duration_minutes=int(total_minutes * 0.65),
                    activities=["Main learning tasks", "Student interaction", "Guided practice"],
                    materials_needed=["Learning materials", "Student worksheets"]
                ),
                LessonSection(
                    title="Closure",
                    content="Wrap up the lesson and assign follow-up work.",
                    duration_minutes=int(total_minutes * 0.2),
                    activities=["Summary", "Assessment", "Homework assignment"],
                    materials_needed=["Assessment tools", "Homework materials"]
                )
            ]
        
        return sections
    
    def _generate_assessments(self, lesson_type: LessonType, difficulty: DifficultyLevel) -> List[str]:
        """Generate appropriate assessment methods"""
        assessments = []
        
        if difficulty == DifficultyLevel.BEGINNER:
            assessments = [
                "Simple multiple-choice questions",
                "True/false statements",
                "Basic recall questions",
                "Matching activities"
            ]
        elif difficulty == DifficultyLevel.INTERMEDIATE:
            assessments = [
                "Short answer questions",
                "Problem-solving exercises",
                "Application-based scenarios",
                "Peer assessment activities"
            ]
        else:  # Advanced
            assessments = [
                "Complex problem-solving tasks",
                "Critical analysis assignments",
                "Project-based evaluation",
                "Presentation assessments"
            ]
        
        if lesson_type == LessonType.WORKSHOP:
            assessments.extend(["Practical skill demonstration", "Product evaluation"])
        elif lesson_type == LessonType.DISCUSSION:
            assessments.extend(["Participation rubric", "Discussion quality assessment"])
        
        return assessments
    
    def _generate_homework(self, topic: str, grade_level: str, difficulty: DifficultyLevel) -> List[str]:
        """Generate homework suggestions"""
        homework = [
            f"Review notes on {topic} and complete practice exercises",
            f"Research additional examples of {topic} in real life",
            "Prepare questions for next class discussion"
        ]
        
        if difficulty == DifficultyLevel.BEGINNER:
            homework.append("Complete basic worksheets to reinforce understanding")
        elif difficulty == DifficultyLevel.INTERMEDIATE:
            homework.append("Solve practice problems and prepare a brief summary")
        else:  # Advanced
            homework.append("Conduct independent research and prepare a presentation")
        
        return homework
    
    def _generate_lesson_overview(self, request: LessonGenerationRequest, objectives: List[str], resource_context: str) -> str:
        """Generate a comprehensive lesson overview"""
        overview = f"""
This {request.duration_minutes}-minute {request.lesson_type.value} focuses on {request.topic} for {request.grade_level.replace('_', ' ')} students in {request.subject_area.replace('_', ' ')}.

The lesson is designed at a {request.difficulty.value} level and aims to achieve the following learning objectives:
{chr(10).join([f"• {obj}" for obj in objectives])}

Students will engage in interactive learning activities that promote understanding and application of key concepts.
{"This lesson incorporates content and materials from uploaded educational resources to provide relevant, curated content." if resource_context else ""}

The lesson structure follows pedagogical best practices with clear introduction, development, and conclusion phases.
"""
        return overview.strip()
    
    def _generate_additional_resources(self, topic: str, subject_area: str) -> List[str]:
        """Generate suggestions for additional learning resources"""
        resources = [
            f"Online videos about {topic}",
            f"Interactive simulations for {subject_area.replace('_', ' ')}",
            f"Recommended textbook chapters on {topic}",
            "Educational websites and apps",
            "Library books related to the subject",
            "Hands-on activities and experiments"
        ]
        return resources
    
    async def answer_question(self, question_request: QuestionRequest) -> AIResponse:
        """Generate AI response to teacher questions using available resources"""
        
        # Get context based on request type
        context = ""
        sources = []
        
        if question_request.context_type == "lesson" and question_request.lesson_id:
            # Get lesson context
            lesson = await self.db.lessons.find_one({"_id": question_request.lesson_id})
            if lesson:
                context = f"Lesson: {lesson.get('title', '')}\nContent: {lesson.get('lesson_overview', '')}"
                sources.append({
                    "type": "lesson",
                    "id": question_request.lesson_id,
                    "title": lesson.get("title", "")
                })
        
        elif question_request.context_type == "resource" and question_request.resource_ids:
            # Get resource context
            context = await self.get_resource_context(question_request.resource_ids)
            for resource_id in question_request.resource_ids:
                resource = await self.db.resources.find_one({"_id": resource_id})
                if resource:
                    sources.append({
                        "type": "resource",
                        "id": resource_id,
                        "title": resource.get("title", "")
                    })
        
        # Generate AI response (simplified simulation)
        answer = self._generate_ai_answer(question_request.question, context)
        
        # Calculate confidence score (simplified)
        confidence = 0.8 if context else 0.6
        
        # Find related lessons and resources
        related_lessons = await self._find_related_lessons(question_request.question)
        suggested_resources = await self._find_related_resources(question_request.question)
        
        return AIResponse(
            answer=answer,
            confidence_score=confidence,
            sources=sources,
            related_lessons=related_lessons,
            suggested_resources=suggested_resources
        )
    
    def _generate_ai_answer(self, question: str, context: str) -> str:
        """Generate AI-like answer to question"""
        
        # Simple keyword-based response generation
        question_lower = question.lower()
        
        if any(word in question_lower for word in ["how", "what", "explain"]):
            if context:
                return f"Based on the available educational materials, here's what I can tell you:\n\n{context[:300]}...\n\nThis information should help answer your question about the topic. Would you like me to elaborate on any specific aspect?"
            else:
                return "I'd be happy to help explain that concept! To provide the most accurate and relevant answer, it would be helpful if you could specify which educational resources or lesson materials you'd like me to reference."
        
        elif any(word in question_lower for word in ["lesson", "plan", "teach"]):
            return f"For lesson planning on this topic, I recommend:\n\n1. Start with clear learning objectives\n2. Include interactive activities\n3. Use varied assessment methods\n4. Incorporate real-world examples\n\n{context[:200] if context else 'Consider uploading relevant resources to get more specific guidance.'}"
        
        elif any(word in question_lower for word in ["assessment", "test", "evaluate"]):
            return "For effective assessment, consider these approaches:\n\n• Formative assessments during the lesson\n• Summative evaluations at the end\n• Peer assessment activities\n• Self-reflection exercises\n\nThe specific assessment method should align with your learning objectives and student needs."
        
        else:
            return f"Thank you for your question. {'Based on the available resources, ' if context else ''}I can help you with various aspects of teaching and lesson planning. Could you provide more specific details about what you'd like to know?"
    
    async def _find_related_lessons(self, question: str) -> List[str]:
        """Find lessons related to the question"""
        try:
            # Simple keyword search in lesson titles and topics
            keywords = question.lower().split()
            
            lessons_cursor = self.db.lessons.find({
                "$or": [
                    {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"topic": {"$regex": "|".join(keywords), "$options": "i"}}
                ]
            }).limit(3)
            
            related_lessons = []
            async for lesson in lessons_cursor:
                related_lessons.append(str(lesson["_id"]))
            
            return related_lessons
        except:
            return []
    
    async def _find_related_resources(self, question: str) -> List[str]:
        """Find resources related to the question"""
        try:
            # Simple keyword search in resource titles and descriptions
            keywords = question.lower().split()
            
            resources_cursor = self.db.resources.find({
                "$or": [
                    {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                    {"description": {"$regex": "|".join(keywords), "$options": "i"}}
                ]
            }).limit(5)
            
            related_resources = []
            async for resource in resources_cursor:
                related_resources.append(str(resource["_id"]))
            
            return related_resources
        except:
            return []

# Create a singleton instance
ai_lesson_service = AILessonService()