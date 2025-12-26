"""
Analytics routes for FinLens AI.
Provides spending analysis and aggregations.
"""

from fastapi import APIRouter, Depends, Query, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import date, datetime, timedelta
import aiosqlite

from database import get_db
from models import (
    SpendingByCategory,
    SpendingTrend,
    AnalyticsSummary,
    BudgetStatus,
)
from dependencies import get_current_user

router = APIRouter()
security = HTTPBearer(auto_error=False)


def build_user_filter(user: Optional[dict]) -> tuple[str, list]:
    """Build SQL filter for user-specific or legacy data."""
    if user:
        return "(user_id = ? OR user_id IS NULL)", [user["id"]]
    return "1=1", []


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user)
):
    """Get overall analytics summary for a date range."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        """,
        (start_date, end_date, *user_params)
    )
    row = await cursor.fetchone()
    total_expenses = row["total"]
    expense_count = row["count"]
    average_expense = total_expenses / expense_count if expense_count > 0 else 0
    
    cursor = await db.execute(
        f"""
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
        """,
        (start_date, end_date, *user_params)
    )
    top_row = await cursor.fetchone()
    
    if top_row:
        top_category = top_row["category"]
        top_category_amount = top_row["total"]
    else:
        top_category = "None"
        top_category_amount = 0
    
    return AnalyticsSummary(
        total_expenses=total_expenses,
        expense_count=expense_count,
        average_expense=average_expense,
        top_category=top_category,
        top_category_amount=top_category_amount,
        date_range_start=start_date,
        date_range_end=end_date
    )


@router.get("/by-category", response_model=List[SpendingByCategory])
async def get_spending_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user)
):
    """Get spending aggregated by category."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        """,
        (start_date, end_date, *user_params)
    )
    total_row = await cursor.fetchone()
    grand_total = total_row["total"]
    
    cursor = await db.execute(
        f"""
        SELECT 
            category,
            SUM(amount) as total,
            COUNT(*) as count
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        GROUP BY category
        ORDER BY total DESC
        """,
        (start_date, end_date, *user_params)
    )
    rows = await cursor.fetchall()
    
    results = []
    for row in rows:
        percentage = (row["total"] / grand_total * 100) if grand_total > 0 else 0
        results.append(SpendingByCategory(
            category=row["category"],
            total=row["total"],
            count=row["count"],
            percentage=percentage
        ))
    
    return results


@router.get("/trends", response_model=List[SpendingTrend])
async def get_spending_trends(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user)
):
    """Get daily spending trends over time."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT 
            date,
            SUM(amount) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        GROUP BY date
        ORDER BY date ASC
        """,
        (start_date, end_date, *user_params)
    )
    rows = await cursor.fetchall()
    
    return [
        SpendingTrend(date=row["date"], total=row["total"])
        for row in rows
    ]


@router.get("/heatmap")
async def get_spending_heatmap(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: aiosqlite.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user)
):
    """Get spending heatmap data for calendar visualization."""
    if not year or not month:
        today = date.today()
        year = today.year
        month = today.month
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT 
            date,
            SUM(amount) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        GROUP BY date
        ORDER BY date ASC
        """,
        (start_date, end_date, *user_params)
    )
    rows = await cursor.fetchall()
    
    heatmap_data = {}
    for row in rows:
        heatmap_data[str(row["date"])] = row["total"]
    
    return {
        "year": year,
        "month": month,
        "data": heatmap_data
    }


@router.get("/budget-status", response_model=List[BudgetStatus])
async def get_budget_status(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user)
):
    """Get budget status for all categories."""
    if not year or not month:
        today = date.today()
        year = today.year
        month = today.month
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    today = date.today()
    if today.year == year and today.month == month:
        days_remaining = (end_date - today).days + 1
    else:
        days_remaining = 0
    
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT 
            b.category,
            b.monthly_limit,
            COALESCE(SUM(e.amount), 0) as current_spending
        FROM budgets b
        LEFT JOIN expenses e ON b.category = e.category 
            AND e.date >= ? AND e.date <= ? AND {user_filter}
        GROUP BY b.category, b.monthly_limit
        """,
        (start_date, end_date, *user_params)
    )
    rows = await cursor.fetchall()
    
    results = []
    for row in rows:
        monthly_limit = row["monthly_limit"]
        current_spending = row["current_spending"]
        remaining = monthly_limit - current_spending
        percentage_used = (current_spending / monthly_limit * 100) if monthly_limit > 0 else 0
        is_over_budget = current_spending > monthly_limit
        daily_allowance = (remaining / days_remaining) if days_remaining > 0 else 0
        
        results.append(BudgetStatus(
            category=row["category"],
            monthly_limit=monthly_limit,
            current_spending=current_spending,
            remaining=remaining,
            percentage_used=percentage_used,
            is_over_budget=is_over_budget,
            daily_allowance=daily_allowance
        ))
    
    return results
