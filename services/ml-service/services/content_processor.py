"""
Content Processor Service - Extract and process content from various sources
"""

import re
import json
from typing import Dict, List, Any, Optional
import logging
from urllib.parse import urlparse
import PyPDF2
import io
from bs4 import BeautifulSoup
import markdown
from models.responses import ProcessedContent

logger = logging.getLogger(__name__)

class ContentProcessorService:
    """Service for processing various content types"""
    
    def __init__(self):
        self.code_patterns = self._load_code_patterns()
        self.concept_patterns = self._load_concept_patterns()
    
    def _load_code_patterns(self) -> Dict[str, str]:
        """Load regex patterns for different programming languages"""
        return {
            "javascript": {
                "functions": r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*{))',
                "classes": r'class\s+(\w+)',
                "variables": r'(?:const|let|var)\s+(\w+)',
                "imports": r'import\s+.*from\s+[\'"]([^\'"]+)[\'"]'
            },
            "python": {
                "functions": r'def\s+(\w+)',
                "classes": r'class\s+(\w+)',
                "variables": r'(\w+)\s*=',
                "imports": r'(?:from\s+(\w+)\s+import|import\s+(\w+))'
            },
            "typescript": {
                "interfaces": r'interface\s+(\w+)',
                "types": r'type\s+(\w+)',
                "functions": r'(?:function\s+(\w+)|(?:const|let)\s+(\w+)\s*:\s*.*=)',
                "classes": r'class\s+(\w+)'
            }
        }
    
    def _load_concept_patterns(self) -> List[str]:
        """Load patterns for identifying concepts"""
        return [
            r'(\w+)\s+is\s+(?:a|an)\s+([^.]+)',
            r'(\w+)\s+are\s+([^.]+)', 
            r'(?:The|A)\s+(\w+)\s+(?:pattern|principle|concept)',
            r'(\w+)\s+(?:refers to|means|represents)'
        ]
    
    async def process_content(
        self,
        content: str,
        content_type: str,
        extract_code: bool = True,
        extract_concepts: bool = True
    ) -> ProcessedContent:
        """Process content and extract key information"""
        
        try:
            if content_type == "markdown":
                return await self._process_markdown(content, extract_code, extract_concepts)
            elif content_type == "code":
                return await self._process_code(content, extract_concepts)
            elif content_type == "html":
                return await self._process_html(content, extract_code, extract_concepts)
            elif content_type == "text":
                return await self._process_text(content, extract_concepts)
            else:
                return await self._process_text(content, extract_concepts)
                
        except Exception as e:
            logger.error(f"Error processing content: {str(e)}")
            # Return basic processed content
            return ProcessedContent(
                main_concepts=[],
                code_blocks=[],
                key_terms=self._extract_key_terms(content),
                summary=content[:200] + "..." if len(content) > 200 else content,
                difficulty_estimate="intermediate",
                metadata={"error": str(e)}
            )
    
    async def process_file(
        self,
        content: bytes,
        filename: str,
        content_type: Optional[str] = None
    ) -> ProcessedContent:
        """Process uploaded file content"""
        
        try:
            if filename.endswith('.pdf'):
                text_content = self._extract_pdf_text(content)
                return await self.process_content(text_content, "text")
            
            elif filename.endswith(('.md', '.markdown')):
                text_content = content.decode('utf-8')
                return await self.process_content(text_content, "markdown")
            
            elif filename.endswith(('.py', '.js', '.ts', '.java', '.cpp')):
                text_content = content.decode('utf-8')
                return await self.process_content(text_content, "code")
            
            elif filename.endswith('.html'):
                text_content = content.decode('utf-8')
                return await self.process_content(text_content, "html")
            
            else:
                # Try to decode as text
                text_content = content.decode('utf-8')
                return await self.process_content(text_content, "text")
                
        except Exception as e:
            logger.error(f"Error processing file {filename}: {str(e)}")
            return ProcessedContent(
                main_concepts=[],
                code_blocks=[],
                key_terms=[],
                summary=f"Error processing file: {filename}",
                difficulty_estimate="unknown",
                metadata={"filename": filename, "error": str(e)}
            )
    
    async def _process_markdown(
        self,
        content: str,
        extract_code: bool,
        extract_concepts: bool
    ) -> ProcessedContent:
        """Process markdown content"""
        
        # Convert markdown to HTML for easier parsing
        html = markdown.markdown(content, extensions=['codehilite', 'fenced_code'])
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract code blocks
        code_blocks = []
        if extract_code:
            for code_block in soup.find_all('code'):
                code_text = code_block.get_text()
                language = self._detect_language(code_text)
                if len(code_text.strip()) > 10:  # Only meaningful code blocks
                    code_blocks.append({
                        "language": language,
                        "code": code_text,
                        "explanation": self._generate_code_explanation(code_text, language)
                    })
        
        # Extract text content
        text_content = soup.get_text()
        
        # Extract concepts
        concepts = []
        if extract_concepts:
            concepts = self._extract_concepts(text_content)
        
        # Extract headers as main concepts
        headers = [h.get_text() for h in soup.find_all(['h1', 'h2', 'h3'])]
        
        return ProcessedContent(
            main_concepts=list(set(concepts + headers)),
            code_blocks=code_blocks,
            key_terms=self._extract_key_terms(text_content),
            summary=self._generate_summary(text_content),
            difficulty_estimate=self._estimate_difficulty(text_content, code_blocks),
            metadata={
                "word_count": len(text_content.split()),
                "code_block_count": len(code_blocks),
                "header_count": len(headers)
            }
        )
    
    async def _process_code(self, content: str, extract_concepts: bool) -> ProcessedContent:
        """Process code content"""
        
        language = self._detect_language(content)
        
        # Extract code elements
        code_elements = self._extract_code_elements(content, language)
        
        # Create code blocks
        code_blocks = [{
            "language": language,
            "code": content,
            "explanation": self._generate_code_explanation(content, language)
        }]
        
        # Extract concepts from comments and names
        concepts = []
        if extract_concepts:
            concepts = self._extract_code_concepts(content, language)
        
        return ProcessedContent(
            main_concepts=concepts,
            code_blocks=code_blocks,
            key_terms=list(code_elements.keys()),
            summary=f"Code written in {language} with {len(code_elements)} identifiable elements",
            difficulty_estimate=self._estimate_code_difficulty(content, language),
            metadata={
                "programming_language": language,
                "elements": code_elements,
                "line_count": len(content.split('\n'))
            }
        )
    
    async def _process_html(
        self,
        content: str,
        extract_code: bool,
        extract_concepts: bool
    ) -> ProcessedContent:
        """Process HTML content"""
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract code blocks
        code_blocks = []
        if extract_code:
            for code_tag in soup.find_all(['code', 'pre']):
                code_text = code_tag.get_text()
                language = self._detect_language(code_text)
                if len(code_text.strip()) > 10:
                    code_blocks.append({
                        "language": language,
                        "code": code_text,
                        "explanation": self._generate_code_explanation(code_text, language)
                    })
        
        # Extract text content
        text_content = soup.get_text()
        
        # Extract concepts
        concepts = []
        if extract_concepts:
            concepts = self._extract_concepts(text_content)
        
        # Extract headers
        headers = [h.get_text() for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])]
        
        return ProcessedContent(
            main_concepts=list(set(concepts + headers)),
            code_blocks=code_blocks,
            key_terms=self._extract_key_terms(text_content),
            summary=self._generate_summary(text_content),
            difficulty_estimate=self._estimate_difficulty(text_content, code_blocks),
            metadata={
                "word_count": len(text_content.split()),
                "code_blocks": len(code_blocks),
                "headers": len(headers)
            }
        )
    
    async def _process_text(self, content: str, extract_concepts: bool) -> ProcessedContent:
        """Process plain text content"""
        
        concepts = []
        if extract_concepts:
            concepts = self._extract_concepts(content)
        
        return ProcessedContent(
            main_concepts=concepts,
            code_blocks=[],
            key_terms=self._extract_key_terms(content),
            summary=self._generate_summary(content),
            difficulty_estimate=self._estimate_difficulty(content, []),
            metadata={
                "word_count": len(content.split()),
                "character_count": len(content)
            }
        )
    
    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            return ""
    
    def _detect_language(self, code: str) -> str:
        """Detect programming language from code"""
        # Simple heuristics for language detection
        if 'def ' in code and ':' in code:
            return "python"
        elif 'function' in code or '=>' in code or 'const ' in code:
            return "javascript"
        elif 'interface ' in code or ': string' in code or ': number' in code:
            return "typescript"
        elif 'public class' in code or 'System.out' in code:
            return "java"
        elif '#include' in code or 'cout' in code:
            return "cpp"
        else:
            return "text"
    
    def _extract_code_elements(self, code: str, language: str) -> Dict[str, List[str]]:
        """Extract code elements based on language"""
        elements = {"functions": [], "classes": [], "variables": [], "imports": []}
        
        if language in self.code_patterns:
            patterns = self.code_patterns[language]
            
            for element_type, pattern in patterns.items():
                matches = re.findall(pattern, code)
                # Flatten tuples from regex groups
                flat_matches = []
                for match in matches:
                    if isinstance(match, tuple):
                        flat_matches.extend([m for m in match if m])
                    else:
                        flat_matches.append(match)
                
                elements[element_type] = flat_matches
        
        return elements
    
    def _extract_concepts(self, text: str) -> List[str]:
        """Extract concepts from text using patterns"""
        concepts = []
        
        for pattern in self.concept_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    concepts.extend([m.strip() for m in match if m.strip()])
                else:
                    concepts.append(match.strip())
        
        # Remove duplicates and filter out common words
        concepts = list(set(concepts))
        concepts = [c for c in concepts if len(c) > 2 and c.lower() not in ['the', 'and', 'for', 'with']]
        
        return concepts[:10]  # Limit to top 10
    
    def _extract_code_concepts(self, code: str, language: str) -> List[str]:
        """Extract concepts from code comments and names"""
        concepts = []
        
        # Extract from comments
        comment_patterns = {
            "javascript": r'//\s*(.+)|/\*\s*(.*?)\s*\*/',
            "python": r'#\s*(.+)|"""(.*?)"""|\'\'\'(.*?)\'\'\'',
            "typescript": r'//\s*(.+)|/\*\s*(.*?)\s*\*/'
        }
        
        if language in comment_patterns:
            matches = re.findall(comment_patterns[language], code, re.DOTALL)
            for match in matches:
                if isinstance(match, tuple):
                    concepts.extend([m.strip() for m in match if m.strip()])
                else:
                    concepts.append(match.strip())
        
        return concepts[:5]  # Limit to top 5
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text"""
        # Simple approach: find capitalized words and technical terms
        words = re.findall(r'\b[A-Z][a-z]*\b|\b[a-z]*[A-Z][a-zA-Z]*\b', text)
        
        # Filter and deduplicate
        key_terms = list(set([w for w in words if len(w) > 3]))
        
        return key_terms[:15]  # Limit to top 15
    
    def _generate_summary(self, text: str) -> str:
        """Generate a summary of the content"""
        # Simple summary: first few sentences
        sentences = text.split('.')[:3]
        summary = '. '.join(sentences).strip()
        
        if len(summary) > 200:
            summary = summary[:200] + "..."
        
        return summary or "Content summary not available"
    
    def _generate_code_explanation(self, code: str, language: str) -> str:
        """Generate basic explanation for code"""
        # Very basic heuristic explanations
        if 'function' in code.lower():
            return "This code defines a function"
        elif 'class' in code.lower():
            return "This code defines a class"
        elif 'import' in code.lower():
            return "This code imports modules or libraries"
        elif '=' in code:
            return "This code assigns values to variables"
        else:
            return f"This is {language} code that performs a specific operation"
    
    def _estimate_difficulty(self, text: str, code_blocks: List[Dict]) -> str:
        """Estimate content difficulty"""
        # Simple heuristics for difficulty estimation
        word_count = len(text.split())
        
        if word_count < 100 and len(code_blocks) <= 1:
            return "beginner"
        elif word_count < 500 and len(code_blocks) <= 3:
            return "intermediate"
        else:
            return "advanced"
    
    def _estimate_code_difficulty(self, code: str, language: str) -> str:
        """Estimate code difficulty"""
        # Heuristics based on code complexity
        complexity_indicators = [
            'class', 'interface', 'abstract', 'async', 'await',
            'callback', 'promise', 'generic', 'decorator'
        ]
        
        complexity_score = sum(1 for indicator in complexity_indicators if indicator in code.lower())
        line_count = len(code.split('\n'))
        
        if complexity_score == 0 and line_count < 10:
            return "beginner"
        elif complexity_score <= 2 and line_count < 30:
            return "intermediate"
        else:
            return "advanced"