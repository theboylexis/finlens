"""
Subscriptions routes for FinLens AI.
Track recurring subscriptions and get renewal reminders.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date, datetime, timedelta
import aiosqlite

from database import get_db
from models import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
)
from dependencies import require_auth

router = APIRouter()


def calculate_monthly_cost(amount: float, billing_cycle: str) -> float:
    """Convert subscription cost to monthly equivalent."""
    if billing_cycle == "weekly":
        return amount * 4.33  # Average weeks per month
    elif billing_cycle == "yearly":
        return amount / 12
    return amount  # monthly


def calculate_days_until(renewal_date: date) -> int:
    """Calculate days until renewal."""
    today = date.today()
    if isinstance(renewal_date, str):
        renewal_date = datetime.strptime(renewal_date, "%Y-%m-%d").date()
    return (renewal_date - today).days


def build_user_filter(user: Optional[dict]) -> tuple[str, list]:
    """Build SQL filter for user-specific data."""
    if user:
        return "user_id = ?", [user["id"]]
    return "1=1", []


@router.get("/", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    active_only: bool = True,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get all subscriptions."""
    user_filter, user_params = build_user_filter(user)
    
    active_filter = "AND is_active = 1" if active_only else ""
    
    cursor = await db.execute(
        f"""
        SELECT * FROM subscriptions
        WHERE {user_filter} {active_filter}
        ORDER BY next_renewal ASC
        """,
        tuple(user_params)
    )
    rows = await cursor.fetchall()
    
    results = []
    for row in rows:
        sub_dict = dict(row)
        sub_dict["days_until_renewal"] = calculate_days_until(sub_dict["next_renewal"])
        sub_dict["monthly_cost"] = calculate_monthly_cost(
            float(sub_dict["amount"]), 
            sub_dict["billing_cycle"]
        )
        # Handle boolean conversion for SQLite
        sub_dict["is_active"] = bool(sub_dict["is_active"])
        results.append(SubscriptionResponse(**sub_dict))
    
    return results


@router.get("/upcoming", response_model=List[SubscriptionResponse])
async def get_upcoming_renewals(
    days: int = 7,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get subscriptions renewing within specified days."""
    user_filter, user_params = build_user_filter(user)
    
    today = date.today()
    end_date = today + timedelta(days=days)
    
    cursor = await db.execute(
        f"""
        SELECT * FROM subscriptions
        WHERE {user_filter}
        AND is_active = 1
        AND next_renewal >= ?
        AND next_renewal <= ?
        ORDER BY next_renewal ASC
        """,
        (*user_params, today, end_date)
    )
    rows = await cursor.fetchall()
    
    results = []
    for row in rows:
        sub_dict = dict(row)
        sub_dict["days_until_renewal"] = calculate_days_until(sub_dict["next_renewal"])
        sub_dict["monthly_cost"] = calculate_monthly_cost(
            float(sub_dict["amount"]), 
            sub_dict["billing_cycle"]
        )
        sub_dict["is_active"] = bool(sub_dict["is_active"])
        results.append(SubscriptionResponse(**sub_dict))
    
    return results


@router.get("/summary")
async def get_subscriptions_summary(
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Get subscription spending summary."""
    user_filter, user_params = build_user_filter(user)
    
    cursor = await db.execute(
        f"""
        SELECT * FROM subscriptions
        WHERE {user_filter} AND is_active = 1
        """,
        tuple(user_params)
    )
    rows = await cursor.fetchall()
    
    total_monthly = 0.0
    total_yearly = 0.0
    
    for row in rows:
        monthly = calculate_monthly_cost(float(row["amount"]), row["billing_cycle"])
        total_monthly += monthly
        total_yearly += monthly * 12
    
    return {
        "total_monthly_cost": round(total_monthly, 2),
        "total_yearly_cost": round(total_yearly, 2),
        "subscription_count": len(rows)
    }


@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Create a new subscription."""
    user_id = user["id"]
    
    cursor = await db.execute(
        """
        INSERT INTO subscriptions 
        (user_id, name, amount, billing_cycle, next_renewal, category, reminder_days, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            subscription.name,
            subscription.amount,
            subscription.billing_cycle.value,
            subscription.next_renewal,
            subscription.category,
            subscription.reminder_days,
            subscription.notes
        )
    )
    await db.commit()
    
    # Fetch the created subscription
    cursor = await db.execute(
        "SELECT * FROM subscriptions WHERE id = ?",
        (cursor.lastrowid,)
    )
    row = await cursor.fetchone()
    
    sub_dict = dict(row)
    sub_dict["days_until_renewal"] = calculate_days_until(sub_dict["next_renewal"])
    sub_dict["monthly_cost"] = calculate_monthly_cost(
        float(sub_dict["amount"]), 
        sub_dict["billing_cycle"]
    )
    sub_dict["is_active"] = bool(sub_dict["is_active"])
    
    return SubscriptionResponse(**sub_dict)


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    subscription: SubscriptionUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Update an existing subscription."""
    # Build update query dynamically
    update_fields = []
    update_values = []
    
    if subscription.name is not None:
        update_fields.append("name = ?")
        update_values.append(subscription.name)
    if subscription.amount is not None:
        update_fields.append("amount = ?")
        update_values.append(subscription.amount)
    if subscription.billing_cycle is not None:
        update_fields.append("billing_cycle = ?")
        update_values.append(subscription.billing_cycle.value)
    if subscription.next_renewal is not None:
        update_fields.append("next_renewal = ?")
        update_values.append(subscription.next_renewal)
    if subscription.category is not None:
        update_fields.append("category = ?")
        update_values.append(subscription.category)
    if subscription.is_active is not None:
        update_fields.append("is_active = ?")
        update_values.append(1 if subscription.is_active else 0)
    if subscription.reminder_days is not None:
        update_fields.append("reminder_days = ?")
        update_values.append(subscription.reminder_days)
    if subscription.notes is not None:
        update_fields.append("notes = ?")
        update_values.append(subscription.notes)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    update_values.append(subscription_id)
    
    await db.execute(
        f"UPDATE subscriptions SET {', '.join(update_fields)} WHERE id = ?",
        tuple(update_values)
    )
    await db.commit()
    
    # Fetch updated subscription
    cursor = await db.execute(
        "SELECT * FROM subscriptions WHERE id = ?",
        (subscription_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub_dict = dict(row)
    sub_dict["days_until_renewal"] = calculate_days_until(sub_dict["next_renewal"])
    sub_dict["monthly_cost"] = calculate_monthly_cost(
        float(sub_dict["amount"]), 
        sub_dict["billing_cycle"]
    )
    sub_dict["is_active"] = bool(sub_dict["is_active"])
    
    return SubscriptionResponse(**sub_dict)


@router.delete("/{subscription_id}")
async def delete_subscription(
    subscription_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """Delete a subscription."""
    cursor = await db.execute(
        "SELECT id FROM subscriptions WHERE id = ?",
        (subscription_id,)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    await db.execute(
        "DELETE FROM subscriptions WHERE id = ?",
        (subscription_id,)
    )
    await db.commit()
    
    return {"message": "Subscription deleted"}
