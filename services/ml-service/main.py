"""
Ankiniki ML Service - AI-powered flashcard generation microservice
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Ankiniki ML Service",
    description="AI-powered flashcard generation and content processing",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import services after app initialization to avoid circular imports
from services.card_generator import CardGeneratorService
from services.content_processor import ContentProcessorService
from services.question_enhancer import QuestionEnhancerService
from models.requests import (
    GenerateCardsRequest,
    ProcessContentRequest,
    EnhanceQuestionRequest
)
from models.responses import (
    GenerateCardsResponse,
    ProcessContentResponse,
    EnhanceQuestionResponse,
    HealthResponse
)

# Initialize services
card_generator = CardGeneratorService()
content_processor = ContentProcessorService()
question_enhancer = QuestionEnhancerService()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        services={
            "card_generator": "ready",
            "content_processor": "ready",
            "question_enhancer": "ready"
        }
    )

@app.post("/generate/cards", response_model=GenerateCardsResponse)
async def generate_cards(request: GenerateCardsRequest):
    """Generate flashcards from content using AI"""
    try:
        logger.info(f"Generating cards for content type: {request.content_type}")
        
        cards = await card_generator.generate_cards(
            content=request.content,
            content_type=request.content_type,
            difficulty_level=request.difficulty_level,
            max_cards=request.max_cards,
            focus_areas=request.focus_areas
        )
        
        return GenerateCardsResponse(
            success=True,
            cards=cards,
            total_generated=len(cards)
        )
        
    except Exception as e:
        logger.error(f"Error generating cards: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/content", response_model=ProcessContentResponse)
async def process_content(request: ProcessContentRequest):
    """Process and extract key information from various content types"""
    try:
        logger.info(f"Processing content type: {request.content_type}")
        
        processed = await content_processor.process_content(
            content=request.content,
            content_type=request.content_type,
            extract_code=request.extract_code,
            extract_concepts=request.extract_concepts
        )
        
        return ProcessContentResponse(
            success=True,
            processed_content=processed
        )
        
    except Exception as e:
        logger.error(f"Error processing content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/file")
async def process_file(file: UploadFile = File(...)):
    """Process uploaded file and extract content for flashcard generation"""
    try:
        logger.info(f"Processing uploaded file: {file.filename}")
        
        content = await file.read()
        
        processed = await content_processor.process_file(
            content=content,
            filename=file.filename,
            content_type=file.content_type
        )
        
        return {
            "success": True,
            "filename": file.filename,
            "processed_content": processed
        }
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhance/question", response_model=EnhanceQuestionResponse)
async def enhance_question(request: EnhanceQuestionRequest):
    """Enhance and improve existing questions using AI"""
    try:
        logger.info("Enhancing question with AI")
        
        enhanced = await question_enhancer.enhance_question(
            original_question=request.original_question,
            context=request.context,
            target_difficulty=request.target_difficulty,
            question_type=request.question_type
        )
        
        return EnhanceQuestionResponse(
            success=True,
            enhanced_question=enhanced
        )
        
    except Exception as e:
        logger.error(f"Error enhancing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/available")
async def get_available_models():
    """Get list of available AI models and their capabilities"""
    return {
        "text_generation": {
            "openai_gpt4": {
                "name": "GPT-4",
                "provider": "OpenAI",
                "capabilities": ["text_generation", "code_understanding", "question_enhancement"],
                "available": bool(os.getenv("OPENAI_API_KEY"))
            },
            "openai_gpt35": {
                "name": "GPT-3.5 Turbo",
                "provider": "OpenAI", 
                "capabilities": ["text_generation", "basic_code_understanding"],
                "available": bool(os.getenv("OPENAI_API_KEY"))
            }
        },
        "embeddings": {
            "sentence_transformers": {
                "name": "All-MiniLM-L6-v2",
                "provider": "Hugging Face",
                "capabilities": ["semantic_similarity", "content_clustering"],
                "available": True
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)