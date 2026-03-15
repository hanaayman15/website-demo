"""Centralized exception handlers for app startup wiring."""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import Settings


def register_exception_handlers(app: FastAPI, settings: Settings, logger: logging.Logger) -> None:
    """Register API exception handlers."""

    def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
        logger.warning("Rate limit exceeded", extra={"path": request.url.path})
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "status_code": exc.status_code,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "status_code": 500,
                "detail": str(exc) if settings.DEBUG else "Internal server error",
            },
        )

    app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
