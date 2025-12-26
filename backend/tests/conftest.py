"""
Pytest configuration and fixtures for FinLens AI tests.
"""

import pytest
import asyncio
import os
import sys
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import aiosqlite
from httpx import AsyncClient, ASGITransport
from main import app
from database import db, init_db


# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Create a temporary in-memory database for testing.
    """
    # Use in-memory database for tests
    original_db_path = db.db_path
    db.db_path = ":memory:"
    
    await db.connect()
    
    yield db.connection
    
    await db.close()
    db.db_path = original_db_path


@pytest.fixture
async def client(test_db) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async HTTP client for testing the API.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_categorizer():
    """
    Create a mock categorizer that returns predictable results.
    """
    from models import CategorySuggestion, CategorizationMethod
    
    mock = AsyncMock()
    mock.categorize = AsyncMock(return_value=CategorySuggestion(
        category="Food & Dining",
        confidence=0.95,
        method=CategorizationMethod.REGEX,
        reasoning="Test categorization"
    ))
    
    return mock


@pytest.fixture
def sample_expense_data():
    """
    Sample expense data for testing.
    """
    return {
        "amount": 25.50,
        "description": "Starbucks coffee",
        "date": "2024-12-25",
        "payment_method": "Credit Card"
    }


@pytest.fixture
def sample_expenses():
    """
    Multiple sample expenses for testing.
    """
    return [
        {
            "amount": 15.00,
            "description": "Coffee at Starbucks",
            "date": "2024-12-20",
            "category": "Food & Dining"
        },
        {
            "amount": 45.00,
            "description": "Uber ride to airport",
            "date": "2024-12-21",
            "category": "Transportation"
        },
        {
            "amount": 120.00,
            "description": "Amazon purchase",
            "date": "2024-12-22",
            "category": "Shopping"
        },
    ]
