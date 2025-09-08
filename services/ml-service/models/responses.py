"""
Response models for the ML service API
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GeneratedCard(BaseModel):
    """A generated flashcard"""
    front: str
    back: str
    tags: List[str]
    difficulty: str
    confidence_score: float
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        schema_extra = {
            "example": {
                "front": "What does this JavaScript function do?\n\n```javascript\nconst factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);\n```",
                "back": "This function calculates the factorial of a number using recursion. It returns 1 for n <= 1, otherwise it returns n multiplied by the factorial of (n-1).",
                "tags": ["javascript", "recursion", "functions"],
                "difficulty": "intermediate",
                "confidence_score": 0.92,
                "metadata": {
                    "programming_language": "javascript",
                    "code_type": "function",
                    "concepts": ["recursion", "mathematical_function"]
                }
            }
        }

class ProcessedContent(BaseModel):
    """Processed content with extracted information"""
    main_concepts: List[str]
    code_blocks: List[Dict[str, str]]
    key_terms: List[str]
    summary: str
    difficulty_estimate: str
    metadata: Dict[str, Any]

    class Config:
        schema_extra = {
            "example": {
                "main_concepts": ["React Hooks", "useState", "useEffect", "component state"],
                "code_blocks": [
                    {
                        "language": "javascript",
                        "code": "const [count, setCount] = useState(0);",
                        "explanation": "React Hook for managing component state"
                    }
                ],
                "key_terms": ["hooks", "state", "functional components"],
                "summary": "Introduction to React Hooks and state management",
                "difficulty_estimate": "intermediate",
                "metadata": {
                    "word_count": 150,
                    "estimated_reading_time": 2,
                    "topics": ["react", "javascript", "frontend"]
                }
            }
        }

class EnhancedQuestion(BaseModel):
    """An enhanced question with improvements"""
    original_question: str
    enhanced_question: str
    improvements: List[str]
    suggested_answer: str
    confidence_score: float

    class Config:
        schema_extra = {
            "example": {
                "original_question": "What is React?",
                "enhanced_question": "What is React and how does it differ from traditional DOM manipulation approaches in building user interfaces?",
                "improvements": [
                    "Added comparison aspect",
                    "Made question more specific",
                    "Increased depth of required answer"
                ],
                "suggested_answer": "React is a JavaScript library for building user interfaces that uses a virtual DOM and component-based architecture, unlike traditional DOM manipulation which directly modifies the browser's DOM.",
                "confidence_score": 0.89
            }
        }

class GenerateCardsResponse(BaseModel):
    """Response model for card generation"""
    success: bool
    cards: List[GeneratedCard]
    total_generated: int
    processing_time: Optional[float] = None
    error: Optional[str] = None

class ProcessContentResponse(BaseModel):
    """Response model for content processing"""
    success: bool
    processed_content: ProcessedContent
    processing_time: Optional[float] = None
    error: Optional[str] = None

class EnhanceQuestionResponse(BaseModel):
    """Response model for question enhancement"""
    success: bool
    enhanced_question: EnhancedQuestion
    processing_time: Optional[float] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    version: str
    services: Dict[str, str]
    uptime: Optional[float] = None