"""
Hybrid expense categorization service for FinLens AI.
Combines regex pattern matching with AI fallback for robust categorization.
Includes in-memory caching to reduce API calls.
"""

import re
import json
import time
import hashlib
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

from models import CategorySuggestion, CategorizationMethod
from services.gemini_client import get_gemini_client


@dataclass
class CacheEntry:
    """Cache entry with expiration."""
    value: CategorySuggestion
    expires_at: datetime
    
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class CategorizationCache:
    """
    In-memory cache for AI categorization results.
    Reduces API calls for repeated descriptions.
    """
    
    def __init__(self, ttl_seconds: int = 3600, max_size: int = 1000):
        """
        Initialize cache.
        
        Args:
            ttl_seconds: Time-to-live for cache entries (default: 1 hour)
            max_size: Maximum number of entries to store
        """
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size
        self._cache: Dict[str, CacheEntry] = {}
        self._hits = 0
        self._misses = 0
    
    def _make_key(self, description: str) -> str:
        """Create a cache key from description."""
        # Normalize: lowercase, strip whitespace
        normalized = description.lower().strip()
        # Use hash for consistent key length
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def get(self, description: str) -> Optional[CategorySuggestion]:
        """Get cached result if available and not expired."""
        key = self._make_key(description)
        entry = self._cache.get(key)
        
        if entry is None:
            self._misses += 1
            return None
        
        if entry.is_expired():
            # Remove expired entry
            del self._cache[key]
            self._misses += 1
            return None
        
        self._hits += 1
        return entry.value
    
    def set(self, description: str, result: CategorySuggestion) -> None:
        """Store a result in cache."""
        # Evict oldest entries if at capacity
        if len(self._cache) >= self.max_size:
            self._evict_oldest()
        
        key = self._make_key(description)
        expires_at = datetime.now() + timedelta(seconds=self.ttl_seconds)
        self._cache[key] = CacheEntry(value=result, expires_at=expires_at)
    
    def _evict_oldest(self) -> None:
        """Remove the oldest cache entries."""
        # Remove 10% of entries when full
        entries_to_remove = max(1, self.max_size // 10)
        
        # Sort by expiration time and remove oldest
        sorted_keys = sorted(
            self._cache.keys(),
            key=lambda k: self._cache[k].expires_at
        )
        
        for key in sorted_keys[:entries_to_remove]:
            del self._cache[key]
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
    
    @property
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "size": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.1f}%"
        }


# Global cache instance
_cache = CategorizationCache()


class ExpenseCategorizer:
    """
    Hybrid expense categorizer using regex + AI with caching.
    
    Strategy:
    1. Try regex pattern matching (fast, deterministic, high confidence)
    2. Check cache for previous AI results
    3. Fallback to Gemini AI (slower, probabilistic, variable confidence)
    4. Return suggestion with confidence score and method used
    """
    
    # Category patterns - comprehensive keywords for accurate matching
    CATEGORY_PATTERNS = {
        "Food & Dining": [
            r"\b(restaurant|food|lunch|dinner|breakfast|brunch|cafe|coffee|tea|pizza|burger|chicken|rice|meal|eat|dining|snack|takeout|takeaway|delivery|order)\b",
            r"\b(grocery|supermarket|shoprite|melcom|maxmart|market|provisions|foodstuff)\b",
            r"\b(waakye|jollof|kenkey|banku|fufu|kelewele|gari|shito|tilapia|kontomire|red red|fried rice|indomie|bread|egg)\b",
            r"\b(mcdonald|kfc|subway|starbucks|dominos|papaye|marwako|nandos|chicken inn)\b",
            r"\b(drinks|juice|soda|beer|wine|alcohol|bar tab|snacks|biscuits|cookies|ice cream|fruit)\b",
        ],
        "Transportation": [
            r"\b(uber|bolt|yango|taxi|cab|ride|driver|trotro|bus|train|metro|okada|aboboyaa)\b",
            r"\b(fuel|gas|petrol|diesel|filling station|shell|goil|total|oando|oryx)\b",
            r"\b(parking|toll|car wash|mechanic|repair|tyre|tire|oil change|service|maintenance)\b",
            r"\b(flight|airline|ticket|transport|commute|travel fare)\b",
        ],
        "Shopping": [
            r"\b(shop|shopping|store|mall|boutique|market|purchase|buy|bought)\b",
            r"\b(clothing|clothes|shirt|trouser|dress|jeans|shoes|sneakers|sandals|bag|handbag)\b",
            r"\b(electronics|phone|laptop|computer|tablet|charger|headphones|earbuds|accessory|gadget)\b",
            r"\b(amazon|melcom|palace|junction|accra mall|achimota mall|marina mall|west hills)\b",
            r"\b(furniture|home|kitchen|appliance|decor|bedding|mattress|chair|table)\b",
        ],
        "Entertainment": [
            r"\b(movie|cinema|film|netflix|showmax|dstv|gotv|subscription|streaming)\b",
            r"\b(game|gaming|ps5|playstation|xbox|steam|bet|betting|lotto|lottery)\b",
            r"\b(concert|show|event|club|lounge|bar|nightclub|party|birthday|celebration)\b",
            r"\b(spotify|apple music|youtube|tiktok|premium|membership)\b",
            r"\b(fun|outing|hangout|leisure|recreation|picnic)\b",
        ],
        "Bills & Utilities": [
            r"\b(bill|utility|electricity|electric|power|ecg|prepaid|postpaid|light)\b",
            r"\b(water|gwc|internet|wifi|data|bundle|mtn|vodafone|airtel|glo|at)\b",
            r"\b(phone|mobile|airtime|credit|rent|lease|apartment|house)\b",
            r"\b(insurance|premium|subscription|mortgage|property tax|waste|sanitation)\b",
            r"\b(cable|tv|dstv|gotv|startimes|decoder)\b",
        ],
        "Healthcare": [
            r"\b(doctor|hospital|clinic|pharmacy|medicine|drug|prescription|health|medical)\b",
            r"\b(dental|dentist|teeth|eye|glasses|optician|checkup|test|lab|laboratory|scan)\b",
            r"\b(nhis|insurance|consultation|treatment|surgery|procedure|therapy|physio)\b",
            r"\b(vitamin|supplement|painkiller|paracetamol|ibuprofen|first aid)\b",
        ],
        "Education": [
            r"\b(school|tuition|fees|course|class|lesson|training|workshop|seminar|conference)\b",
            r"\b(book|textbook|stationery|notebook|pen|pencil|supplies|materials)\b",
            r"\b(university|college|polytechnic|diploma|degree|certificate|exam|test|quiz)\b",
            r"\b(online course|udemy|coursera|skillshare|masterclass|tutorial|learning)\b",
        ],
        "Personal Care": [
            r"\b(salon|barber|hair|haircut|braids|weave|wig|nails|manicure|pedicure|makeup|cosmetics)\b",
            r"\b(spa|massage|facial|skincare|cream|lotion|perfume|cologne|fragrance|deodorant)\b",
            r"\b(gym|fitness|workout|exercise|yoga|pilates|sports|swimming|membership)\b",
            r"\b(toiletries|soap|shampoo|toothpaste|brush|razor|shaving|grooming)\b",
        ],
        "Travel": [
            r"\b(hotel|motel|airbnb|lodge|resort|accommodation|booking|reservation|stay)\b",
            r"\b(flight|airline|airport|ticket|boarding|passport|visa|travel|trip|vacation|holiday)\b",
            r"\b(africa world|passion air|emirates|kenya airways|ethiopian|british airways)\b",
            r"\b(tourism|tour|sightseeing|excursion|adventure|road trip|getaway)\b",
        ],
        "Savings & Investments": [
            r"\b(savings|save|investment|invest|stock|shares|trading|crypto|bitcoin|forex)\b",
            r"\b(deposit|transfer|momo|mobile money|wallet|susu|contribution|pension)\b",
            r"\b(bank|banking|interest|dividend|mutual fund|fixed deposit|treasury bill|bond)\b",
        ],
    }
    
    def __init__(self, cache: CategorizationCache = None):
        """Initialize categorizer with optional cache."""
        self.gemini_client = get_gemini_client()
        self.cache = cache or _cache
        
        # Compile regex patterns for performance
        self.compiled_patterns = {}
        for category, patterns in self.CATEGORY_PATTERNS.items():
            self.compiled_patterns[category] = [
                re.compile(pattern, re.IGNORECASE)
                for pattern in patterns
            ]
    
    def _regex_categorize(self, description: str) -> Optional[Tuple[str, float]]:
        """
        Attempt to categorize using regex patterns.
        
        Args:
            description: Expense description
            
        Returns:
            Tuple of (category, confidence) or None if no match
        """
        description_lower = description.lower()
        
        # Check each category's patterns
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                if pattern.search(description_lower):
                    # High confidence for regex matches
                    return (category, 0.95)
        
        return None
    
    async def _ai_categorize(self, description: str) -> Tuple[str, float, str]:
        """
        Categorize using Gemini AI.
        
        Args:
            description: Expense description
            
        Returns:
            Tuple of (category, confidence, reasoning)
        """
        # System instruction for categorization
        system_instruction = """You are a financial expense categorization expert.
Your task is to categorize expense descriptions into one of these categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Personal Care
- Travel
- Savings & Investments
- Other

Respond with JSON in this format:
{
  "category": "category name",
  "confidence": 0.85,
  "reasoning": "brief explanation"
}

Confidence should be:
- 0.8-1.0 for clear, obvious categorizations
- 0.5-0.8 for reasonable guesses
- 0.0-0.5 for uncertain categorizations
"""
        
        prompt = f"Categorize this expense: '{description}'"
        
        try:
            start_time = time.time()
            
            response = await self.gemini_client.generate_structured_content(
                prompt=prompt,
                system_instruction=system_instruction
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            category = response.get("category", "Other")
            confidence = float(response.get("confidence", 0.5))
            reasoning = response.get("reasoning", "AI categorization")
            
            # Validate category
            valid_categories = list(self.CATEGORY_PATTERNS.keys()) + ["Other"]
            if category not in valid_categories:
                category = "Other"
                confidence = 0.3
                reasoning = f"Unknown category suggested, defaulted to Other"
            
            return (category, confidence, reasoning)
        
        except Exception as e:
            error_str = str(e).lower()
            
            # Check for quota/rate limit errors
            if "quota" in error_str or "rate" in error_str or "429" in error_str:
                print(f"⚠️ AI quota exceeded, using fallback: {e}")
                return ("Other", 0.3, "AI quota exceeded - using fallback category")
            
            print(f"❌ AI categorization failed: {e}")
            # Fallback to "Other" with low confidence
            return ("Other", 0.2, f"AI error: {str(e)}")
    
    async def categorize(
        self,
        description: str,
        amount: Optional[float] = None
    ) -> CategorySuggestion:
        """
        Categorize an expense using hybrid approach with caching.
        
        Args:
            description: Expense description
            amount: Optional expense amount (for future enhancements)
            
        Returns:
            CategorySuggestion with category, confidence, method, and reasoning
        """
        # Handle empty descriptions
        if not description or not description.strip():
            return CategorySuggestion(
                category="Other",
                confidence=0.1,
                method=CategorizationMethod.REGEX,
                reasoning="Empty description"
            )
        
        description = description.strip()
        
        # Step 1: Try regex categorization (no caching needed - it's fast)
        regex_result = self._regex_categorize(description)
        
        if regex_result:
            category, confidence = regex_result
            return CategorySuggestion(
                category=category,
                confidence=confidence,
                method=CategorizationMethod.REGEX,
                reasoning=f"Matched pattern for {category}"
            )
        
        # Step 2: Check cache for previous AI result
        cached_result = self.cache.get(description)
        if cached_result:
            # Return cached result with note
            return CategorySuggestion(
                category=cached_result.category,
                confidence=cached_result.confidence,
                method=cached_result.method,
                reasoning=f"{cached_result.reasoning} (cached)"
            )
        
        # Step 3: Fallback to AI categorization
        category, confidence, reasoning = await self._ai_categorize(description)
        
        result = CategorySuggestion(
            category=category,
            confidence=confidence,
            method=CategorizationMethod.AI,
            reasoning=reasoning
        )
        
        # Cache the AI result (only if not an error response)
        if confidence > 0.25:
            self.cache.set(description, result)
        
        return result
    
    async def batch_categorize(
        self,
        descriptions: List[str]
    ) -> List[CategorySuggestion]:
        """
        Categorize multiple expenses.
        
        Args:
            descriptions: List of expense descriptions
            
        Returns:
            List of CategorySuggestions
        """
        results = []
        for description in descriptions:
            suggestion = await self.categorize(description)
            results.append(suggestion)
        
        return results
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return self.cache.stats


# Global categorizer instance
_categorizer: Optional[ExpenseCategorizer] = None


def get_categorizer() -> ExpenseCategorizer:
    """Get or create categorizer singleton."""
    global _categorizer
    if _categorizer is None:
        _categorizer = ExpenseCategorizer()
    return _categorizer


# Alias for backwards compatibility
HybridCategorizer = ExpenseCategorizer

