"""
Test suite for FinLens AI backend API.
Run with: pytest tests/ -v
"""

import pytest
import pytest_asyncio
import aiosqlite
from httpx import AsyncClient, ASGITransport
from datetime import date

# Import the app
import sys
sys.path.insert(0, '.')
from main import app
from database import SCHEMA


@pytest_asyncio.fixture
async def test_db():
    """Create a test database in memory."""
    db = await aiosqlite.connect(":memory:")
    db.row_factory = aiosqlite.Row
    await db.executescript(SCHEMA)
    await db.commit()
    yield db
    await db.close()


@pytest_asyncio.fixture
async def client():
    """Create a test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ============================================================================
# Authentication Tests
# ============================================================================

class TestAuth:
    """Test authentication endpoints."""
    
    @pytest.mark.asyncio
    async def test_signup_success(self, client: AsyncClient):
        """Test successful user signup."""
        response = await client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123",
            "name": "Test User"
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
    
    @pytest.mark.asyncio
    async def test_signup_duplicate_email(self, client: AsyncClient):
        """Test signup with duplicate email."""
        # First signup
        await client.post("/api/auth/signup", json={
            "email": "duplicate@example.com",
            "password": "password123",
            "name": "User 1"
        })
        
        # Second signup with same email
        response = await client.post("/api/auth/signup", json={
            "email": "duplicate@example.com",
            "password": "password456",
            "name": "User 2"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Test successful login."""
        # Create user first
        await client.post("/api/auth/signup", json={
            "email": "login@example.com",
            "password": "mypassword",
            "name": "Login User"
        })
        
        # Login
        response = await client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "mypassword"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Test login with wrong password."""
        await client.post("/api/auth/signup", json={
            "email": "wrongpw@example.com",
            "password": "correctpassword",
            "name": "User"
        })
        
        response = await client.post("/api/auth/login", json={
            "email": "wrongpw@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


# ============================================================================
# Expense Tests
# ============================================================================

class TestExpenses:
    """Test expense endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_expense(self, client: AsyncClient):
        """Test creating an expense."""
        response = await client.post("/api/expenses/", json={
            "amount": 25.50,
            "description": "Lunch at restaurant",
            "date": str(date.today()),
            "category": "Food & Dining"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == 25.50
        assert data["description"] == "Lunch at restaurant"
    
    @pytest.mark.asyncio
    async def test_get_expenses(self, client: AsyncClient):
        """Test getting expenses list."""
        response = await client.get("/api/expenses/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_create_expense_negative_amount(self, client: AsyncClient):
        """Test expense with negative amount fails."""
        response = await client.post("/api/expenses/", json={
            "amount": -10.00,
            "description": "Invalid expense",
            "date": str(date.today())
        })
        assert response.status_code == 422  # Validation error


# ============================================================================
# Goals Tests
# ============================================================================

class TestGoals:
    """Test savings goals endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_goal(self, client: AsyncClient):
        """Test creating a savings goal."""
        response = await client.post("/api/goals/", json={
            "name": "Spring Break Trip",
            "target_amount": 500.00
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Spring Break Trip"
        assert data["target_amount"] == 500.00
        assert data["current_amount"] == 0.0
    
    @pytest.mark.asyncio
    async def test_get_goals(self, client: AsyncClient):
        """Test getting goals list."""
        response = await client.get("/api/goals/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ============================================================================
# Analytics Tests
# ============================================================================

class TestAnalytics:
    """Test analytics endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_summary(self, client: AsyncClient):
        """Test getting analytics summary."""
        response = await client.get("/api/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_expenses" in data
        assert "expense_count" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
