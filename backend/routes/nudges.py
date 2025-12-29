"""
Nudges API - Proactive AI suggestions and spending predictions for students.
"""

from fastapi import APIRouter, Depends
from datetime import date, datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field
from database import Database, get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/nudges", tags=["nudges"])


class Nudge(BaseModel):
    """A proactive suggestion or alert for the user."""
    id: str
    type: str  # 'budget_warning', 'spending_pattern', 'prediction', 'tip', 'streak'
    title: str
    message: str
    icon: str  # Lucide icon name
    color: str  # Tailwind color class
    priority: int = Field(default=1, ge=1, le=5)  # 1=low, 5=critical
    category: Optional[str] = None
    data: Optional[dict] = None


class NudgesResponse(BaseModel):
    """Response containing all nudges for the user."""
    nudges: List[Nudge]
    prediction: Optional[dict] = None


@router.get("/", response_model=NudgesResponse)
async def get_nudges(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get all proactive nudges for the current user.
    Includes budget warnings, spending patterns, and predictions.
    """
    nudges: List[Nudge] = []
    user_id = current_user["id"]
    
    today = date.today()
    month_start = today.replace(day=1)
    days_elapsed = (today - month_start).days + 1
    days_in_month = 30  # Simplified
    days_remaining = max(1, days_in_month - days_elapsed)
    
    async with db.get_connection() as conn:
        # Get user's budgets and spending
        budgets = await conn.execute(
            """
            SELECT b.category, b.monthly_limit, 
                   COALESCE(SUM(e.amount), 0) as spent
            FROM budgets b
            LEFT JOIN expenses e ON e.category = b.category 
                AND e.user_id = b.user_id
                AND e.date >= ?
            WHERE b.user_id = ?
            GROUP BY b.category, b.monthly_limit
            """,
            (month_start.isoformat(), user_id)
        )
        budget_rows = await budgets.fetchall()
        
        for row in budget_rows:
            category = row['category']
            limit = float(row['monthly_limit'])
            spent = float(row['spent'])
            percent_used = (spent / limit * 100) if limit > 0 else 0
            
            # Budget warning nudges at various thresholds
            if percent_used >= 100:
                nudges.append(Nudge(
                    id=f"budget_exceeded_{category}",
                    type="budget_warning",
                    title=f"Over Budget: {category}",
                    message=f"You've exceeded your {category} budget by GHS {(spent - limit):.2f}. Consider cutting back.",
                    icon="AlertTriangle",
                    color="red",
                    priority=5,
                    category=category,
                    data={"percent": percent_used, "overage": spent - limit}
                ))
            elif percent_used >= 80:
                nudges.append(Nudge(
                    id=f"budget_warning_{category}",
                    type="budget_warning",
                    title=f"Approaching Limit: {category}",
                    message=f"You've used {percent_used:.0f}% of your {category} budget with {days_remaining} days left.",
                    icon="TrendingUp",
                    color="amber",
                    priority=4,
                    category=category,
                    data={"percent": percent_used, "remaining": limit - spent}
                ))
            elif percent_used >= 50 and days_elapsed < 15:
                nudges.append(Nudge(
                    id=f"budget_caution_{category}",
                    type="budget_warning",
                    title=f"Spending Fast: {category}",
                    message=f"You've used {percent_used:.0f}% of your {category} budget in just {days_elapsed} days.",
                    icon="Zap",
                    color="yellow",
                    priority=3,
                    category=category,
                    data={"percent": percent_used}
                ))
        
        # Calculate spending prediction
        total_spent_query = await conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ?",
            (user_id, month_start.isoformat())
        )
        total_spent_row = await total_spent_query.fetchone()
        total_spent = float(total_spent_row['total']) if total_spent_row else 0
        
        # Get total budget
        total_budget_query = await conn.execute(
            "SELECT COALESCE(SUM(monthly_limit), 0) as total FROM budgets WHERE user_id = ?",
            (user_id,)
        )
        total_budget_row = await total_budget_query.fetchone()
        total_budget = float(total_budget_row['total']) if total_budget_row else 0
        
        # Daily spending rate and projection
        daily_rate = total_spent / days_elapsed if days_elapsed > 0 else 0
        projected_total = daily_rate * days_in_month
        projected_overage = projected_total - total_budget if total_budget > 0 else 0
        
        prediction = {
            "total_spent": total_spent,
            "daily_rate": daily_rate,
            "projected_total": projected_total,
            "total_budget": total_budget,
            "projected_overage": projected_overage,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining
        }
        
        # Add prediction nudge if overage expected
        if projected_overage > 0 and total_budget > 0:
            nudges.append(Nudge(
                id="spending_projection",
                type="prediction",
                title="Spending Projection",
                message=f"At this rate, you'll spend GHS {projected_total:.2f} this month — exceeding your budget by GHS {projected_overage:.2f}.",
                icon="TrendingUp",
                color="orange",
                priority=4,
                data=prediction
            ))
        
        # Spending pattern analysis - compare to last week
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)
        
        this_week_query = await conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ?",
            (user_id, week_ago.isoformat())
        )
        this_week_row = await this_week_query.fetchone()
        this_week = float(this_week_row['total']) if this_week_row else 0
        
        last_week_query = await conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ? AND date < ?",
            (user_id, two_weeks_ago.isoformat(), week_ago.isoformat())
        )
        last_week_row = await last_week_query.fetchone()
        last_week = float(last_week_row['total']) if last_week_row else 0
        
        if last_week > 0:
            week_change = ((this_week - last_week) / last_week) * 100
            if week_change > 30:
                nudges.append(Nudge(
                    id="weekly_spending_up",
                    type="spending_pattern",
                    title="Spending Increased",
                    message=f"Your spending is up {week_change:.0f}% compared to last week. Review your recent expenses.",
                    icon="ArrowUp",
                    color="red",
                    priority=3,
                    data={"this_week": this_week, "last_week": last_week, "change_percent": week_change}
                ))
            elif week_change < -20:
                nudges.append(Nudge(
                    id="weekly_spending_down",
                    type="spending_pattern",
                    title="Great Progress! 🎉",
                    message=f"Your spending is down {abs(week_change):.0f}% compared to last week. Keep it up!",
                    icon="TrendingDown",
                    color="emerald",
                    priority=2,
                    data={"this_week": this_week, "last_week": last_week, "change_percent": week_change}
                ))
        
        # Add helpful tips if no urgent nudges
        if len(nudges) == 0:
            nudges.append(Nudge(
                id="tip_tracking",
                type="tip",
                title="You're Doing Great! 💪",
                message="All your budgets are on track. Keep logging expenses to maintain your streak!",
                icon="CheckCircle",
                color="emerald",
                priority=1
            ))
    
    # Sort nudges by priority (highest first)
    nudges.sort(key=lambda n: n.priority, reverse=True)
    
    return NudgesResponse(nudges=nudges, prediction=prediction)
