"""Structured logging configuration for production."""
import logging
import logging.config
import json
import sys
from datetime import datetime
from pythonjsonlogger import jsonlogger
from app.config import settings


class JSONFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context."""
    
    def add_fields(self, log_record, record, message_dict):
        super(JSONFormatter, self).add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['module'] = record.module


def setup_logging():
    """Configure logging based on environment settings."""
    
    # Determine log format
    if settings.LOG_FORMAT == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return root_logger


def log_auth_attempt(email: str, success: bool, ip: str = "unknown", details: str = ""):
    """Log authentication attempt."""
    logger = logging.getLogger("auth")
    level = logging.INFO if success else logging.WARNING
    status = "SUCCESS" if success else "FAILED"
    logger.log(
        level,
        f"Auth {status}",
        extra={
            "event_type": "auth_attempt",
            "email": email,
            "success": success,
            "ip_address": ip,
            "details": details
        }
    )


def log_api_error(endpoint: str, method: str, status_code: int, error: str, user_id: int = None):
    """Log API errors."""
    logger = logging.getLogger("api")
    logger.error(
        f"API Error",
        extra={
            "event_type": "api_error",
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "error": error,
            "user_id": user_id
        }
    )


# Initialize logging on import
logger = setup_logging()
