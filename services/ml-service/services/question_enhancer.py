"""
Question Enhancer Service - Improve questions using AI
"""

import openai
import os
import logging
from typing import Optional
from models.requests import DifficultyLevel, QuestionType
from models.responses import EnhancedQuestion

logger = logging.getLogger(__name__)

class QuestionEnhancerService:
    """Service for enhancing questions using AI"""
    
    def __init__(self):
        self.openai_client = None
        if os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.openai_client = openai
        
        self.enhancement_templates = self._load_enhancement_templates()
    
    def _load_enhancement_templates(self) -> dict:
        """Load templates for question enhancement"""
        return {
            "definition": {
                "template": "What is {concept} and how does it work?",
                "improvements": ["Added 'how it works' for deeper understanding"]
            },
            "explanation": {
                "template": "Explain {concept} and provide an example of its use.",
                "improvements": ["Added request for example", "Made more specific"]
            },
            "code_review": {
                "template": "What does this code do and what are its key components?",
                "improvements": ["Asked about components", "More analytical approach"]
            },
            "concept": {
                "template": "What is {concept} and why is it important in software development?",
                "improvements": ["Added importance context", "Connected to software development"]
            },
            "practical": {
                "template": "How would you implement {concept} in a real-world scenario?",
                "improvements": ["Made practical", "Added real-world context"]
            }
        }
    
    async def enhance_question(
        self,
        original_question: str,
        context: Optional[str] = None,
        target_difficulty: DifficultyLevel = DifficultyLevel.INTERMEDIATE,
        question_type: QuestionType = QuestionType.CONCEPT,
        programming_language: Optional[str] = None
    ) -> EnhancedQuestion:
        """Enhance a question using AI or templates"""
        
        try:
            if self.openai_client and os.getenv("OPENAI_API_KEY"):
                return await self._enhance_with_ai(
                    original_question, context, target_difficulty, question_type, programming_language
                )
            else:
                logger.warning("OpenAI not available, using template enhancement")
                return await self._enhance_with_templates(
                    original_question, context, target_difficulty, question_type, programming_language
                )
        
        except Exception as e:
            logger.error(f"Error enhancing question: {str(e)}")
            # Fallback to basic enhancement
            return await self._enhance_with_templates(
                original_question, context, target_difficulty, question_type, programming_language
            )
    
    async def _enhance_with_ai(
        self,
        original_question: str,
        context: Optional[str],
        target_difficulty: DifficultyLevel,
        question_type: QuestionType,
        programming_language: Optional[str]
    ) -> EnhancedQuestion:
        """Enhance question using OpenAI"""
        
        system_prompt = f"""You are an expert educator specializing in software engineering and programming concepts.
Your task is to improve questions to make them more effective for learning.

Guidelines:
- Target difficulty: {target_difficulty}
- Question type: {question_type}
- Programming language focus: {programming_language or 'general'}
- Make questions specific and actionable
- Include context when helpful
- Ensure answers can be measured and validated

Return your response as JSON with this structure:
{{
  "enhanced_question": "The improved question",
  "improvements": ["list of specific improvements made"],
  "suggested_answer": "A complete answer to guide learning",
  "confidence_score": 0.95
}}"""
        
        user_prompt = f"""Original question: "{original_question}"
        
Context: {context or 'No additional context provided'}

Please enhance this question to be more effective for learning."""
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            return self._parse_ai_enhancement(response.choices[0].message.content, original_question)
            
        except Exception as e:
            logger.error(f"OpenAI API error in question enhancement: {str(e)}")
            raise
    
    async def _enhance_with_templates(
        self,
        original_question: str,
        context: Optional[str],
        target_difficulty: DifficultyLevel,
        question_type: QuestionType,
        programming_language: Optional[str]
    ) -> EnhancedQuestion:
        """Enhance question using templates"""
        
        enhanced_question = original_question
        improvements = []
        
        # Apply enhancements based on question type
        if question_type in self.enhancement_templates:
            template_info = self.enhancement_templates[question_type]
            
            # Try to extract key concept from original question
            concept = self._extract_concept(original_question)
            
            if concept:
                enhanced_question = template_info["template"].format(concept=concept)
                improvements.extend(template_info["improvements"])
            else:
                # Apply generic improvements
                enhanced_question = self._apply_generic_improvements(
                    original_question, target_difficulty, programming_language
                )
                improvements = self._get_generic_improvements(original_question, enhanced_question)
        
        # Generate suggested answer
        suggested_answer = self._generate_suggested_answer(
            enhanced_question, context, programming_language
        )
        
        return EnhancedQuestion(
            original_question=original_question,
            enhanced_question=enhanced_question,
            improvements=improvements,
            suggested_answer=suggested_answer,
            confidence_score=0.75  # Template-based has lower confidence than AI
        )
    
    def _extract_concept(self, question: str) -> Optional[str]:
        """Extract main concept from question"""
        # Look for patterns like "What is X?" or "What does X do?"
        import re
        
        patterns = [
            r"What is (\w+)",
            r"What does (\w+)",
            r"How does (\w+)",
            r"Explain (\w+)",
            r"Define (\w+)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, question, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _apply_generic_improvements(
        self,
        question: str,
        difficulty: DifficultyLevel,
        language: Optional[str]
    ) -> str:
        """Apply generic improvements to any question"""
        
        enhanced = question
        
        # Add context if programming language is specified
        if language and language.lower() not in question.lower():
            if "?" in enhanced:
                enhanced = enhanced.replace("?", f" in {language}?")
            else:
                enhanced += f" in {language}"
        
        # Add depth based on difficulty
        if difficulty == DifficultyLevel.ADVANCED:
            if "Why" not in enhanced and "How" not in enhanced:
                enhanced = enhanced.replace("What", "What and why", 1)
        
        # Make more specific if too vague
        vague_terms = ["this", "that", "it"]
        for term in vague_terms:
            if term in enhanced.lower() and "code" not in enhanced.lower():
                enhanced = enhanced.replace(term, "this concept", 1)
        
        return enhanced
    
    def _get_generic_improvements(self, original: str, enhanced: str) -> list:
        """Identify improvements made between original and enhanced questions"""
        improvements = []
        
        if len(enhanced) > len(original):
            improvements.append("Added more specific details")
        
        if "in " in enhanced and "in " not in original:
            improvements.append("Added programming language context")
        
        if "why" in enhanced.lower() and "why" not in original.lower():
            improvements.append("Added 'why' for deeper understanding")
        
        if "how" in enhanced.lower() and "how" not in original.lower():
            improvements.append("Added 'how' for practical understanding")
        
        if not improvements:
            improvements.append("Applied basic question enhancement")
        
        return improvements
    
    def _generate_suggested_answer(
        self,
        question: str,
        context: Optional[str],
        language: Optional[str]
    ) -> str:
        """Generate a suggested answer for the enhanced question"""
        
        # Basic template-based answer generation
        if context:
            return f"Based on the context: {context}. This concept is important because..."
        elif language:
            return f"In {language}, this refers to... (detailed explanation would be provided)"
        else:
            return "This concept involves... (detailed explanation would be enhanced with AI)"
    
    def _parse_ai_enhancement(self, response: str, original_question: str) -> EnhancedQuestion:
        """Parse AI response into EnhancedQuestion object"""
        try:
            import json
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                
                return EnhancedQuestion(
                    original_question=original_question,
                    enhanced_question=data.get('enhanced_question', original_question),
                    improvements=data.get('improvements', []),
                    suggested_answer=data.get('suggested_answer', ''),
                    confidence_score=data.get('confidence_score', 0.8)
                )
            else:
                # If no JSON found, treat entire response as enhanced question
                return EnhancedQuestion(
                    original_question=original_question,
                    enhanced_question=response.strip(),
                    improvements=["Enhanced with AI assistance"],
                    suggested_answer="AI-generated enhancement provided",
                    confidence_score=0.7
                )
                
        except Exception as e:
            logger.error(f"Failed to parse AI enhancement response: {str(e)}")
            return EnhancedQuestion(
                original_question=original_question,
                enhanced_question=original_question,
                improvements=["Enhancement parsing failed"],
                suggested_answer="Enhancement not available",
                confidence_score=0.5
            )