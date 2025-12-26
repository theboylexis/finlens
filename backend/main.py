"""
Main FastAPI application for FinLens AI.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import time
import uuid
from dotenv import load_dotenv

from database import db
from logger import get_logger, log_api_request, LogContext

# Load environment variables
load_dotenv()

# Get logger
logger = get_logger("main")


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    # Startup
    logger.info("🚀 Starting FinLens AI Backend...")
    await db.connect()
    logger.info("✓ Database connected")
    logger.info("✓ Backend ready!")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down FinLens AI Backend...")
    await db.close()
    logger.info("✓ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="FinLens AI",
    description="AI-Powered Personal Finance Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
# CORS configuration
# Parse origins and strip whitespace
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in raw_origins.split(",")]

# Explicitly add production domains (fallback)
origins.extend([
    "https://finlens-chi.vercel.app",
    "https://finlens-chi.vercel.app/"
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing information."""
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Add request ID to state for access in route handlers
    request.state.request_id = request_id
    
    # Process request with logging context
    with LogContext(request_id=request_id):
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log the request (skip health checks to reduce noise)
            if request.url.path not in ["/health", "/favicon.ico"]:
                log_api_request(
                    method=request.method,
                    path=request.url.path,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    client_ip=client_ip,
                )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "error": str(e),
                    "duration_ms": round(duration_ms, 2),
                    "client_ip": client_ip,
                }
            )
            raise


# ============================================================================
# Routes
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "FinLens AI",
        "version": "1.0.0",
        "description": "AI-Powered Personal Finance Assistant",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
from routes import expenses, categories, analytics, budgets, queries, goals, alerts, splits, auth

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(queries.router, prefix="/api/queries", tags=["Natural Language Queries"])
app.include_router(goals.router, prefix="/api/goals", tags=["Savings Goals"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Spending Alerts"])
app.include_router(splits.router, prefix="/api/splits", tags=["Split Bills"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

