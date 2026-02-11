"""
Authentication service using JWT tokens.
PostgreSQL-only implementation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
import secrets
import jwt
import os

# Configuration - In production, use environment variables!
# Use persistent key from env, or fallback to random (logs everyone out on restart)
SECRET_KEY = os.getenv("JWT_SECRET", "finlens-secret-key-change-in-production-" + secrets.token_hex(16))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash. Supports both bcrypt and legacy SHA-256."""
    try:
        # Try bcrypt first (new format)
        if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
            return bcrypt.checkpw(
                password.encode("utf-8"),
                password_hash.encode("utf-8")
            )
        # Legacy SHA-256 fallback for existing users
        import hashlib
        salt, hashed = password_hash.split(":")
        return hashlib.sha256((password + salt).encode()).hexdigest() == hashed
    except (ValueError, Exception):
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_user_by_email(db: Any, email: str) -> Optional[dict]:
    """Get user by email."""
    cursor = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_user_by_id(db: Any, user_id: int) -> Optional[dict]:
    """Get user by ID."""
    cursor = await db.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def create_user(db: Any, email: str, password: str, name: str) -> dict:
    """Create a new user."""
    password_hash = hash_password(password)
    
    cursor = await db.execute(
        """
        INSERT INTO users (email, password_hash, name)
        VALUES (?, ?, ?)
        """,
        (email, password_hash, name)
    )
    await db.commit()
    
    user_id = cursor.lastrowid
    return await get_user_by_id(db, user_id)


async def authenticate_user(db: Any, email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if not user["is_active"]:
        return None
    return user
