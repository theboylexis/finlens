"""
Gemini AI client configuration for FinLens AI.
Handles AI model initialization and request management.
"""

import os
import google.generativeai as genai
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AI_MODEL = os.getenv("AI_MODEL", "gemini-2.5-flash")
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.3"))
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "1000"))


class GeminiClient:
    """Gemini AI client wrapper for FinLens AI."""
    
    def __init__(self):
        """Initialize Gemini client."""
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please set it in your .env file."
            )
        
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Generation config
        self.generation_config = {
            "temperature": AI_TEMPERATURE,
            "max_output_tokens": AI_MAX_TOKENS,
        }
        
        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=AI_MODEL,
            generation_config=self.generation_config,
        )
        
        print(f"✓ Gemini AI initialized: {AI_MODEL}")
    
    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        """
        Generate content using Gemini AI.
        
        Args:
            prompt: User prompt
            system_instruction: Optional system instruction
            
        Returns:
            Generated text response
        """
        try:
            # Create model with system instruction if provided
            if system_instruction:
                model = genai.GenerativeModel(
                    model_name=AI_MODEL,
                    generation_config=self.generation_config,
                    system_instruction=system_instruction,
                )
            else:
                model = self.model
            
            # Generate content
            response = model.generate_content(prompt)
            
            return response.text.strip()
        
        except Exception as e:
            print(f"❌ Gemini AI error: {e}")
            raise
    
    async def generate_structured_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        response_schema: Optional[dict] = None
    ) -> dict:
        """
        Generate structured JSON content using Gemini AI.
        
        Args:
            prompt: User prompt
            system_instruction: Optional system instruction
            response_schema: Optional JSON schema for structured output
            
        Returns:
            Parsed JSON response
        """
        try:
            import json
            
            # Add JSON formatting instruction
            json_prompt = f"{prompt}\n\nRespond with valid JSON only, no markdown formatting."
            
            response_text = await self.generate_content(
                json_prompt,
                system_instruction
            )
            
            # Parse JSON response
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                # Extract JSON from code block
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1])
            
            return json.loads(response_text)
        
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON response: {e}")
            print(f"Response: {response_text}")
            raise
        except Exception as e:
            print(f"❌ Gemini AI error: {e}")
            raise


# Global Gemini client instance
_gemini_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Get or create Gemini client singleton."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client
