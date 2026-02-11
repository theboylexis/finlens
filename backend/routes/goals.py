"""
Goals API routes for savings goals management.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date, datetime
import aiosqlite

from database import get_db
from models import GoalCreate, GoalUpdate, GoalResponse, ContributionCreate, ContributionResponse
from dependencies import require_auth

router = APIRouter()


def calculate_days_remaining(target_date: date | None) -> int | None:
    """Calculate days remaining until target date."""
    if target_date is None:
        return None
    delta = target_date - date.today()
    return max(0, delta.days)


def row_to_goal_response(row: aiosqlite.Row) -> GoalResponse:
    """Convert database row to GoalResponse model."""
    current_amount = float(row["current_amount"] or 0)
    target_amount = float(row["target_amount"])
    progress = (current_amount / target_amount * 100) if target_amount > 0 else 0
    
    # Handle target_date (can be string, date object, or None)
    target_date_value = row["target_date"]
    if target_date_value is None:
        parsed_target_date = None
    elif isinstance(target_date_value, date):
        parsed_target_date = target_date_value
    else:
        parsed_target_date = date.fromisoformat(str(target_date_value))
    
    return GoalResponse(
        id=row["id"],
        name=row["name"],
        target_amount=float(target_amount),
        current_amount=float(current_amount),
        target_date=target_date_value,
        icon=row["icon"] or "🎯",
        color=row["color"] or "#6366f1",
        is_completed=bool(row["is_completed"]),
        completed_at=row["completed_at"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        progress_percentage=round(progress, 1),
        days_remaining=calculate_days_remaining(parsed_target_date)
    )


# ============================================================================
# Goals CRUD
# ============================================================================

@router.get("/", response_model=List[GoalResponse])
async def list_goals(
    include_completed: bool = False,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """List all savings goals for current user."""
    base_query = "SELECT * FROM savings_goals WHERE user_id = ?"
    params = [user["id"]]
    
    if not include_completed:
        base_query += " AND is_completed = FALSE"
    
    base_query += " ORDER BY created_at DESC"
    
    cursor = await db.execute(base_query, params)
    rows = await cursor.fetchall()
    return [row_to_goal_response(row) for row in rows]


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(
    goal: GoalCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Create a new savings goal."""
    cursor = await db.execute(
        """
        INSERT INTO savings_goals (user_id, name, target_amount, target_date, icon, color)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user["id"], goal.name, goal.target_amount, goal.target_date, goal.icon, goal.color)
    )
    await db.commit()
    
    # Fetch the created goal
    goal_id = cursor.lastrowid
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    row = await cursor.fetchone()
    
    return row_to_goal_response(row)


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get a specific savings goal."""
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return row_to_goal_response(row)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Update a savings goal."""
    # Check if goal exists and belongs to the user
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    existing = await cursor.fetchone()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Build update query dynamically
    updates = []
    values = []
    
    if goal_update.name is not None:
        updates.append("name = ?")
        values.append(goal_update.name)
    if goal_update.target_amount is not None:
        updates.append("target_amount = ?")
        values.append(goal_update.target_amount)
    if goal_update.target_date is not None:
        updates.append("target_date = ?")
        values.append(goal_update.target_date)
    if goal_update.icon is not None:
        updates.append("icon = ?")
        values.append(goal_update.icon)
    if goal_update.color is not None:
        updates.append("color = ?")
        values.append(goal_update.color)
    
    # If target_amount is being raised above current_amount, re-open the goal
    if goal_update.target_amount is not None:
        current_amount = existing["current_amount"] or 0
        if goal_update.target_amount > current_amount and existing["is_completed"]:
            updates.append("is_completed = FALSE")
            updates.append("completed_at = NULL")
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.extend([goal_id, user["id"]])
        query = f"UPDATE savings_goals SET {', '.join(updates)} WHERE id = ? AND user_id = ?"
        await db.execute(query, values)
        await db.commit()
    
    # Fetch updated goal
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    row = await cursor.fetchone()
    
    return row_to_goal_response(row)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Delete a savings goal."""
    cursor = await db.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Goal not found")
    
    await db.execute("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    await db.commit()


# ============================================================================
# Contributions
# ============================================================================

@router.post("/{goal_id}/contribute", response_model=GoalResponse)
async def add_contribution(
    goal_id: int,
    contribution: ContributionCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Add a contribution to a savings goal."""
    # Check if goal exists and belongs to the user
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    goal = await cursor.fetchone()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Insert contribution
    await db.execute(
        """
        INSERT INTO goal_contributions (goal_id, amount, note)
        VALUES (?, ?, ?)
        """,
        (goal_id, contribution.amount, contribution.note)
    )
    
    # Update goal's current_amount
    new_amount = float(goal["current_amount"] or 0) + float(contribution.amount)
    is_completed = new_amount >= float(goal["target_amount"])
    
    if is_completed:
        await db.execute(
            """
            UPDATE savings_goals 
            SET current_amount = ?, is_completed = TRUE, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (new_amount, goal_id)
        )
    else:
        await db.execute(
            """
            UPDATE savings_goals 
            SET current_amount = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (new_amount, goal_id)
        )
    
    await db.commit()
    
    # Fetch updated goal
    cursor = await db.execute("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    row = await cursor.fetchone()
    
    return row_to_goal_response(row)


@router.get("/{goal_id}/contributions", response_model=List[ContributionResponse])
async def get_contributions(
    goal_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get contribution history for a goal."""
    # Check if goal exists and belongs to the user
    cursor = await db.execute("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Goal not found")
    
    cursor = await db.execute(
        "SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY created_at DESC",
        (goal_id,)
    )
    rows = await cursor.fetchall()
    
    return [
        ContributionResponse(
            id=row["id"],
            goal_id=row["goal_id"],
            amount=row["amount"],
            note=row["note"],
            created_at=row["created_at"]
        )
        for row in rows
    ]
