"""
Request models for the ML service API
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class ContentType(str, Enum):
    """Supported content types for processing"""
    CODE = "code"
    MARKDOWN = "markdown"
    PDF = "pdf"
    TEXT = "text"
    URL = "url"
    HTML = "html"

class DifficultyLevel(str, Enum):
    """Difficulty levels for generated content"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class QuestionType(str, Enum):
    """Types of questions to generate"""
    DEFINITION = "definition"
    EXPLANATION = "explanation"
    CODE_REVIEW = "code_review"
    CONCEPT = "concept"
    PRACTICAL = "practical"

class GenerateCardsRequest(BaseModel):
    """Request model for card generation"""
    content: str
    content_type: ContentType
    difficulty_level: DifficultyLevel = DifficultyLevel.INTERMEDIATE
    max_cards: int = 10
    focus_areas: Optional[List[str]] = None
    programming_language: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        schema_extra = {
            "example": {
                "content": "const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);",
                "content_type": "code",
                "difficulty_level": "intermediate",
                "max_cards": 5,
                "focus_areas": ["recursion", "functions"],
                "programming_language": "javascript",
                "tags": ["javascript", "algorithms"]
            }
        }

class ProcessContentRequest(BaseModel):
    """Request model for content processing"""
    content: str
    content_type: ContentType
    extract_code: bool = True
    extract_concepts: bool = True
    programming_language: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "content": "# React Hooks\n\nReact Hooks allow you to use state and other React features without writing a class.",
                "content_type": "markdown",
                "extract_code": True,
                "extract_concepts": True
            }
        }

class EnhanceQuestionRequest(BaseModel):
    """Request model for question enhancement"""
    original_question: str
    context: Optional[str] = None
    target_difficulty: DifficultyLevel = DifficultyLevel.INTERMEDIATE
    question_type: QuestionType = QuestionType.CONCEPT
    programming_language: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "original_question": "What is React?",
                "context": "JavaScript library for building user interfaces",
                "target_difficulty": "intermediate",
                "question_type": "explanation",
                "programming_language": "javascript"
            }
        }