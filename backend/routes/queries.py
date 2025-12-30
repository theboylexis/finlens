"""
Query routes for FinLens AI.
Natural language query interface with SQL template security.
PostgreSQL-only implementation.
"""

from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from models import NLQueryRequest, NLQueryResponse
from services.query_engine import get_query_engine
from dependencies import require_auth

router = APIRouter()


@router.post("/ask", response_model=NLQueryResponse)
async def ask_query(
    request: NLQueryRequest,
    db = Depends(get_db),
    user: dict = Depends(require_auth)
):
    """
    Process natural language query about expenses.
    
    Examples:
    - "How much did I spend on food last month?"
    - "Show me my highest expenses this week"
    - "Am I over budget in any category?"
    - "Compare my spending this month vs last month"
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )
    
    query_engine = get_query_engine()
    user_id = user["id"]
    
    try:
        response = await query_engine.process_query(request.query, db, user_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {str(e)}"
        )


@router.get("/examples")
async def get_example_queries():
    """Get example queries users can try."""
    return {
        "examples": [
            "How much did I spend on food last 30 days?",
            "Show me my top 5 highest expenses this month",
            "What's my total spending this week?",
            "Compare my spending this month vs last month",
            "Am I over budget in any category?",
            "How much did I spend on transportation last month?",
        ]
    }
