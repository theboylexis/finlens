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
    SafeToSpendResponse,
)
from dependencies import require_auth

router = APIRouter()
security = HTTPBearer(auto_error=False)


def build_user_filter(user: Optional[dict]) -> tuple[str, list]:
    """Build SQL filter for user-specific data."""
    if user:
        return "user_id = ?", [user["id"]]
    return "1=1", []


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
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
    user: dict = Depends(require_auth)
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
    user: dict = Depends(require_auth)
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
    user: dict = Depends(require_auth)
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
    user: dict = Depends(require_auth)
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
            AND e.date >= ? AND e.date <= ? AND e.user_id = ?
        WHERE b.user_id = ?
        GROUP BY b.category, b.monthly_limit
        """,
        (start_date, end_date, user["id"], user["id"])
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


@router.get("/safe-to-spend", response_model=SafeToSpendResponse)
async def get_safe_to_spend(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """
    Calculate the safe amount to spend today.
    
    Formula: (Total Budget - Spent This Month - Goals Reserved) / Days Remaining
    Also tracks budget limits per category.
    """
    from models import CategoryBudgetStatus
    
    today = date.today()
    year = today.year
    month = today.month
    
    # Calculate date range for current month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    days_remaining = max((end_date - today).days + 1, 1)  # At least 1 day
    
    user_filter, user_params = build_user_filter(user)
    
    # Get total monthly income (instead of budgets)
    cursor = await db.execute(
        """
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM incomes 
        WHERE user_id = ? AND date >= ? AND date <= ?
        """, 
        (user["id"], start_date, end_date)
    )
    row = await cursor.fetchone()
    total_income = float(row["total"]) if row else 0.0
    
    # Get total spent this month
    cursor = await db.execute(
        f"""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        """,
        (start_date, end_date, *user_params)
    )
    row = await cursor.fetchone()
    spent_this_month = float(row["total"]) if row else 0.0
    
    # Get goals that need contributions this month (active goals with target dates)
    # Calculate monthly contribution needed: (target - current) / months until target
    cursor = await db.execute(
        """
        SELECT 
            target_amount,
            current_amount,
            target_date
        FROM savings_goals
        WHERE user_id = ? AND is_completed = 0 AND target_date IS NOT NULL
        """,
        (user["id"],)
    )
    goals_rows = await cursor.fetchall()
    
    goals_reserved = 0.0
    for goal in goals_rows:
        target = float(goal["target_amount"])
        current = float(goal["current_amount"])
        remaining_to_save = target - current
        
        if remaining_to_save > 0 and goal["target_date"]:
            # Convert target_date to date object if it's a string
            target_date = goal["target_date"]
            if isinstance(target_date, str):
                target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
            
            # Calculate months until target
            months_until = ((target_date.year - today.year) * 12 + 
                           (target_date.month - today.month))
            months_until = max(months_until, 1)
            
            # Monthly contribution needed
            monthly_contribution = remaining_to_save / months_until
            goals_reserved += monthly_contribution
    
    # === NEW: Budget tracking per category ===
    # Get all budgets with their spending for this month
    cursor = await db.execute(
        """
        SELECT 
            b.category,
            b.monthly_limit,
            COALESCE(SUM(e.amount), 0) as spent
        FROM budgets b
        LEFT JOIN expenses e ON b.category = e.category 
            AND e.date >= ? AND e.date <= ? AND e.user_id = ?
        WHERE b.user_id = ?
        GROUP BY b.category, b.monthly_limit
        """,
        (start_date, end_date, user["id"], user["id"])
    )
    budget_rows = await cursor.fetchall()
    
    categories_over_budget = []
    categories_near_limit = []
    total_budget_limit = 0.0
    
    for row in budget_rows:
        limit = float(row["monthly_limit"])
        spent = float(row["spent"])
        remaining = limit - spent
        percentage_used = (spent / limit * 100) if limit > 0 else 0
        
        total_budget_limit += limit
        
        # Determine status
        if spent > limit:
            status = "exceeded"
        elif percentage_used >= 80:
            status = "warning"
        else:
            status = "safe"
        
        category_status = CategoryBudgetStatus(
            category=row["category"],
            limit=round(limit, 2),
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            percentage_used=round(percentage_used, 1),
            status=status
        )
        
        if status == "exceeded":
            categories_over_budget.append(category_status)
        elif status == "warning":
            categories_near_limit.append(category_status)
    
    has_budget_warnings = len(categories_over_budget) > 0 or len(categories_near_limit) > 0
    
    # Calculate remaining income and safe to spend
    remaining_income = total_income - spent_this_month
    disposable = remaining_income - goals_reserved
    safe_to_spend_today = max(disposable / days_remaining, 0)
    
    # Get today's spending
    cursor = await db.execute(
        f"""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date = ? AND {user_filter}
        """,
        (today, *user_params)
    )
    row = await cursor.fetchone()
    spent_today = float(row["total"]) if row else 0.0
    
    # Calculate if over daily limit
    over_daily_limit = spent_today > safe_to_spend_today
    daily_overspend_amount = max(spent_today - safe_to_spend_today, 0)
    
    # Determine overall status (factor in budget warnings and daily overspend)
    if total_income == 0:
        status = "no_income"
    elif len(categories_over_budget) > 0:
        status = "danger"
    elif disposable < 0:
        status = "danger"
    elif over_daily_limit:
        status = "caution"
    elif len(categories_near_limit) > 0 or (spent_this_month / total_income * 100) > 80 if total_income > 0 else False:
        status = "caution"
    else:
        status = "healthy"
    
    return SafeToSpendResponse(
        safe_to_spend_today=round(safe_to_spend_today, 2),
        total_budget=round(total_income, 2),  # Renamed field still returns income
        spent_this_month=round(spent_this_month, 2),
        goals_reserved=round(goals_reserved, 2),
        remaining_budget=round(remaining_income, 2),  # Renamed field still returns remaining income
        days_remaining=days_remaining,
        status=status,
        spent_today=round(spent_today, 2),
        over_daily_limit=over_daily_limit,
        daily_overspend_amount=round(daily_overspend_amount, 2),
        categories_over_budget=categories_over_budget,
        categories_near_limit=categories_near_limit,
        total_budget_limit=round(total_budget_limit, 2),
        has_budget_warnings=has_budget_warnings
    )



@router.get("/weekly-summary")
async def get_weekly_summary(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """
    Get spending summary for this week vs last week.
    Week starts on Monday.
    """
    today = date.today()
    
    # Calculate this week's date range (Monday to Sunday)
    days_since_monday = today.weekday()
    this_week_start = today - timedelta(days=days_since_monday)
    this_week_end = today
    
    # Calculate last week's date range
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start - timedelta(days=1)
    
    user_filter, user_params = build_user_filter(user)
    
    # Get this week's spending
    cursor = await db.execute(
        f"""
        SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        """,
        (this_week_start, this_week_end, *user_params)
    )
    this_week = await cursor.fetchone()
    this_week_total = float(this_week["total"]) if this_week else 0.0
    this_week_count = this_week["count"] if this_week else 0
    
    # Get last week's spending
    cursor = await db.execute(
        f"""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        """,
        (last_week_start, last_week_end, *user_params)
    )
    last_week = await cursor.fetchone()
    last_week_total = float(last_week["total"]) if last_week else 0.0
    
    # Get top category this week
    cursor = await db.execute(
        f"""
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE date >= ? AND date <= ? AND {user_filter}
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
        """,
        (this_week_start, this_week_end, *user_params)
    )
    top_cat = await cursor.fetchone()
    top_category = top_cat["category"] if top_cat else None
    top_category_amount = float(top_cat["total"]) if top_cat else 0.0
    
    # Calculate week-over-week change
    if last_week_total > 0:
        change_percent = ((this_week_total - last_week_total) / last_week_total) * 100
    else:
        change_percent = 100 if this_week_total > 0 else 0
    
    return {
        "this_week_total": round(this_week_total, 2),
        "this_week_count": this_week_count,
        "last_week_total": round(last_week_total, 2),
        "change_percent": round(change_percent, 1),
        "top_category": top_category,
        "top_category_amount": round(top_category_amount, 2),
        "week_start": str(this_week_start),
        "week_end": str(this_week_end),
        "days_into_week": days_since_monday + 1
    }


