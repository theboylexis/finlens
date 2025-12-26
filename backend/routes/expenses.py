"""
Expense routes for FinLens AI.
Handles CRUD operations for expenses with AI categorization.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, date, timedelta
import aiosqlite
import time

from database import get_db
from models import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    CategorySuggestion,
    CategorizationMethod,
)
from services.categorizer import get_categorizer
from services.alerts import check_and_create_budget_alerts
from routes.auth import get_current_user
from calendar import monthrange

router = APIRouter()


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense: ExpenseCreate,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Create a new expense with AI categorization.
    
    If category is not provided, uses hybrid categorization (regex + AI).
    Logs AI operations to audit trail.
    """
    categorizer = get_categorizer()
    
    # Determine category
    if expense.category:
        # Manual category provided
        category = expense.category
        ai_suggested_category = None
        confidence_score = None
        categorization_method = CategorizationMethod.MANUAL.value
        user_overridden = False
    else:
        # Use AI categorization
        start_time = time.time()
        suggestion: CategorySuggestion = await categorizer.categorize(
            expense.description,
            expense.amount
        )
        latency_ms = int((time.time() - start_time) * 1000)
        
        category = suggestion.category
        ai_suggested_category = suggestion.category
        confidence_score = suggestion.confidence
        categorization_method = suggestion.method.value
        user_overridden = False
        
        # Log AI operation to audit trail
        await db.execute(
            """
            INSERT INTO ai_audit_log (
                operation_type, input_text, output_text, model_used,
                confidence_score, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "categorize",
                expense.description,
                f"{category} ({suggestion.reasoning})",
                "gemini-2.0-flash-exp" if suggestion.method == CategorizationMethod.AI else "regex",
                confidence_score,
                latency_ms
            )
        )
    
    # Insert expense
    user_id = current_user["id"] if current_user else None
    cursor = await db.execute(
        """
        INSERT INTO expenses (
            user_id, amount, description, category, date, payment_method,
            ai_suggested_category, confidence_score, categorization_method,
            user_overridden
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            expense.amount,
            expense.description,
            category,
            expense.date,
            expense.payment_method,
            ai_suggested_category,
            confidence_score,
            categorization_method,
            user_overridden
        )
    )
    
    await db.commit()
    
    # Fetch created expense
    expense_id = cursor.lastrowid
    cursor = await db.execute(
        "SELECT * FROM expenses WHERE id = ?",
        (expense_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create expense"
        )
    
    # Check budget alerts for this category
    today = expense.date
    month_start = date(today.year, today.month, 1)
    days_in_month = monthrange(today.year, today.month)[1]
    month_end = date(today.year, today.month, days_in_month)
    
    # Get budget for this category
    budget_cursor = await db.execute(
        "SELECT monthly_limit FROM budgets WHERE category = ?",
        (category,)
    )
    budget_row = await budget_cursor.fetchone()
    
    if budget_row:
        # Calculate total spent this month for this category
        spent_cursor = await db.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses 
            WHERE category = ? AND date >= ? AND date <= ?
            """,
            (category, month_start.isoformat(), month_end.isoformat())
        )
        spent_row = await spent_cursor.fetchone()
        total_spent = spent_row["total"] if spent_row else 0
        
        # Check and create alerts if thresholds crossed
        await check_and_create_budget_alerts(
            db, category, total_spent, budget_row["monthly_limit"]
        )
    
    return dict(row)


@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get expenses with optional filtering.
    
    Query parameters:
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return (max 100)
    - category: Filter by category
    - start_date: Filter by start date (inclusive)
    - end_date: Filter by end date (inclusive)
    """
    # Build query with optional user filtering
    query = "SELECT * FROM expenses WHERE 1=1"
    params = []
    
    # Filter by user if authenticated
    if current_user:
        query += " AND (user_id = ? OR user_id IS NULL)"
        params.append(current_user["id"])
    
    if category:
        query += " AND category = ?"
        params.append(category)
    
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    query += " ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?"
    params.extend([min(limit, 100), skip])
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    return [dict(row) for row in rows]


@router.get("/suggest-category", response_model=CategorySuggestion)
async def suggest_category(description: str):
    """
    Suggest a category for an expense description.
    
    Useful for real-time suggestions in the UI.
    """
    if not description or not description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot be empty"
        )
    
    categorizer = get_categorizer()
    suggestion = await categorizer.categorize(description.strip())
    
    return suggestion


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get a specific expense by ID."""
    cursor = await db.execute(
        "SELECT * FROM expenses WHERE id = ?",
        (expense_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found"
        )
    
    return dict(row)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Update an expense.
    
    If category is changed, marks as user_overridden.
    """
    # Check if expense exists
    cursor = await db.execute(
        "SELECT * FROM expenses WHERE id = ?",
        (expense_id,)
    )
    existing = await cursor.fetchone()
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found"
        )
    
    # Build update query
    updates = []
    params = []
    
    if expense_update.amount is not None:
        updates.append("amount = ?")
        params.append(expense_update.amount)
    
    if expense_update.description is not None:
        updates.append("description = ?")
        params.append(expense_update.description)
    
    if expense_update.category is not None:
        updates.append("category = ?")
        params.append(expense_update.category)
        # Mark as overridden if category changed
        if expense_update.category != existing["category"]:
            updates.append("user_overridden = ?")
            params.append(True)
    
    if expense_update.date is not None:
        updates.append("date = ?")
        params.append(expense_update.date)
    
    if expense_update.payment_method is not None:
        updates.append("payment_method = ?")
        params.append(expense_update.payment_method)
    
    if not updates:
        # No updates provided, return existing
        return dict(existing)
    
    # Add updated_at
    updates.append("updated_at = ?")
    params.append(datetime.now())
    
    # Execute update
    params.append(expense_id)
    query = f"UPDATE expenses SET {', '.join(updates)} WHERE id = ?"
    
    await db.execute(query, params)
    await db.commit()
    
    # Fetch updated expense
    cursor = await db.execute(
        "SELECT * FROM expenses WHERE id = ?",
        (expense_id,)
    )
    row = await cursor.fetchone()
    
    return dict(row)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete an expense."""
    cursor = await db.execute(
        "SELECT id FROM expenses WHERE id = ?",
        (expense_id,)
    )
    existing = await cursor.fetchone()
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense {expense_id} not found"
        )
    
    await db.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    await db.commit()
    
    return None


# ============================================================================
# Demo Data
# ============================================================================

DEMO_EXPENSES = [
    ("Chipotle lunch", 12.45, "Food & Dining", -0),
    ("Uber to campus", 8.50, "Transportation", -1),
    ("Amazon textbooks", 89.99, "Education", -2),
    ("Netflix subscription", 15.99, "Entertainment", -3),
    ("Grocery store", 67.32, "Food & Dining", -4),
    ("Gas station", 45.00, "Transportation", -5),
    ("Coffee shop", 5.75, "Food & Dining", -6),
    ("Electric bill", 85.00, "Bills & Utilities", -7),
    ("Spotify Premium", 10.99, "Entertainment", -8),
    ("Pizza delivery", 24.99, "Food & Dining", -9),
    ("Gym membership", 29.99, "Personal Care", -10),
    ("Target supplies", 42.50, "Shopping", -12),
    ("Movie tickets", 15.00, "Entertainment", -14),
    ("Starbucks", 6.50, "Food & Dining", -15),
    ("Bus pass", 50.00, "Transportation", -16),
    ("Pharmacy", 18.75, "Healthcare", -18),
    ("Fast food", 9.99, "Food & Dining", -20),
    ("Internet bill", 59.99, "Bills & Utilities", -21),
    ("Gaming subscription", 14.99, "Entertainment", -22),
    ("Groceries", 55.00, "Food & Dining", -25),
]


@router.post("/demo/seed")
async def seed_demo_data(db: aiosqlite.Connection = Depends(get_db)):
    """Populate database with realistic demo data for showcasing."""
    import random
    
    today = date.today()
    added = 0
    
    for desc, amount, category, days_ago in DEMO_EXPENSES:
        expense_date = today + timedelta(days=days_ago)
        
        await db.execute(
            """
            INSERT INTO expenses (
                amount, description, category, date,
                categorization_method, user_overridden
            ) VALUES (?, ?, ?, ?, 'demo', 0)
            """,
            (amount, desc, category, expense_date.isoformat())
        )
        added += 1
    
    # Add some budgets
    budgets = [
        ("Food & Dining", 300.00),
        ("Transportation", 100.00),
        ("Entertainment", 75.00),
        ("Shopping", 150.00),
    ]
    
    for category, limit in budgets:
        await db.execute(
            "INSERT OR REPLACE INTO budgets (category, monthly_limit) VALUES (?, ?)",
            (category, limit)
        )
    
    # Add a savings goal
    await db.execute(
        """
        INSERT INTO savings_goals (name, target_amount, current_amount, target_date, icon, color)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("Spring Break Trip", 500.00, 175.00, (today + timedelta(days=90)).isoformat(), "🏖️", "#10b981")
    )
    
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Added {added} demo expenses, {len(budgets)} budgets, and 1 savings goal"
    }
