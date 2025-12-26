"""
Category routes for FinLens AI.
Provides category information and management.
"""

from fastapi import APIRouter, Depends
from typing import List
import aiosqlite

from database import get_db
from models import CategoryResponse

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: aiosqlite.Connection = Depends(get_db)):
    """Get all available expense categories."""
    cursor = await db.execute(
        "SELECT id, name, icon, color, description FROM categories ORDER BY name"
    )
    rows = await cursor.fetchall()
    
    return [dict(row) for row in rows]
