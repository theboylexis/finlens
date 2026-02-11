"""
Splits API routes for friends management and bill splitting.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
import aiosqlite

from database import get_db
from models import (
    FriendCreate, FriendResponse,
    SplitExpenseRequest, SplitResponse,
    BalanceSummary, BalancesResponse
)
from dependencies import require_auth

router = APIRouter()


# ============================================================================
# Friends CRUD
# ============================================================================

@router.get("/friends", response_model=List[FriendResponse])
async def list_friends(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """List all friends."""
    cursor = await db.execute("SELECT * FROM friends WHERE user_id = ? ORDER BY name", (user["id"],))
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


@router.post("/friends", response_model=FriendResponse, status_code=201)
async def create_friend(
    friend: FriendCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Add a new friend."""
    cursor = await db.execute(
        """
        INSERT INTO friends (user_id, name, email, phone, avatar_color)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user["id"], friend.name, friend.email, friend.phone, friend.avatar_color)
    )
    await db.commit()
    
    friend_id = cursor.lastrowid
    cursor = await db.execute("SELECT * FROM friends WHERE id = ?", (friend_id,))
    row = await cursor.fetchone()
    return dict(row)


@router.delete("/friends/{friend_id}", status_code=204)
async def delete_friend(
    friend_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Remove a friend."""
    cursor = await db.execute("SELECT id FROM friends WHERE id = ? AND user_id = ?", (friend_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Friend not found")
    
    await db.execute("DELETE FROM friends WHERE id = ? AND user_id = ?", (friend_id, user["id"]))
    await db.commit()


# ============================================================================
# Split an Expense
# ============================================================================

@router.post("/expenses/{expense_id}/split", response_model=List[SplitResponse])
async def split_expense(
    expense_id: int,
    request: SplitExpenseRequest,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Split an expense with friends."""
    # Check if expense exists and belongs to user
    cursor = await db.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Validate all friend IDs exist
    for split in request.splits:
        cursor = await db.execute("SELECT id FROM friends WHERE id = ? AND user_id = ?", (split.friend_id, user["id"]))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Friend {split.friend_id} not found")
    
    # Insert splits
    for split in request.splits:
        await db.execute(
            """
            INSERT INTO expense_splits (expense_id, friend_id, amount)
            VALUES (?, ?, ?)
            """,
            (expense_id, split.friend_id, split.amount)
        )
    
    await db.commit()
    
    # Fetch created splits with friend names
    cursor = await db.execute(
        """
        SELECT es.*, f.name as friend_name
        FROM expense_splits es
        JOIN friends f ON es.friend_id = f.id
        WHERE es.expense_id = ?
        """,
        (expense_id,)
    )
    rows = await cursor.fetchall()
    
    return [
        SplitResponse(
            id=row["id"],
            expense_id=row["expense_id"],
            friend_id=row["friend_id"],
            friend_name=row["friend_name"],
            amount=row["amount"],
            is_settled=bool(row["is_settled"]),
            settled_at=row["settled_at"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


# ============================================================================
# Balances
# ============================================================================

@router.get("/balances", response_model=BalancesResponse)
async def get_balances(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get summary of who owes what."""
    cursor = await db.execute(
        """
        SELECT 
            f.id as friend_id,
            f.name as friend_name,
            f.email as friend_email,
            f.avatar_color,
            COALESCE(SUM(CASE WHEN es.is_settled = false THEN es.amount ELSE 0 END), 0) as total_owed,
            COUNT(CASE WHEN es.is_settled = false THEN 1 END) as unsettled_count
        FROM friends f
        LEFT JOIN expense_splits es ON f.id = es.friend_id
        WHERE f.user_id = ?
        GROUP BY f.id, f.name, f.email, f.avatar_color
        HAVING COUNT(CASE WHEN es.is_settled = false THEN 1 END) > 0 
            OR COALESCE(SUM(CASE WHEN es.is_settled = false THEN es.amount ELSE 0 END), 0) > 0
        ORDER BY COALESCE(SUM(CASE WHEN es.is_settled = false THEN es.amount ELSE 0 END), 0) DESC
        """,
        (user["id"],)
    )
    rows = await cursor.fetchall()
    
    balances = [
        BalanceSummary(
            friend_id=row["friend_id"],
            friend_name=row["friend_name"],
            friend_email=row["friend_email"],
            avatar_color=row["avatar_color"],
            total_owed=row["total_owed"],
            unsettled_count=row["unsettled_count"]
        )
        for row in rows
    ]
    
    total = sum(b.total_owed for b in balances)
    
    return BalancesResponse(
        total_owed_to_you=total,
        balances=balances
    )


@router.patch("/splits/{split_id}/settle")
async def settle_split(
    split_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Mark a split as settled (paid)."""
    # Verify the split belongs to the user (via friend ownership)
    cursor = await db.execute(
        """
        SELECT es.id FROM expense_splits es
        JOIN friends f ON es.friend_id = f.id
        WHERE es.id = ? AND f.user_id = ?
        """,
        (split_id, user["id"])
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Split not found")
    
    await db.execute(
        """
        UPDATE expense_splits 
        SET is_settled = true, settled_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (split_id,)
    )
    await db.commit()
    
    return {"status": "settled"}


@router.patch("/friends/{friend_id}/settle-all")
async def settle_all_with_friend(
    friend_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Settle all splits with a friend."""
    cursor = await db.execute("SELECT id FROM friends WHERE id = ? AND user_id = ?", (friend_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Friend not found")
    
    result = await db.execute(
        """
        UPDATE expense_splits 
        SET is_settled = true, settled_at = CURRENT_TIMESTAMP
        WHERE friend_id = ? AND is_settled = false
        """,
        (friend_id,)
    )
    await db.commit()
    
    return {"status": "settled", "count": result.rowcount}


# ============================================================================
# Get splits for an expense
# ============================================================================

@router.get("/expenses/{expense_id}/splits", response_model=List[SplitResponse])
async def get_expense_splits(
    expense_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get all splits for an expense."""
    # Verify expense belongs to user
    cursor = await db.execute("SELECT id FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user["id"]))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Expense not found")

    cursor = await db.execute(
        """
        SELECT es.*, f.name as friend_name
        FROM expense_splits es
        JOIN friends f ON es.friend_id = f.id
        WHERE es.expense_id = ?
        """,
        (expense_id,)
    )
    rows = await cursor.fetchall()
    
    return [
        SplitResponse(
            id=row["id"],
            expense_id=row["expense_id"],
            friend_id=row["friend_id"],
            friend_name=row["friend_name"],
            amount=row["amount"],
            is_settled=bool(row["is_settled"]),
            settled_at=row["settled_at"],
            created_at=row["created_at"]
        )
        for row in rows
    ]
