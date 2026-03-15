"""Cookie security utilities for secure authentication."""
from fastapi import Response
from app.config import settings


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    access_token_max_age: int = None,
    refresh_token_max_age: int = None
) -> None:
    """
    Set secure HttpOnly cookies for authentication tokens.
    
    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        access_token_max_age: Access token cookie max age in seconds (default: 15 min)
        refresh_token_max_age: Refresh token cookie max age in seconds (default: 7 days)
    """
    # Default expiry times
    if access_token_max_age is None:
        access_token_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    if refresh_token_max_age is None:
        refresh_token_max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    # Determine if we're in production (HTTPS required for Secure flag)
    is_production = not getattr(settings, 'TESTING', False) and settings.DATABASE_URL != "sqlite:///./test.db"
    
    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=access_token_max_age,
        httponly=True,  # Prevent JavaScript access
        secure=is_production,  # HTTPS only in production
        samesite="lax",  # CSRF protection
        path="/"
    )
    
    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_token_max_age,
        httponly=True,  # Prevent JavaScript access
        secure=is_production,  # HTTPS only in production
        samesite="lax",  # CSRF protection
        path="/api/auth/refresh"  # Only send to refresh endpoint
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies on logout.
    
    Args:
        response: FastAPI Response object
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth/refresh")
