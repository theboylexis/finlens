"""
API Integration tests for the Expenses endpoints.

Tests CRUD operations and category suggestion endpoint.
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestExpensesAPI:
    """Test expense CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_expense(self, client, sample_expense_data):
        """Test creating a new expense."""
        response = await client.post("/api/expenses/", json=sample_expense_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["amount"] == sample_expense_data["amount"]
        assert data["description"] == sample_expense_data["description"]
        assert data["date"] == sample_expense_data["date"]
        assert "id" in data
        assert "category" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_expense_with_category(self, client):
        """Test creating an expense with manual category."""
        expense_data = {
            "amount": 50.00,
            "description": "Test expense",
            "date": "2024-12-25",
            "category": "Shopping"
        }
        
        response = await client.post("/api/expenses/", json=expense_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "Shopping"
        assert data["categorization_method"] == "manual"

    @pytest.mark.asyncio
    async def test_get_expenses(self, client, sample_expense_data):
        """Test getting list of expenses."""
        # Create an expense first
        await client.post("/api/expenses/", json=sample_expense_data)
        
        # Get expenses
        response = await client.get("/api/expenses/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_expenses_with_limit(self, client, sample_expenses):
        """Test getting expenses with limit parameter."""
        # Create multiple expenses
        for expense in sample_expenses:
            await client.post("/api/expenses/", json=expense)
        
        # Get with limit
        response = await client.get("/api/expenses/?limit=2")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

    @pytest.mark.asyncio
    async def test_get_single_expense(self, client, sample_expense_data):
        """Test getting a single expense by ID."""
        # Create expense
        create_response = await client.post("/api/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Get single expense
        response = await client.get(f"/api/expenses/{expense_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == expense_id

    @pytest.mark.asyncio
    async def test_get_nonexistent_expense(self, client):
        """Test getting a non-existent expense returns 404."""
        response = await client.get("/api/expenses/99999")
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_expense(self, client, sample_expense_data):
        """Test updating an expense."""
        # Create expense
        create_response = await client.post("/api/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Update expense
        updates = {"amount": 100.00, "description": "Updated description"}
        response = await client.patch(f"/api/expenses/{expense_id}", json=updates)
        
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 100.00
        assert data["description"] == "Updated description"

    @pytest.mark.asyncio
    async def test_update_category_marks_overridden(self, client, sample_expense_data):
        """Test that updating category marks expense as user_overridden."""
        # Create expense
        create_response = await client.post("/api/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Update category
        response = await client.patch(
            f"/api/expenses/{expense_id}",
            json={"category": "Entertainment"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "Entertainment"
        assert data["user_overridden"] == True

    @pytest.mark.asyncio
    async def test_delete_expense(self, client, sample_expense_data):
        """Test deleting an expense."""
        # Create expense
        create_response = await client.post("/api/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Delete expense
        response = await client.delete(f"/api/expenses/{expense_id}")
        assert response.status_code == 204
        
        # Verify deletion
        get_response = await client.get(f"/api/expenses/{expense_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_nonexistent_expense(self, client):
        """Test deleting a non-existent expense returns 404."""
        response = await client.delete("/api/expenses/99999")
        assert response.status_code == 404


class TestCategorySuggestionAPI:
    """Test the category suggestion endpoint."""

    @pytest.mark.asyncio
    async def test_suggest_category(self, client):
        """Test category suggestion for a description."""
        response = await client.get(
            "/api/expenses/suggest-category?description=Coffee%20at%20Starbucks"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "category" in data
        assert "confidence" in data
        assert "method" in data
        assert data["category"] == "Food & Dining"

    @pytest.mark.asyncio
    async def test_suggest_category_empty_description(self, client):
        """Test category suggestion with empty description returns 400."""
        response = await client.get("/api/expenses/suggest-category?description=")
        
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_suggest_category_whitespace_description(self, client):
        """Test category suggestion with whitespace-only description returns 400."""
        response = await client.get("/api/expenses/suggest-category?description=%20%20%20")
        
        assert response.status_code == 400


class TestExpenseValidation:
    """Test input validation for expenses."""

    @pytest.mark.asyncio
    async def test_create_expense_missing_required_fields(self, client):
        """Test creating expense without required fields returns 422."""
        # Missing amount
        response = await client.post("/api/expenses/", json={
            "description": "Test",
            "date": "2024-12-25"
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_expense_invalid_date(self, client):
        """Test creating expense with invalid date format returns 422."""
        response = await client.post("/api/expenses/", json={
            "amount": 50.00,
            "description": "Test",
            "date": "invalid-date"
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_expense_negative_amount(self, client):
        """Test creating expense with negative amount."""
        response = await client.post("/api/expenses/", json={
            "amount": -50.00,
            "description": "Test",
            "date": "2024-12-25"
        })
        # Depending on validation, this might be allowed or return 422
        # Just verify it doesn't crash
        assert response.status_code in [201, 422]
