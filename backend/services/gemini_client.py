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

    async def extract_receipt_data(self, image_base64: str) -> dict:
        """
        Extract expense data from a receipt/bill image using Gemini Vision.
        
        Args:
            image_base64: Base64 encoded image data
            
        Returns:
            Dictionary with extracted data: amount, description, date, category
        """
        import json
        import base64
        from datetime import date
        
        try:
            # Create the image part for Gemini
            image_data = base64.b64decode(image_base64)
            
            # Detect MIME type from image header bytes
            mime_type = "image/jpeg"  # default
            if image_data[:8] == b'\x89PNG\r\n\x1a\n':
                mime_type = "image/png"
            elif image_data[:2] == b'\xff\xd8':
                mime_type = "image/jpeg"
            elif image_data[:4] == b'GIF8':
                mime_type = "image/gif"
            elif image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':
                mime_type = "image/webp"
            
            print(f"📸 Detected image MIME type: {mime_type}")
            
            # Prepare the prompt for receipt/bill extraction
            # Updated to handle various document types including utility bills
            prompt = """Analyze this image of a receipt, invoice, bill, or statement and extract the following information.

This could be a store receipt, restaurant bill, utility bill (electricity, water, gas), subscription invoice, or any other payment document.

Return a JSON object with these fields:
- amount: The TOTAL amount due or paid (as a number, no currency symbols). For utility bills, use the "Total Due", "Amount Due", or "Total Payable" amount.
- description: The company/merchant name or a brief description (e.g., "ECG Electricity Bill", "Vodafone Bill", "Shoprite")
- date: The date on the document in YYYY-MM-DD format. For bills, use the billing date or due date. If not visible, use today's date.
- category: Suggest one of these categories based on the document type:
  "Food & Dining", "Transportation", "Shopping", "Entertainment", 
  "Bills & Utilities", "Health", "Travel", "Education", "Other"
  Note: Electricity, water, gas, internet, phone bills should be "Bills & Utilities"
- confidence: How confident you are in the extraction (0.0 to 1.0)
- raw_text: Key text you can read from the document (account number, meter reading, etc.)

If you cannot read certain fields clearly, make your best guess and lower the confidence.
Respond with valid JSON only, no markdown formatting."""

            # Use Gemini with the image
            model = genai.GenerativeModel(
                model_name=AI_MODEL,
                generation_config={"temperature": 0.1, "max_output_tokens": 1000},
            )
            
            # Create content with image using detected MIME type
            response = model.generate_content([
                prompt,
                {
                    "mime_type": mime_type,
                    "data": image_data
                }
            ])
            
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1])
            
            result = json.loads(response_text)
            
            # Ensure required fields exist with defaults
            result.setdefault("amount", 0.0)
            result.setdefault("description", "Receipt scan")
            result.setdefault("date", str(date.today()))
            result.setdefault("category", "Other")
            result.setdefault("confidence", 0.5)
            result.setdefault("raw_text", "")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse receipt JSON: {e}")
            # Return default values on parse failure
            return {
                "amount": 0.0,
                "description": "Receipt scan",
                "date": str(date.today()),
                "category": "Other",
                "confidence": 0.0,
                "raw_text": "",
                "error": "Could not parse receipt data"
            }
        except Exception as e:
            print(f"❌ Receipt extraction error: {e}")
            raise


# Global Gemini client instance
_gemini_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Get or create Gemini client singleton."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client
