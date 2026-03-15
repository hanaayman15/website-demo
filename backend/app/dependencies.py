"""Dependency injection for authentication and authorization."""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.security import verify_token
from app.schemas import TokenData
from app.config import settings

security = HTTPBearer(auto_error=False)  # auto_error=False to support cookies fallback


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user.
    
    Supports two authentication methods (in order):
    1. Cookie-based authentication (HttpOnly secure cookies)
    2. Bearer token authentication (Authorization header)
    
    Args:
        request: FastAPI Request object to access cookies
        credentials: Optional bearer token from Authorization header
        db: Database session
    
    Returns:
        Authenticated User object
    
    Raises:
        HTTPException: If authentication fails
    """
    token = None
    
    # Try Authorization header first (maintains backward compatibility)
    if credentials:
        token = credentials.credentials
    
    # Fallback to cookie if no Authorization header
    if not token and hasattr(request, 'cookies'):
        token = request.cookies.get("access_token")
    
    # No token found in either location
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Handle fixed admin account (configured via environment variables)
    if (
        token_data.role == "admin"
        and token_data.user_id == 0
        and token_data.email == settings.ADMIN_EMAIL
    ):
        return User(
            id=0,
            email=settings.ADMIN_EMAIL,
            full_name="System Admin",
            hashed_password="",
            role="admin",
            is_active=True,
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current admin user."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this resource",
        )
    
    return current_user


async def get_current_doctor(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current doctor user."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctor users can access this resource",
        )

    return current_user


async def get_current_admin_or_doctor(
    current_user: User = Depends(get_current_user)
) -> User:
    """Allow either admin or doctor role."""
    if current_user.role not in {"admin", "doctor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or doctor users can access this resource",
        )

    return current_user


async def get_current_client(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current client user."""
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only client users can access this resource",
        )
    
    return current_user
