"""
Gamification API - Streaks, badges, and achievements for students.
"""

from fastapi import APIRouter, Depends
from datetime import date, datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field
from database import Database, get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


# Badge definitions
BADGES = {
    "first_expense": {
        "id": "first_expense",
        "name": "First Step",
        "description": "Logged your first expense",
        "icon": "Zap",
        "color": "emerald"
    },
    "streak_7": {
        "id": "streak_7",
        "name": "Week Warrior",
        "description": "7-day tracking streak",
        "icon": "Flame",
        "color": "orange"
    },
    "streak_30": {
        "id": "streak_30",
        "name": "Monthly Master",
        "description": "30-day tracking streak",
        "icon": "Trophy",
        "color": "amber"
    },
    "budget_master": {
        "id": "budget_master",
        "name": "Budget Master",
        "description": "Stayed under budget for a full month",
        "icon": "Shield",
        "color": "cyan"
    },
    "goal_crusher": {
        "id": "goal_crusher",
        "name": "Goal Crusher",
        "description": "Completed your first savings goal",
        "icon": "Target",
        "color": "purple"
    },
    "saver_10": {
        "id": "saver_10",
        "name": "Smart Saver",
        "description": "Saved 10% of your monthly income",
        "icon": "PiggyBank",
        "color": "pink"
    }
}


class Badge(BaseModel):
    """Badge data."""
    id: str
    name: str
    description: str
    icon: str
    color: str
    earned_at: Optional[datetime] = None
    is_earned: bool = False


class StreakInfo(BaseModel):
    """User's streak information."""
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date]
    streak_status: str  # 'active', 'at_risk', 'broken'


class GamificationStats(BaseModel):
    """Full gamification stats for user."""
    streak: StreakInfo
    badges: List[Badge]
    total_expenses_logged: int
    goals_completed: int
    months_under_budget: int


@router.get("/stats", response_model=GamificationStats)
async def get_gamification_stats(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get complete gamification stats for the current user.
    Includes streaks, badges, and achievement progress.
    """
    user_id = current_user["id"]
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    async with db.get_connection() as conn:
        # Calculate streak from expense history
        # Get all distinct dates with expenses, ordered by date desc
        dates_cursor = await conn.execute(
            """
            SELECT DISTINCT date FROM expenses 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT 365
            """,
            (user_id,)
        )
        date_rows = await dates_cursor.fetchall()
        
        # Calculate current streak
        expense_dates = []
        for row in date_rows:
            d = row['date']
            if isinstance(d, str):
                d = datetime.strptime(d, "%Y-%m-%d").date()
            expense_dates.append(d)
        
        current_streak = 0
        longest_streak = 0
        last_activity_date = expense_dates[0] if expense_dates else None
        
        if expense_dates:
            # Check if streak is active (today or yesterday)
            if expense_dates[0] == today or expense_dates[0] == yesterday:
                # Count consecutive days
                expected_date = expense_dates[0]
                for d in expense_dates:
                    if d == expected_date:
                        current_streak += 1
                        expected_date = d - timedelta(days=1)
                    else:
                        break
            
            # Calculate longest streak (simplified)
            temp_streak = 1
            for i in range(1, len(expense_dates)):
                if expense_dates[i] == expense_dates[i-1] - timedelta(days=1):
                    temp_streak += 1
                    longest_streak = max(longest_streak, temp_streak)
                else:
                    temp_streak = 1
            longest_streak = max(longest_streak, current_streak)
        
        # Determine streak status
        if current_streak > 0 and last_activity_date == today:
            streak_status = "active"
        elif last_activity_date == yesterday:
            streak_status = "at_risk"
        else:
            streak_status = "broken"
        
        streak_info = StreakInfo(
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_activity_date=last_activity_date,
            streak_status=streak_status
        )
        
        # Get total expenses count
        count_cursor = await conn.execute(
            "SELECT COUNT(*) as count FROM expenses WHERE user_id = ?",
            (user_id,)
        )
        count_row = await count_cursor.fetchone()
        total_expenses = count_row['count'] if count_row else 0
        
        # Get completed goals count
        goals_cursor = await conn.execute(
            "SELECT COUNT(*) as count FROM savings_goals WHERE user_id = ? AND is_completed = 1",
            (user_id,)
        )
        goals_row = await goals_cursor.fetchone()
        goals_completed = goals_row['count'] if goals_row else 0
        
        # Check badges earned
        badges_earned: List[Badge] = []
        
        # First Expense badge
        if total_expenses >= 1:
            badges_earned.append(Badge(
                **BADGES["first_expense"],
                is_earned=True,
                earned_at=datetime.now()
            ))
        
        # Streak badges
        if longest_streak >= 7:
            badges_earned.append(Badge(
                **BADGES["streak_7"],
                is_earned=True,
                earned_at=datetime.now()
            ))
        
        if longest_streak >= 30:
            badges_earned.append(Badge(
                **BADGES["streak_30"],
                is_earned=True,
                earned_at=datetime.now()
            ))
        
        # Goal Crusher badge
        if goals_completed >= 1:
            badges_earned.append(Badge(
                **BADGES["goal_crusher"],
                is_earned=True,
                earned_at=datetime.now()
            ))
        
        # Add unearned badges
        earned_ids = {b.id for b in badges_earned}
        for badge_id, badge_data in BADGES.items():
            if badge_id not in earned_ids:
                badges_earned.append(Badge(**badge_data, is_earned=False))
        
        return GamificationStats(
            streak=streak_info,
            badges=badges_earned,
            total_expenses_logged=total_expenses,
            goals_completed=goals_completed,
            months_under_budget=0  # TODO: Calculate properly
        )


@router.post("/check-achievements")
async def check_achievements(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Check for newly earned achievements.
    Call this after adding an expense.
    """
    # Get current stats
    stats = await get_gamification_stats(current_user, db)
    
    # Check for newly earned badges
    new_badges = [b for b in stats.badges if b.is_earned]
    
    return {
        "streak": stats.streak,
        "badges_earned": len(new_badges),
        "new_badges": new_badges[:3]  # Return up to 3 newest
    }
