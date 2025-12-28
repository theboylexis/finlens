"""
Alert service for managing spending alerts.
"""

from datetime import datetime
import aiosqlite


async def check_and_create_budget_alerts(
    db: aiosqlite.Connection,
    category: str,
    spent: float,
    budget_limit: float
) -> list[dict]:
    """
    Check if spending has crossed a threshold and create alerts if needed.
    Returns list of newly created alerts.
    """
    if budget_limit <= 0:
        return []
    
    percentage = (spent / budget_limit) * 100
    current_month = datetime.now().strftime("%Y-%m")
    new_alerts = []
    
    # Define thresholds and their messages
    thresholds = [
        (50, "📊", "50% of budget used", f"You've used half of your {category} budget."),
        (80, "⚠️", "80% of budget used", f"Warning: You've used 80% of your {category} budget!"),
        (100, "🚨", "Budget exceeded!", f"Alert: You've exceeded your {category} budget!"),
    ]
    
    for threshold, emoji, title, message in thresholds:
        if percentage >= threshold:
            # Check if we already triggered this threshold this month
            cursor = await db.execute(
                """
                SELECT id FROM budget_alert_tracking 
                WHERE category = ? AND threshold_percent = ? AND month = ?
                """,
                (category, threshold, current_month)
            )
            existing = await cursor.fetchone()
            
            if not existing:
                # Create the alert
                cursor = await db.execute(
                    """
                    INSERT INTO alerts (type, title, message, category, threshold_percent)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    ("budget_warning", f"{emoji} {title}", message, category, threshold)
                )
                
                # Mark this threshold as triggered for the month
                await db.execute(
                    """
                    INSERT OR IGNORE INTO budget_alert_tracking (category, threshold_percent, month)
                    VALUES (?, ?, ?)
                    """,
                    (category, threshold, current_month)
                )
                
                new_alerts.append({
                    "type": "budget_warning",
                    "title": f"{emoji} {title}",
                    "message": message,
                    "category": category,
                    "threshold_percent": threshold
                })
    
    if new_alerts:
        await db.commit()
    
    return new_alerts


async def get_unread_alerts(db: aiosqlite.Connection, limit: int = 10) -> list[dict]:
    """Get unread and not dismissed alerts."""
    cursor = await db.execute(
        """
        SELECT * FROM alerts 
        WHERE is_dismissed = FALSE 
        ORDER BY created_at DESC 
        LIMIT ?
        """,
        (limit,)
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_unread_count(db: aiosqlite.Connection) -> int:
    """Get count of unread alerts."""
    cursor = await db.execute(
        "SELECT COUNT(*) FROM alerts WHERE is_read = FALSE AND is_dismissed = FALSE"
    )
    row = await cursor.fetchone()
    return row[0] if row else 0


async def mark_alert_read(db: aiosqlite.Connection, alert_id: int) -> bool:
    """Mark an alert as read."""
    cursor = await db.execute(
        "UPDATE alerts SET is_read = TRUE WHERE id = ?",
        (alert_id,)
    )
    await db.commit()
    return cursor.rowcount > 0


async def dismiss_alert(db: aiosqlite.Connection, alert_id: int) -> bool:
    """Dismiss an alert."""
    cursor = await db.execute(
        "UPDATE alerts SET is_dismissed = TRUE WHERE id = ?",
        (alert_id,)
    )
    await db.commit()
    return cursor.rowcount > 0


async def mark_all_read(db: aiosqlite.Connection) -> int:
    """Mark all alerts as read. Returns count of updated alerts."""
    cursor = await db.execute(
        "UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE"
    )
    await db.commit()
    return cursor.rowcount
