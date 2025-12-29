"""
Budget routes for FinLens AI.
Handles budget creation and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import aiosqlite

from database import get_db
from models import BudgetCreate, BudgetResponse
from dependencies import require_auth
from typing import List, Optional

router = APIRouter()


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget: BudgetCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Create or update a budget for a category for the current user."""
    try:
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
                WHERE category = ? AND user_id = ?
                """,
                (budget.monthly_limit, budget.category, user["id"])
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
        
        # Fetch created/updated budget - fallback if lastrowid failed
        if budget_id:
            fetch_cursor = await db.execute("SELECT * FROM budgets WHERE id = ?", (budget_id,))
        else:
            fetch_cursor = await db.execute(
                "SELECT * FROM budgets WHERE category = ? AND user_id = ?",
                (budget.category, user["id"])
            )
        row = await fetch_cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Failed to fetch created budget")
        
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error creating budget: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create budget: {str(e)}")


@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get all budgets for current user."""
    cursor = await db.execute(
        "SELECT * FROM budgets WHERE user_id = ? ORDER BY category",
        (user["id"],)
    )
    rows = await cursor.fetchall()
    
    return [dict(row) for row in rows]


@router.delete("/{category}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    category: str,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Delete a budget for a category."""
    cursor = await db.execute(
        "SELECT id FROM budgets WHERE category = ? AND user_id = ?",
        (category, user["id"])
    )
    existing = await cursor.fetchone()
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget for category '{category}' not found"
        )
    
    await db.execute("DELETE FROM budgets WHERE category = ? AND user_id = ?", (category, user["id"]))
    await db.commit()
    
    return None
