"""
Database configuration and models for FinLens AI.
Uses SQLite with async support via aiosqlite.
"""

import aiosqlite
from typing import Optional
from contextlib import asynccontextmanager

DATABASE_URL = "finlens.db"

# SQL Schema
SCHEMA = """
-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    payment_method TEXT,
    
    -- AI metadata
    ai_suggested_category TEXT,
    confidence_score REAL,
    categorization_method TEXT, -- 'regex', 'ai', 'manual'
    user_overridden INTEGER DEFAULT 0, -- SQLite uses INTEGER for BOOLEAN
    
    -- OCR metadata (if from receipt)
    raw_ocr_text TEXT,
    receipt_image_path TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    monthly_limit REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Audit Log table
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER,
    operation_type TEXT NOT NULL, -- 'categorize', 'query', 'insight'
    
    -- Input/Output
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    
    -- AI metadata
    model_used TEXT NOT NULL, -- 'gemini-pro', 'regex', etc.
    confidence_score REAL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Timing
    latency_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_expense ON ai_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ai_audit_log(timestamp);

-- Categories table (fixed set)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    regex_patterns TEXT, -- JSON array of patterns
    description TEXT
);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date DATE,
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#6366f1',
    is_completed INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal Contributions table
CREATE TABLE IF NOT EXISTS goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON savings_goals(is_completed);

-- Spending Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,              -- 'budget_warning', 'weekly_summary', 'goal_reached'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,                   -- Category for budget alerts
    threshold_percent INTEGER,       -- 50, 80, 100
    is_read INTEGER DEFAULT 0,
    is_dismissed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- Budget Alert Settings table (tracks which thresholds have been triggered this month)
CREATE TABLE IF NOT EXISTS budget_alert_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    threshold_percent INTEGER NOT NULL,  -- 50, 80, 100
    month TEXT NOT NULL,                 -- YYYY-MM format
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, threshold_percent, month)
);

-- Friends/Contacts table for bill splitting
CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Split expense records
CREATE TABLE IF NOT EXISTS expense_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    is_settled INTEGER DEFAULT 0,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES friends(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_friend ON expense_splits(friend_id);
CREATE INDEX IF NOT EXISTS idx_splits_settled ON expense_splits(is_settled);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""

# Pre-defined categories with regex patterns
CATEGORIES_DATA = [
    ("Food & Dining", "🍔", "#ef4444", '["restaurant", "food", "lunch", "dinner", "breakfast", "cafe", "pizza", "burger"]', "Restaurants, groceries, and food delivery"),
    ("Transportation", "🚗", "#f59e0b", '["uber", "lyft", "taxi", "gas", "fuel", "parking", "metro", "bus", "train"]', "Ride-sharing, public transit, and fuel"),
    ("Shopping", "🛍️", "#8b5cf6", '["amazon", "store", "mall", "shop", "clothing", "electronics"]', "Retail purchases and online shopping"),
    ("Entertainment", "🎬", "#ec4899", '["movie", "cinema", "netflix", "spotify", "game", "concert", "theater"]', "Movies, streaming, games, and events"),
    ("Bills & Utilities", "💡", "#3b82f6", '["electric", "water", "internet", "phone", "rent", "mortgage", "insurance"]', "Recurring bills and utilities"),
    ("Healthcare", "🏥", "#10b981", '["doctor", "hospital", "pharmacy", "medicine", "dental", "clinic"]', "Medical expenses and healthcare"),
    ("Education", "📚", "#6366f1", '["school", "tuition", "course", "book", "university", "training"]', "Educational expenses and courses"),
    ("Personal Care", "💇", "#f97316", '["salon", "spa", "gym", "fitness", "haircut", "beauty"]', "Personal grooming and fitness"),
    ("Travel", "✈️", "#14b8a6", '["hotel", "flight", "airbnb", "vacation", "trip", "booking"]', "Travel and accommodation"),
    ("Savings & Investments", "💰", "#22c55e", '["savings", "investment", "stock", "crypto", "deposit"]', "Savings and investment transfers"),
    ("Other", "📌", "#6b7280", '[]', "Miscellaneous expenses"),
]


class Database:
    """Database connection manager."""
    
    def __init__(self, db_path: str = DATABASE_URL):
        self.db_path = db_path
        self._connection: Optional[aiosqlite.Connection] = None
    
    async def connect(self):
        """Initialize database connection and create tables."""
        self._connection = await aiosqlite.connect(self.db_path)
        self._connection.row_factory = aiosqlite.Row
        
        # Create tables
        await self._connection.executescript(SCHEMA)
        
        # Insert default categories if not exists
        for cat_data in CATEGORIES_DATA:
            await self._connection.execute(
                """
                INSERT OR IGNORE INTO categories (name, icon, color, regex_patterns, description)
                VALUES (?, ?, ?, ?, ?)
                """,
                cat_data
            )
        
        await self._connection.commit()
        print(f"✓ Database initialized: {self.db_path}")
    
    async def close(self):
        """Close database connection."""
        if self._connection:
            await self._connection.close()
            print("✓ Database connection closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection context manager."""
        if not self._connection:
            await self.connect()
        yield self._connection


# Global database instance
db = Database()


async def get_db():
    """Dependency for FastAPI routes."""
    async with db.get_connection() as connection:
        yield connection
