"""
Authentication service using JWT tokens.
"""

from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import jwt
import aiosqlite

# Configuration - In production, use environment variables!
SECRET_KEY = "finlens-secret-key-change-in-production-" + secrets.token_hex(16)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with salt."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        salt, hashed = password_hash.split(":")
        return hashlib.sha256((password + salt).encode()).hexdigest() == hashed
    except ValueError:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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


async def get_user_by_email(db: aiosqlite.Connection, email: str) -> Optional[dict]:
    """Get user by email."""
    cursor = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_user_by_id(db: aiosqlite.Connection, user_id: int) -> Optional[dict]:
    """Get user by ID."""
    cursor = await db.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def create_user(db: aiosqlite.Connection, email: str, password: str, name: str) -> dict:
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


async def authenticate_user(db: aiosqlite.Connection, email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if not user["is_active"]:
        return None
    return user
