"""
Budget routes for FinLens AI.
Handles budget creation and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import aiosqlite

from database import get_db
from models import BudgetCreate, BudgetResponse
from dependencies import get_current_user
from typing import List, Optional

router = APIRouter()


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget: BudgetCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Create or update a budget for a category."""
    # Check if budget already exists for this user/category
    cursor = await db.execute(
        "SELECT id FROM budgets WHERE category = ? AND user_id = ?",
        (budget.category, user["id"])
    )
    existing = await cursor.fetchone()
    
    if existing:
        # Update existing budget
        await db.execute(
            """
            UPDATE budgets 
            SET monthly_limit = ?, updated_at = CURRENT_TIMESTAMP
            WHERE category = ?
            """,
            (budget.monthly_limit, budget.category)
        )
        budget_id = existing["id"]
    else:
        # Create new budget
        cursor = await db.execute(
            """
            INSERT INTO budgets (user_id, category, monthly_limit)
            VALUES (?, ?, ?)
            """,
            (user["id"], budget.category, budget.monthly_limit)
        )
        budget_id = cursor.lastrowid
    
    await db.commit()
    
    # Fetch created/updated budget
    cursor = await db.execute(
        "SELECT * FROM budgets WHERE id = ?",
        (budget_id,)
    )
    row = await cursor.fetchone()
    
    return dict(row)


@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Get all budgets for current user."""
    cursor = await db.execute(
        "SELECT * FROM budgets WHERE user_id = ? ORDER BY category",
        (user["id"],)
    )
    rows = await cursor.fetchall()
    
    return [dict(row) for row in rows]


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Delete a budget."""
    cursor = await db.execute(
        "SELECT id FROM budgets WHERE id = ? AND user_id = ?",
        (budget_id, user["id"])
    )
    existing = await cursor.fetchone()
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget {budget_id} not found"
        )
    
    await db.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))
    await db.commit()
    
    return None
