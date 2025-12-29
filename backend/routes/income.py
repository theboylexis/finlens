"""
Income API routes for tracking earnings.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime, timedelta
import aiosqlite

from database import get_db
from models import IncomeCreate, IncomeResponse
from dependencies import get_current_user, require_auth

router = APIRouter()


@router.get("/", response_model=List[IncomeResponse])
async def list_income(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """List all income entries."""
    query = "SELECT * FROM incomes WHERE user_id = ?"
    params = [user["id"]]
    
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
        
    query += " ORDER BY date DESC LIMIT ?"
    params.append(limit)
    
    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()
    
    return [
        IncomeResponse(
            id=row["id"],
            user_id=row["user_id"],
            amount=row["amount"],
            source=row["source"],
            category=row["category"],
            date=row["date"],
            is_recurring=bool(row["is_recurring"]),
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.post("/", response_model=IncomeResponse, status_code=201)
async def create_income(
    income: IncomeCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Add a new income entry."""
    try:
        cursor = await db.execute(
            """
            INSERT INTO incomes (user_id, amount, source, category, date, is_recurring)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                income.amount,
                income.source,
                income.category,
                income.date,
                1 if income.is_recurring else 0
            )
        )
        await db.commit()
        
        new_id = cursor.lastrowid
        
        # Fetch created row - use ORDER BY to get most recent if lastrowid failed
        if new_id:
            fetch_cursor = await db.execute("SELECT * FROM incomes WHERE id = ?", (new_id,))
        else:
            # Fallback: fetch most recent for this user
            fetch_cursor = await db.execute(
                "SELECT * FROM incomes WHERE user_id = ? ORDER BY id DESC LIMIT 1", 
                (user["id"],)
            )
        row = await fetch_cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Failed to fetch created income")
        
        return IncomeResponse(
            id=row["id"],
            user_id=row["user_id"],
            amount=float(row["amount"]),
            source=row["source"],
            category=row["category"],
            date=row["date"],
            is_recurring=bool(row["is_recurring"]),
            created_at=row["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error creating income: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create income: {str(e)}")


@router.delete("/{income_id}", status_code=204)
async def delete_income(
    income_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Delete an income entry."""
    # Verify ownership
    cursor = await db.execute(
        "SELECT id FROM incomes WHERE id = ? AND user_id = ?",
        (income_id, user["id"])
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Income not found")
    
    await db.execute("DELETE FROM incomes WHERE id = ?", (income_id,))
    await db.commit()


@router.get("/summary")
async def get_income_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get total income summary."""
    if not year:
        year = date.today().year
    if not month:
        month = date.today().month
        
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
        
    cursor = await db.execute(
        """
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM incomes 
        WHERE user_id = ? AND date >= ? AND date <= ?
        """,
        (user["id"], start_date, end_date)
    )
    row = await cursor.fetchone()
    total = row["total"] if row else 0
    
    return {
        "total_income": total,
        "month": month,
        "year": year
    }
