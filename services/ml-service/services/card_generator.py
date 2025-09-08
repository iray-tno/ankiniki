"""
Card Generator Service - AI-powered flashcard generation
"""

import openai
import os
import json
import re
from typing import List, Dict, Any, Optional
from models.requests import ContentType, DifficultyLevel
from models.responses import GeneratedCard
import logging

logger = logging.getLogger(__name__)

class CardGeneratorService:
    """Service for generating flashcards using AI"""
    
    def __init__(self):
        self.openai_client = None
        if os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.openai_client = openai
        
        self.fallback_templates = self._load_fallback_templates()
    
    def _load_fallback_templates(self) -> Dict[str, List[Dict[str, str]]]:
        """Load fallback templates for when AI is not available"""
        return {
            "code": [
                {
                    "front_template": "What does this {language} code do?\n\n```{language}\n{code}\n```",
                    "back_template": "This code {explanation}"
                },
                {
                    "front_template": "Explain the purpose of this {language} function:",
                    "back_template": "The function {explanation}"
                }
            ],
            "text": [
                {
                    "front_template": "What is {concept}?",
                    "back_template": "{definition}"
                },
                {
                    "front_template": "Explain the concept of {concept}:",
                    "back_template": "{explanation}"
                }
            ]
        }
    
    async def generate_cards(
        self,
        content: str,
        content_type: ContentType,
        difficulty_level: DifficultyLevel = DifficultyLevel.INTERMEDIATE,
        max_cards: int = 10,
        focus_areas: Optional[List[str]] = None,
        programming_language: Optional[str] = None
    ) -> List[GeneratedCard]:
        """Generate flashcards from content"""
        
        try:
            if self.openai_client and os.getenv("OPENAI_API_KEY"):
                return await self._generate_with_ai(
                    content, content_type, difficulty_level, max_cards, focus_areas, programming_language
                )
            else:
                logger.warning("OpenAI not available, using fallback generation")
                return await self._generate_with_fallback(
                    content, content_type, difficulty_level, max_cards, focus_areas, programming_language
                )
        
        except Exception as e:
            logger.error(f"Error in card generation: {str(e)}")
            # Fallback to template-based generation
            return await self._generate_with_fallback(
                content, content_type, difficulty_level, max_cards, focus_areas, programming_language
            )
    
    async def _generate_with_ai(
        self,
        content: str,
        content_type: ContentType,
        difficulty_level: DifficultyLevel,
        max_cards: int,
        focus_areas: Optional[List[str]],
        programming_language: Optional[str]
    ) -> List[GeneratedCard]:
        """Generate cards using OpenAI API"""
        
        system_prompt = self._build_system_prompt(content_type, difficulty_level, focus_areas, programming_language)
        user_prompt = self._build_user_prompt(content, max_cards)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return self._parse_ai_response(response.choices[0].message.content, programming_language)
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    async def _generate_with_fallback(
        self,
        content: str,
        content_type: ContentType,
        difficulty_level: DifficultyLevel,
        max_cards: int,
        focus_areas: Optional[List[str]],
        programming_language: Optional[str]
    ) -> List[GeneratedCard]:
        """Generate cards using template-based approach"""
        
        cards = []
        
        if content_type == ContentType.CODE:
            cards.extend(self._generate_code_cards(content, programming_language, max_cards))
        elif content_type == ContentType.TEXT or content_type == ContentType.MARKDOWN:
            cards.extend(self._generate_text_cards(content, max_cards))
        
        return cards[:max_cards]
    
    def _generate_code_cards(self, code: str, language: str, max_cards: int) -> List[GeneratedCard]:
        """Generate cards from code using templates"""
        cards = []
        
        # Basic code explanation card
        cards.append(GeneratedCard(
            front=f"What does this {language or 'code'} do?\n\n```{language or 'text'}\n{code.strip()}\n```",
            back="This code performs a specific function. (Enhanced explanation would be generated with AI)",
            tags=[language or "code", "programming"],
            difficulty="intermediate",
            confidence_score=0.7,
            metadata={
                "programming_language": language,
                "content_type": "code",
                "generation_method": "template"
            }
        ))
        
        # Look for function definitions
        function_patterns = [
            r'function\s+(\w+)',  # JavaScript functions
            r'def\s+(\w+)',       # Python functions
            r'(\w+)\s*\(',        # General function calls
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, code)
            for match in matches[:max_cards-len(cards)]:
                cards.append(GeneratedCard(
                    front=f"What is the purpose of the function '{match}'?",
                    back=f"The function '{match}' is defined in the provided code to perform a specific task.",
                    tags=[language or "code", "functions", match],
                    difficulty="intermediate", 
                    confidence_score=0.6,
                    metadata={
                        "function_name": match,
                        "programming_language": language,
                        "generation_method": "pattern_match"
                    }
                ))
        
        return cards
    
    def _generate_text_cards(self, text: str, max_cards: int) -> List[GeneratedCard]:
        """Generate cards from text using templates"""
        cards = []
        
        # Split into sentences and look for definitions
        sentences = text.split('.')
        
        for sentence in sentences[:max_cards]:
            sentence = sentence.strip()
            if len(sentence) > 10:
                # Look for definition patterns
                if ' is ' in sentence.lower() or ' are ' in sentence.lower():
                    parts = re.split(r' is | are ', sentence, 1, re.IGNORECASE)
                    if len(parts) == 2:
                        concept = parts[0].strip()
                        definition = parts[1].strip()
                        
                        cards.append(GeneratedCard(
                            front=f"What {concept.lower()}?",
                            back=definition,
                            tags=["concept", "definition"],
                            difficulty="intermediate",
                            confidence_score=0.65,
                            metadata={
                                "concept": concept,
                                "generation_method": "definition_pattern"
                            }
                        ))
        
        return cards
    
    def _build_system_prompt(
        self,
        content_type: ContentType,
        difficulty_level: DifficultyLevel,
        focus_areas: Optional[List[str]],
        programming_language: Optional[str]
    ) -> str:
        """Build system prompt for AI"""
        
        base_prompt = """You are an expert at creating educational flashcards for software engineers and developers. 
        Your task is to generate high-quality flashcards that help people learn and retain technical knowledge."""
        
        if content_type == ContentType.CODE:
            base_prompt += f"""
            
Focus on code understanding, patterns, and practical applications.
Programming language: {programming_language or 'auto-detect'}
Generate questions about:
- What the code does
- How it works
- When to use similar patterns
- Potential improvements or issues"""
        
        if focus_areas:
            base_prompt += f"\n\nPay special attention to these topics: {', '.join(focus_areas)}"
        
        base_prompt += f"""

Difficulty level: {difficulty_level}
Return your response as a JSON array of objects with this structure:
{{
  "front": "Question text (can include code blocks)",
  "back": "Answer text",
  "tags": ["tag1", "tag2"],
  "confidence_score": 0.95
}}"""
        
        return base_prompt
    
    def _build_user_prompt(self, content: str, max_cards: int) -> str:
        """Build user prompt with content"""
        return f"""Generate {max_cards} flashcards from this content:

{content}

Return only the JSON array, no additional text."""
    
    def _parse_ai_response(self, response: str, programming_language: Optional[str]) -> List[GeneratedCard]:
        """Parse AI response into GeneratedCard objects"""
        try:
            # Clean the response to extract JSON
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                cards_data = json.loads(json_str)
                
                cards = []
                for card_data in cards_data:
                    cards.append(GeneratedCard(
                        front=card_data.get('front', ''),
                        back=card_data.get('back', ''),
                        tags=card_data.get('tags', []),
                        difficulty="intermediate",
                        confidence_score=card_data.get('confidence_score', 0.8),
                        metadata={
                            "programming_language": programming_language,
                            "generation_method": "ai",
                            "model": "gpt-3.5-turbo"
                        }
                    ))
                
                return cards
            else:
                logger.error("No JSON found in AI response")
                return []
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response JSON: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return []