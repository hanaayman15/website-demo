"""Security utilities for JWT and password hashing."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.schemas import TokenData


# Password hashing
# Prefer pbkdf2_sha256 for compatibility across Python versions;
# keep bcrypt for verification of any legacy hashes.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ==================== IMPROVED JWT TOKEN MANAGEMENT ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create short-lived JWT access token (15 min default)."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add token type for security
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, db: Session = None, jti: str = None) -> tuple[str, str]:
    """Create long-lived JWT refresh token with JTI (7 days default).
    
    Args:
        data: Token payload (user_id, email, role)
        db: Database session for storing token (optional for backward compatibility)  
        jti: JWT ID (auto-generated if not provided)
    
    Returns:
        Tuple of (token_string, jti)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Generate unique JTI if not provided
    if jti is None:
        jti = str(uuid.uuid4())
    
    # Add token type and JTI for security and tracking
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow(),
        "jti": jti
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Store token in database if session provided
    if db is not None:
        from app.models import RefreshToken
        
        db_token = RefreshToken(
            user_id=data.get("user_id"),
            token_jti=jti,
            is_revoked=False,
            expires_at=expire
        )
        db.add(db_token)
        db.commit()
    
    return encoded_jwt, jti


def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """Verify JWT token and return token data.
    
    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        TokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None or role is None:
            return None
        
        return TokenData(user_id=user_id, email=email, role=role)
    
    except JWTError:
        return None


def verify_refresh_token(token: str, db: Session) -> Optional[TokenData]:
    """Verify refresh token and check revocation status in database.
    
    Args:
        token: JWT refresh token string
        db: Database session for checking revocation status
    
    Returns:
        TokenData if valid and not revoked, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "refresh":
            return None
        
        # Extract JTI
        jti = payload.get("jti")
        if jti is None:
            # Old tokens without JTI - reject for security
            return None
        
        # Check if token is revoked in database
        from app.models import RefreshToken
        
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_jti == jti
        ).first()
        
        if db_token is None:
            # Token not found in database - reject
            return None
        
        if db_token.is_revoked:
            # Token has been revoked
            return None
        
        # Check if token expired
        if db_token.expires_at < datetime.utcnow():
            # Token expired - mark as revoked
            db_token.is_revoked = True
            db_token.revoked_at = datetime.utcnow()
            db.commit()
            return None
        
        # Extract user data
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None or role is None:
            return None
        
        return TokenData(user_id=user_id, email=email, role=role)
    
    except JWTError:
        return None


def revoke_refresh_token(jti: str, db: Session) -> bool:
    """Revoke a refresh token by JTI.
    
    Args:
        jti: JWT ID of the token to revoke
        db: Database session
    
    Returns:
        True if token was revoked, False if not found
    """
    from app.models import RefreshToken
    
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_jti == jti
    ).first()
    
    if db_token is None:
        return False
    
    db_token.is_revoked = True
    db_token.revoked_at = datetime.utcnow()
    db.commit()
    
    return True


def create_token_pair(data: dict, db: Session = None) -> Dict[str, Any]:
    """Create both access and refresh tokens.
    
    Args:
        data: Token payload (user_id, email, role)
        db: Database session for storing refresh token (optional)
    
    Returns:
        {
            "access_token": str,
            "refresh_token": str,
            "token_type": "bearer",
            "access_token_expires": int (seconds),
            "refresh_jti": str (if db provided)
        }
    """
    access_token = create_access_token(data)
    
    if db is not None:
        refresh_token, jti = create_refresh_token(data, db=db)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "access_token_expires": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_jti": jti
        }
    else:
        # Backward compatibility mode without database
        refresh_token, jti = create_refresh_token(data, db=None)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "access_token_expires": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }


def rotate_refresh_token(data: dict, old_jti: str = None, db: Session = None) -> Dict[str, Any]:
    """
    Create new token pair with rotation (both tokens refreshed).
    
    Used for refresh token rotation security pattern.
    Revokes old refresh token if old_jti and db provided.
    
    Args:
        data: Token payload (user_id, email, role)
        old_jti: JTI of the old refresh token to revoke
        db: Database session for token storage and revocation
    
    Returns:
        {
            "access_token": str,
            "refresh_token": str (NEW),
            "token_type": "bearer",
            "access_token_expires": int (seconds),
            "refresh_jti": str (if db provided)
        }
    """
    # Revoke old refresh token if provided
    if old_jti is not None and db is not None:
        revoke_refresh_token(old_jti, db)
    
    # Create new access token
    access_token = create_access_token(data)
    
    # Create NEW refresh token (rotation)
    if db is not None:
        refresh_token, new_jti = create_refresh_token(data, db=db)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "access_token_expires": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_jti": new_jti
        }
    else:
        # Backward compatibility mode without database
        refresh_token, new_jti = create_refresh_token(data, db=None)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "access_token_expires": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }


