"""
Unit tests for the Hybrid Categorizer service.

Tests regex pattern matching, AI fallback, and confidence scoring.
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.categorizer import HybridCategorizer, get_categorizer
from models import CategorizationMethod


class TestRegexCategorization:
    """Test regex-based categorization patterns."""

    @pytest.fixture
    def categorizer(self):
        """Create a categorizer instance."""
        return HybridCategorizer()

    @pytest.mark.asyncio
    async def test_food_dining_keywords(self, categorizer):
        """Test Food & Dining category detection."""
        food_descriptions = [
            "Starbucks coffee",
            "McDonald's lunch",
            "Pizza delivery",
            "Supermarket groceries",
            "Restaurant dinner",
            "KFC meal",
        ]
        
        for desc in food_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Food & Dining", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX
            assert result.confidence >= 0.9

    @pytest.mark.asyncio
    async def test_transportation_keywords(self, categorizer):
        """Test Transportation category detection."""
        transport_descriptions = [
            "Uber ride",
            "Gas station fill-up",
            "Bus fare",
            "Taxi to airport",
            "Lyft to downtown",
        ]
        
        for desc in transport_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Transportation", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX

    @pytest.mark.asyncio
    async def test_shopping_keywords(self, categorizer):
        """Test Shopping category detection."""
        shopping_descriptions = [
            "Amazon purchase",
            "Mall shopping",
            "Nike store",
            "Electronics store",
        ]
        
        for desc in shopping_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Shopping", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX

    @pytest.mark.asyncio
    async def test_entertainment_keywords(self, categorizer):
        """Test Entertainment category detection."""
        entertainment_descriptions = [
            "Netflix subscription",
            "Movie tickets",
            "Spotify premium",
            "Concert tickets",
            "Cinema outing",
        ]
        
        for desc in entertainment_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Entertainment", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX

    @pytest.mark.asyncio
    async def test_bills_utilities_keywords(self, categorizer):
        """Test Bills & Utilities category detection."""
        bills_descriptions = [
            "Electric bill payment",
            "Water utility",
            "Internet bill",
            "Phone bill",
            "Rent payment",
        ]
        
        for desc in bills_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Bills & Utilities", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX

    @pytest.mark.asyncio
    async def test_healthcare_keywords(self, categorizer):
        """Test Healthcare category detection."""
        healthcare_descriptions = [
            "Doctor visit",
            "Pharmacy prescription",
            "Hospital bill",
            "Dentist appointment",
            "Medicine purchase",
        ]
        
        for desc in healthcare_descriptions:
            result = await categorizer.categorize(desc)
            assert result.category == "Healthcare", f"Failed for: {desc}"
            assert result.method == CategorizationMethod.REGEX


class TestConfidenceScoring:
    """Test confidence score calculations."""

    @pytest.fixture
    def categorizer(self):
        return HybridCategorizer()

    @pytest.mark.asyncio
    async def test_high_confidence_for_clear_matches(self, categorizer):
        """Clear keyword matches should have high confidence."""
        result = await categorizer.categorize("Starbucks coffee")
        assert result.confidence >= 0.9

    @pytest.mark.asyncio
    async def test_confidence_is_bounded(self, categorizer):
        """Confidence should always be between 0 and 1."""
        test_descriptions = [
            "Random purchase",
            "Coffee at Starbucks",
            "Uber to work",
            "Something weird xyz123",
        ]
        
        for desc in test_descriptions:
            result = await categorizer.categorize(desc)
            assert 0 <= result.confidence <= 1, f"Invalid confidence for: {desc}"


class TestCategorizerIntegration:
    """Integration tests for the categorizer."""

    @pytest.mark.asyncio
    async def test_get_categorizer_singleton(self):
        """Test that get_categorizer returns the same instance."""
        cat1 = get_categorizer()
        cat2 = get_categorizer()
        assert cat1 is cat2

    @pytest.mark.asyncio
    async def test_categorize_with_amount(self):
        """Test categorization with amount context."""
        categorizer = get_categorizer()
        
        # Small amount typically food
        result = await categorizer.categorize("Coffee", amount=5.00)
        assert result.category is not None

    @pytest.mark.asyncio
    async def test_empty_description_handling(self):
        """Test handling of empty or whitespace descriptions."""
        categorizer = get_categorizer()
        
        # Should not crash on empty input
        result = await categorizer.categorize("   ")
        assert result.category == "Other"  # Default fallback
