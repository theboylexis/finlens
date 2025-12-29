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
    import traceback
    try:
        print(f"[BUDGET] Starting budget creation: category={budget.category}, limit={budget.monthly_limit}, user_id={user.get('id')}")
        
        # Check if budget already exists for this user/category
        cursor = await db.execute(
            "SELECT id FROM budgets WHERE category = ? AND user_id = ?",
            (budget.category, user["id"])
        )
        existing = await cursor.fetchone()
        print(f"[BUDGET] Existing check complete: {'found' if existing else 'not found'}")
        
        if existing:
            # Update existing budget
            print(f"[BUDGET] Updating existing budget id={existing['id']}")
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
            print(f"[BUDGET] Creating new budget")
            cursor = await db.execute(
                """
                INSERT INTO budgets (user_id, category, monthly_limit)
                VALUES (?, ?, ?)
                """,
                (user["id"], budget.category, budget.monthly_limit)
            )
            budget_id = cursor.lastrowid
            print(f"[BUDGET] Insert complete, lastrowid={budget_id}")
        
        await db.commit()
        print(f"[BUDGET] Commit complete")
        
        # Fetch created/updated budget - fallback if lastrowid failed
        if budget_id:
            print(f"[BUDGET] Fetching by id={budget_id}")
            fetch_cursor = await db.execute("SELECT * FROM budgets WHERE id = ?", (budget_id,))
        else:
            print(f"[BUDGET] Fetching by category={budget.category} user_id={user['id']}")
            fetch_cursor = await db.execute(
                "SELECT * FROM budgets WHERE category = ? AND user_id = ?",
                (budget.category, user["id"])
            )
        row = await fetch_cursor.fetchone()
        print(f"[BUDGET] Fetch complete: row={'found' if row else 'None'}")
        
        if not row:
            print(f"[BUDGET] ERROR: Row not found after insert/update")
            raise HTTPException(status_code=500, detail="Failed to fetch created budget")
        
        print(f"[BUDGET] Building response")
        response = BudgetResponse(
            id=row["id"],
            category=row["category"],
            monthly_limit=float(row["monthly_limit"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
        print(f"[BUDGET] Success! Returning budget id={response.id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BUDGET] ERROR: {type(e).__name__}: {e}")
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
