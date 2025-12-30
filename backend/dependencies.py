"""
FastAPI dependencies for authentication.
PostgreSQL-only implementation.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Any

from database import get_db
from services.auth import decode_token, get_user_by_id

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Any = Depends(get_db)
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
    db: Any = Depends(get_db)
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
