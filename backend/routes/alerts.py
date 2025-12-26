"""
Alerts API routes for spending notifications.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, date
from calendar import monthrange
import aiosqlite

from database import get_db
from models import AlertResponse, AlertsSummary, BudgetStatusWithAlert
from services.alerts import get_unread_alerts, get_unread_count, mark_alert_read, dismiss_alert, mark_all_read

router = APIRouter()


def row_to_alert(row: aiosqlite.Row) -> AlertResponse:
    """Convert database row to AlertResponse."""
    return AlertResponse(
        id=row["id"],
        type=row["type"],
        title=row["title"],
        message=row["message"],
        category=row["category"],
        threshold_percent=row["threshold_percent"],
        is_read=bool(row["is_read"]),
        is_dismissed=bool(row["is_dismissed"]),
        created_at=row["created_at"]
    )


# ============================================================================
# Alerts CRUD
# ============================================================================

@router.get("/", response_model=AlertsSummary)
async def list_alerts(
    limit: int = 10,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get alerts summary with unread count."""
    alerts = await get_unread_alerts(db, limit)
    unread_count = await get_unread_count(db)
    
    return AlertsSummary(
        unread_count=unread_count,
        alerts=[row_to_alert(a) if isinstance(a, aiosqlite.Row) else AlertResponse(**{
            **a,
            "is_read": bool(a.get("is_read", 0)),
            "is_dismissed": bool(a.get("is_dismissed", 0))
        }) for a in alerts]
    )


@router.patch("/{alert_id}/read")
async def mark_read(
    alert_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Mark an alert as read."""
    success = await mark_alert_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "ok"}


@router.delete("/{alert_id}")
async def dismiss(
    alert_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Dismiss an alert."""
    success = await dismiss_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "ok"}


@router.post("/mark-all-read")
async def mark_all_alerts_read(db: aiosqlite.Connection = Depends(get_db)):
    """Mark all alerts as read."""
    count = await mark_all_read(db)
    return {"status": "ok", "marked_read": count}


# ============================================================================
# Budget Status with Alerts
# ============================================================================

@router.get("/budget-status", response_model=List[BudgetStatusWithAlert])
async def get_budget_status_with_alerts(
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get all budget statuses with alert levels."""
    # Get current month boundaries
    today = date.today()
    month_start = date(today.year, today.month, 1)
    days_in_month = monthrange(today.year, today.month)[1]
    month_end = date(today.year, today.month, days_in_month)
    days_remaining = max(1, (month_end - today).days + 1)
    
    # Get all budgets with current spending
    cursor = await db.execute(
        """
        SELECT 
            b.category,
            b.monthly_limit,
            COALESCE(SUM(e.amount), 0) as spent
        FROM budgets b
        LEFT JOIN expenses e ON e.category = b.category 
            AND e.date >= ? AND e.date <= ?
        GROUP BY b.category, b.monthly_limit
        ORDER BY b.category
        """,
        (month_start.isoformat(), month_end.isoformat())
    )
    rows = await cursor.fetchall()
    
    results = []
    for row in rows:
        category = row["category"]
        monthly_limit = row["monthly_limit"]
        spent = row["spent"]
        remaining = max(0, monthly_limit - spent)
        percentage = (spent / monthly_limit * 100) if monthly_limit > 0 else 0
        daily_allowance = remaining / days_remaining if days_remaining > 0 else 0
        
        # Determine alert level
        if percentage >= 100:
            alert_level = "exceeded"
            alert_message = f"Over budget by GH₵{spent - monthly_limit:.2f}"
        elif percentage >= 80:
            alert_level = "danger"
            alert_message = f"Only GH₵{remaining:.2f} remaining"
        elif percentage >= 50:
            alert_level = "warning"
            alert_message = f"GH₵{remaining:.2f} left for {days_remaining} days"
        else:
            alert_level = "safe"
            alert_message = None
        
        results.append(BudgetStatusWithAlert(
            category=category,
            monthly_limit=monthly_limit,
            current_spending=spent,
            remaining=remaining,
            percentage_used=round(percentage, 1),
            is_over_budget=percentage >= 100,
            daily_allowance=round(daily_allowance, 2),
            alert_level=alert_level,
            alert_message=alert_message
        ))
    
    return results


# ============================================================================
# Budget CRUD
# ============================================================================

@router.get("/budgets")
async def get_all_budgets(db: aiosqlite.Connection = Depends(get_db)):
    """Get all budgets."""
    cursor = await db.execute("SELECT id, category, monthly_limit FROM budgets ORDER BY category")
    rows = await cursor.fetchall()
    return [{"id": r["id"], "category": r["category"], "monthly_limit": r["monthly_limit"]} for r in rows]


@router.post("/budgets")
async def create_budget(
    category: str,
    monthly_limit: float,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create or update a budget for a category."""
    await db.execute(
        """
        INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)
        ON CONFLICT(category) DO UPDATE SET monthly_limit = ?, updated_at = CURRENT_TIMESTAMP
        """,
        (category, monthly_limit, monthly_limit)
    )
    await db.commit()
    return {"status": "ok", "category": category, "monthly_limit": monthly_limit}


@router.delete("/budgets/{category}")
async def delete_budget(category: str, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a budget."""
    await db.execute("DELETE FROM budgets WHERE category = ?", (category,))
    await db.commit()
    return {"status": "ok"}

