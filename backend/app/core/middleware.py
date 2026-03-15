"""Centralized middleware registration for application startup."""
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import Settings


def register_middleware(app: FastAPI, settings: Settings, logger: logging.Logger) -> None:
    """Register middleware stack in current production order."""
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    cors_origins = []
    if settings.FRONTEND_URL:
        cors_origins.append(settings.FRONTEND_URL.rstrip("/"))
    if settings.CORS_ORIGINS:
        cors_origins.extend([origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()])

    cors_origins = list(dict.fromkeys(cors_origins))
    if not cors_origins:
        if settings.DEBUG:
            cors_origins = ["*"]
            logger.warning("CORS: Using wildcard (*) - development mode only!")
        else:
            logger.error("CORS: No origins configured in production!")
            cors_origins = []
    
    # Always include common local development origins to support desktop/local HTML workflows.
    dev_origins = [
        "null",  # file:// pages
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    for origin in dev_origins:
        if origin not in cors_origins:
            cors_origins.append(origin)
    logger.info("CORS: Added local development origins")

    logger.info("CORS origins configured", extra={"origins": cors_origins})

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )

    if settings.TRUSTED_HOSTS == "*":
        trusted_hosts = ["*"]
    else:
        trusted_hosts = [host.strip() for host in settings.TRUSTED_HOSTS.split(",") if host.strip()]
        if settings.DEBUG:
            trusted_hosts.extend(["localhost", "127.0.0.1"])

    logger.info("Trusted hosts configured", extra={"trusted_hosts": trusted_hosts})

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

    @app.middleware("http")
    async def disable_docs_cache(request: Request, call_next):
        response = await call_next(request)
        if request.url.path in {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Relaxed CSP for API documentation pages (Swagger UI and ReDoc need CDN resources)
        if request.url.path in {"/docs", "/redoc", "/openapi.json"}:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
                "img-src 'self' data: https:; "
                "font-src 'self' data: https://cdn.jsdelivr.net https://unpkg.com"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            logger.info(
                f"{request.method} {request.url.path}",
                extra={
                    "event_type": "http_request",
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(process_time * 1000, 2),
                    "ip_address": request.client.host if request.client else "unknown",
                },
            )
            return response
        except Exception as exc:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "event_type": "http_error",
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(exc),
                    "duration_ms": round(process_time * 1000, 2),
                    "ip_address": request.client.host if request.client else "unknown",
                },
                exc_info=True,
            )
            raise
