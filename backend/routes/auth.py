"""
Authentication routes for user signup, login, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import aiosqlite

from database import get_db
from services.auth import (
    create_user,
    authenticate_user,
    create_access_token,
    decode_token,
    get_user_by_id,
    get_user_by_email
)

router = APIRouter()
security = HTTPBearer(auto_error=False)


# ============================================================================
# Request/Response Models
# ============================================================================

class UserSignup(BaseModel):
    """User signup request."""
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v or '.' not in v:
            raise ValueError("Invalid email format")
        return v.lower().strip()
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    """User login request."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    """Public user data."""
    id: int
    email: str
    name: str
    is_active: bool
    created_at: str


# ============================================================================
# Auth Dependencies
# ============================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: aiosqlite.Connection = Depends(get_db)
) -> Optional[dict]:
    """Get current user from JWT token. Returns None if not authenticated."""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = await get_user_by_id(db, int(user_id))
    return user


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: aiosqlite.Connection = Depends(get_db)
) -> dict:
    """Require authentication. Raises 401 if not authenticated."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


# ============================================================================
# Auth Routes
# ============================================================================

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    data: UserSignup,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new user account."""
    # Check if email already exists
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await create_user(db, data.email, data.password, data.name)
    
    # Generate token
    access_token = create_access_token({"sub": str(user["id"])})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Login with email and password."""
    user = await authenticate_user(db, data.email.lower().strip(), data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    access_token = create_access_token({"sub": str(user["id"])})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(require_auth)):
    """Get current user profile."""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        is_active=bool(user["is_active"]),
        created_at=str(user["created_at"])
    )


@router.get("/verify")
async def verify_token(user: dict = Depends(require_auth)):
    """Verify that token is valid."""
    return {"valid": True, "user_id": user["id"]}
