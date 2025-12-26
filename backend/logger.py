"""
Structured Logging Configuration for FinLens AI.

Provides consistent, JSON-formatted logging across the application
with request tracing and contextual information.
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Optional
from contextvars import ContextVar
import os

# Context variable for request ID tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs JSON structured logs.
    Includes timestamp, level, message, and any extra fields.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_entry["request_id"] = request_id
        
        # Add source location
        log_entry["source"] = {
            "file": record.filename,
            "line": record.lineno,
            "function": record.funcName,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields
        extra_fields = {
            key: value for key, value in record.__dict__.items()
            if key not in {
                'name', 'msg', 'args', 'created', 'levelname', 'levelno',
                'pathname', 'filename', 'module', 'exc_info', 'exc_text',
                'stack_info', 'lineno', 'funcName', 'message', 'msecs',
                'relativeCreated', 'thread', 'threadName', 'processName',
                'process', 'taskName'
            }
        }
        if extra_fields:
            log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry)


class DevelopmentFormatter(logging.Formatter):
    """
    Human-readable formatter for development.
    Uses colors and readable format.
    """
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Add request ID if available
        request_id = request_id_var.get()
        request_part = f" [{request_id[:8]}]" if request_id else ""
        
        message = f"{color}{timestamp} {record.levelname:8}{self.RESET}{request_part} {record.name}: {record.getMessage()}"
        
        if record.exc_info:
            message += f"\n{self.formatException(record.exc_info)}"
        
        return message


def setup_logging(
    log_level: str = None,
    json_format: bool = None
) -> logging.Logger:
    """
    Configure logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        json_format: Force JSON format (auto-detected in production)
    
    Returns:
        Configured logger instance
    """
    # Determine settings from environment if not provided
    if log_level is None:
        log_level = os.getenv("LOG_LEVEL", "INFO")
    
    if json_format is None:
        # Use JSON in production, readable in development
        json_format = os.getenv("ENVIRONMENT", "development") == "production"
    
    # Get the root logger
    logger = logging.getLogger("finlens")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Choose formatter based on environment
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = DevelopmentFormatter()
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


# Create default logger instance
logger = setup_logging()


def get_logger(name: str = None) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name (will be prefixed with 'finlens.')
    
    Returns:
        Logger instance
    """
    if name:
        return logging.getLogger(f"finlens.{name}")
    return logger


class LogContext:
    """
    Context manager for adding contextual information to logs.
    
    Usage:
        with LogContext(request_id="abc123"):
            logger.info("Processing request")
    """
    
    def __init__(self, request_id: str = None, **extra):
        self.request_id = request_id
        self.extra = extra
        self._token = None
    
    def __enter__(self):
        if self.request_id:
            self._token = request_id_var.set(self.request_id)
        return self
    
    def __exit__(self, *args):
        if self._token:
            request_id_var.reset(self._token)


def log_ai_operation(
    operation: str,
    input_text: str,
    output: Any,
    model: str = None,
    confidence: float = None,
    latency_ms: int = None,
    **extra
):
    """
    Log an AI operation with structured metadata.
    
    Args:
        operation: Type of AI operation (categorize, query, etc.)
        input_text: Input to the AI
        output: AI output
        model: Model used
        confidence: Confidence score
        latency_ms: Operation latency
        **extra: Additional metadata
    """
    ai_logger = get_logger("ai")
    ai_logger.info(
        f"AI Operation: {operation}",
        extra={
            "ai_operation": operation,
            "input": input_text[:100] + "..." if len(input_text) > 100 else input_text,
            "output": str(output)[:200],
            "model": model,
            "confidence": confidence,
            "latency_ms": latency_ms,
            **extra
        }
    )


def log_api_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    client_ip: str = None,
    **extra
):
    """
    Log an API request with structured metadata.
    
    Args:
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration
        client_ip: Client IP address
        **extra: Additional metadata
    """
    api_logger = get_logger("api")
    level = logging.WARNING if status_code >= 400 else logging.INFO
    
    api_logger.log(
        level,
        f"{method} {path} - {status_code}",
        extra={
            "http_method": method,
            "http_path": path,
            "http_status": status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": client_ip,
            **extra
        }
    )
