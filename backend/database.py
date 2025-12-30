"""
Database configuration for FinLens AI.
PostgreSQL-only implementation using asyncpg.
"""

import os
import asyncpg
from typing import Optional, Any, List, Dict
from contextlib import asynccontextmanager

# Get database URL from environment - REQUIRED for PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise EnvironmentError(
        "DATABASE_URL environment variable is required.\n"
        "For local development, use: postgresql://user:password@localhost:5432/finlens\n"
        "For production, this should be set by your hosting provider (e.g., Render)."
    )

# PostgreSQL Schema
POSTGRES_SCHEMA = """
-- Users table for authentication (must be first due to foreign key references)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    payment_method TEXT,
    
    -- AI metadata
    ai_suggested_category TEXT,
    confidence_score DECIMAL(3,2),
    categorization_method TEXT,
    user_overridden BOOLEAN DEFAULT FALSE,
    
    -- OCR metadata (if from receipt)
    raw_ocr_text TEXT,
    receipt_image_path TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    monthly_limit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- AI Audit Log table
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id),
    operation_type TEXT NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    model_used TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_expense ON ai_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ai_audit_log(timestamp);

-- Categories table (fixed set)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    regex_patterns TEXT,
    description TEXT
);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#6366f1',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal Contributions table
CREATE TABLE IF NOT EXISTS goal_contributions (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON savings_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON savings_goals(user_id);

-- Spending Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    threshold_percent INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- Budget Alert Settings table
CREATE TABLE IF NOT EXISTS budget_alert_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    threshold_percent INTEGER NOT NULL,
    month TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, threshold_percent, month)
);

-- Friends/Contacts table for bill splitting
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Split expense records
CREATE TABLE IF NOT EXISTS expense_splits (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_friend ON expense_splits(friend_id);
CREATE INDEX IF NOT EXISTS idx_splits_settled ON expense_splits(is_settled);

-- Subscriptions table for recurring payments
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT NOT NULL,
    next_renewal DATE NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER DEFAULT 3,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal ON subscriptions(next_renewal);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
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
    # College-specific categories
    ("Textbooks & Supplies", "📖", "#a855f7", '["textbook", "notebook", "stationery", "backpack", "lab equipment", "calculator", "binder"]', "Academic books and school supplies"),
    ("Tuition & Fees", "🎓", "#0ea5e9", '["tuition", "enrollment", "registration", "exam fee", "transcript", "application fee", "semester fee"]', "University tuition and academic fees"),
    ("Campus Food", "🍕", "#fb923c", '["cafeteria", "dining hall", "meal plan", "campus restaurant", "student center", "food court"]', "On-campus dining and meal plans"),
    ("Study Tools", "💻", "#8b5cf6", '["chegg", "quizlet", "grammarly", "notion", "canva", "chatgpt", "turnitin", "mathway"]', "Digital tools and subscriptions for studying"),
    ("Dorm & Housing", "🏠", "#0d9488", '["dorm", "residence", "hostel", "hall", "room rent", "housing", "accommodation", "apartment", "roommate"]', "Dormitory and housing expenses"),
    ("Club Dues & Activities", "🎭", "#db2777", '["club", "society", "membership", "dues", "association", "fraternity", "sorority", "student org", "union"]', "Student organization fees and activities"),
    ("Other", "📌", "#6b7280", '[]', "Miscellaneous expenses"),
]


class PostgresRowProxy:
    """Wrapper to make asyncpg Record behave like a dict-compatible row."""
    def __init__(self, record: asyncpg.Record):
        self._record = record
        self._keys = list(record.keys()) if record else []
    
    def __getitem__(self, key):
        if isinstance(key, int):
            return self._record[key]
        return self._record[key]
    
    def keys(self):
        return self._keys
    
    def __iter__(self):
        return iter(self._keys)
    
    def items(self):
        """Support dict(row) conversion."""
        return [(k, self._record[k]) for k in self._keys]
    
    def values(self):
        """Support dict(row) conversion."""
        return [self._record[k] for k in self._keys]


class PostgresCursorProxy:
    """Wrapper to simulate cursor behavior for PostgreSQL."""
    def __init__(self, result=None, lastrowid=None):
        self._result = result
        self.lastrowid = lastrowid
    
    async def fetchone(self):
        if self._result and len(self._result) > 0:
            return PostgresRowProxy(self._result[0])
        return None
    
    async def fetchall(self):
        if self._result:
            return [PostgresRowProxy(row) for row in self._result]
        return []


class PostgresConnectionWrapper:
    """
    Wrapper for asyncpg connection to provide a consistent interface.
    Handles parameter conversion from ? placeholders to $1, $2 format.
    """
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        self._conn: Optional[asyncpg.Connection] = None
    
    async def acquire(self):
        """Acquire a connection from the pool."""
        self._conn = await self.pool.acquire()
        return self
    
    async def release(self):
        """Release the connection back to the pool."""
        if self._conn:
            await self.pool.release(self._conn)
            self._conn = None
    
    def _convert_placeholders(self, sql: str) -> str:
        """Convert ? placeholders to $1, $2, etc. for PostgreSQL."""
        result = []
        param_count = 0
        i = 0
        while i < len(sql):
            if sql[i] == '?':
                param_count += 1
                result.append(f'${param_count}')
            else:
                result.append(sql[i])
            i += 1
        return ''.join(result)
    
    def _convert_sqlite_syntax(self, sql: str) -> str:
        """Convert SQLite-specific syntax to PostgreSQL."""
        import re
        
        # Convert INSERT OR REPLACE to INSERT ... ON CONFLICT
        if 'INSERT OR REPLACE' in sql.upper():
            match = re.match(
                r'INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)',
                sql,
                re.IGNORECASE | re.DOTALL
            )
            if match:
                table = match.group(1)
                columns = match.group(2)
                values = match.group(3)
                col_list = [c.strip() for c in columns.split(',')]
                update_cols = [f"{c} = EXCLUDED.{c}" for c in col_list[1:]]
                sql = f"""INSERT INTO {table} ({columns}) VALUES ({values})
                         ON CONFLICT ({col_list[0]}) DO UPDATE SET {', '.join(update_cols)}"""
        
        # Convert INSERT OR IGNORE to INSERT ... ON CONFLICT DO NOTHING
        if 'INSERT OR IGNORE' in sql.upper():
            sql = re.sub(r'INSERT\s+OR\s+IGNORE', 'INSERT', sql, flags=re.IGNORECASE)
            if 'ON CONFLICT' not in sql.upper():
                sql = sql.rstrip().rstrip(';') + ' ON CONFLICT DO NOTHING'
        
        # Convert SQLite boolean syntax (0/1) to PostgreSQL (TRUE/FALSE)
        boolean_columns = ['is_completed', 'is_active', 'is_read', 'is_dismissed', 'is_settled', 'is_recurring', 'user_overridden']
        for col in boolean_columns:
            sql = re.sub(rf'\b{col}\s*=\s*0\b', f'{col} = FALSE', sql, flags=re.IGNORECASE)
            sql = re.sub(rf'\b{col}\s*=\s*1\b', f'{col} = TRUE', sql, flags=re.IGNORECASE)
        
        return sql
    
    def _is_insert(self, sql: str) -> bool:
        """Check if SQL is an INSERT statement."""
        return sql.strip().upper().startswith('INSERT')
    
    def _add_returning(self, sql: str) -> str:
        """Add RETURNING id to INSERT statements if not present."""
        sql_upper = sql.strip().upper()
        if 'RETURNING' not in sql_upper:
            return sql.rstrip().rstrip(';') + ' RETURNING id'
        return sql
    
    async def execute(self, sql: str, parameters: tuple = None) -> PostgresCursorProxy:
        """Execute a SQL statement and return a cursor-like object."""
        original_sql = sql
        # Convert SQLite-specific syntax
        sql = self._convert_sqlite_syntax(sql)
        # Convert placeholders
        sql = self._convert_placeholders(sql)
        
        lastrowid = None
        result = None
        
        if self._is_insert(original_sql):
            sql = self._add_returning(sql)
            try:
                if parameters:
                    row = await self._conn.fetchrow(sql, *parameters)
                else:
                    row = await self._conn.fetchrow(sql)
                if row and 'id' in row.keys():
                    lastrowid = row['id']
                    result = [row]
            except Exception as e:
                # Handle ON CONFLICT DO NOTHING case
                if 'ON CONFLICT' in sql.upper():
                    pass
                else:
                    raise
        elif original_sql.strip().upper().startswith('SELECT'):
            # SELECT queries - fetch all results
            if parameters:
                rows = await self._conn.fetch(sql, *parameters)
            else:
                rows = await self._conn.fetch(sql)
            result = rows if rows else []
        else:
            # UPDATE, DELETE, etc.
            if parameters:
                await self._conn.execute(sql, *parameters)
            else:
                await self._conn.execute(sql)
        
        return PostgresCursorProxy(result, lastrowid)
    
    async def executemany(self, sql: str, parameters: List[tuple]) -> None:
        """Execute a SQL statement with multiple parameter sets."""
        sql = self._convert_placeholders(sql)
        await self._conn.executemany(sql, parameters)
    
    async def executescript(self, script: str) -> None:
        """Execute multiple SQL statements."""
        await self._conn.execute(script)
    
    async def fetchone(self, sql: str, parameters: tuple = None) -> Optional[PostgresRowProxy]:
        """Fetch a single row."""
        sql = self._convert_placeholders(sql)
        if parameters:
            row = await self._conn.fetchrow(sql, *parameters)
        else:
            row = await self._conn.fetchrow(sql)
        return PostgresRowProxy(row) if row else None
    
    async def fetchall(self, sql: str, parameters: tuple = None) -> List[PostgresRowProxy]:
        """Fetch all rows."""
        sql = self._convert_placeholders(sql)
        if parameters:
            rows = await self._conn.fetch(sql, *parameters)
        else:
            rows = await self._conn.fetch(sql)
        return [PostgresRowProxy(row) for row in rows]
    
    async def commit(self) -> None:
        """PostgreSQL auto-commits, but we keep this for compatibility."""
        pass
    
    @property
    def row_factory(self):
        """Compatibility property."""
        return None
    
    @row_factory.setter
    def row_factory(self, value):
        """Compatibility property setter."""
        pass


class Database:
    """PostgreSQL database connection manager."""
    
    def __init__(self, db_url: str = None):
        self.db_url = db_url or DATABASE_URL
        self._pg_pool: Optional[asyncpg.Pool] = None
    
    def _get_postgres_dsn(self) -> str:
        """Convert DATABASE_URL to asyncpg-compatible format."""
        url = self.db_url
        # Render uses postgres:// but asyncpg needs postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    
    async def connect(self):
        """Initialize database connection and create tables."""
        dsn = self._get_postgres_dsn()
        self._pg_pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10)
        
        # Create tables using a connection from the pool
        async with self._pg_pool.acquire() as conn:
            # Split and execute each statement separately
            statements = [s.strip() for s in POSTGRES_SCHEMA.split(';') if s.strip()]
            for stmt in statements:
                try:
                    await conn.execute(stmt)
                except Exception as e:
                    # Ignore "already exists" errors for indexes and constraints
                    if "already exists" not in str(e):
                        print(f"Warning: {e}")
            
            # Insert default categories if not exists
            for cat_data in CATEGORIES_DATA:
                try:
                    await conn.execute(
                        """
                        INSERT INTO categories (name, icon, color, regex_patterns, description)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (name) DO NOTHING
                        """,
                        *cat_data
                    )
                except Exception as e:
                    if "duplicate" not in str(e).lower():
                        print(f"Warning inserting category: {e}")
        
        print(f"✓ PostgreSQL database initialized")
    
    async def close(self):
        """Close database connection."""
        if self._pg_pool:
            await self._pg_pool.close()
            print("✓ PostgreSQL connection closed")

    @property
    def connection(self):
        """Expose pool for direct use."""
        return self._pg_pool
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection context manager."""
        if not self._pg_pool:
            await self.connect()
        wrapper = PostgresConnectionWrapper(self._pg_pool)
        await wrapper.acquire()
        try:
            yield wrapper
        finally:
            await wrapper.release()


# Global database instance
db = Database()


async def get_db():
    """Dependency for FastAPI routes."""
    async with db.get_connection() as connection:
        yield connection


# Test helper to initialize the DB explicitly
async def init_db():
    """Initialize and return a connected database (for tests)."""
    await db.connect()
    wrapper = PostgresConnectionWrapper(db._pg_pool)
    await wrapper.acquire()
    return wrapper
