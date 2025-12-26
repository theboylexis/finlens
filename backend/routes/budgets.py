"""
Budget routes for FinLens AI.
Handles budget creation and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import aiosqlite

from database import get_db
from models import BudgetCreate, BudgetResponse

router = APIRouter()


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget: BudgetCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create or update a budget for a category."""
    # Check if budget already exists
    cursor = await db.execute(
        "SELECT id FROM budgets WHERE category = ?",
        (budget.category,)
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
            INSERT INTO budgets (category, monthly_limit)
            VALUES (?, ?)
            """,
            (budget.category, budget.monthly_limit)
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
async def get_budgets(db: aiosqlite.Connection = Depends(get_db)):
    """Get all budgets."""
    cursor = await db.execute(
        "SELECT * FROM budgets ORDER BY category"
    )
    rows = await cursor.fetchall()
    
    return [dict(row) for row in rows]


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete a budget."""
    cursor = await db.execute(
        "SELECT id FROM budgets WHERE id = ?",
        (budget_id,)
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
