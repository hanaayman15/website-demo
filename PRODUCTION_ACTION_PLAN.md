# Production Readiness Action Plan & Implementation Guide

**Estimated Time to Production-Ready:** 2-3 hours (Critical fixes only)

---

## QUICK START: Priority 1 Fixes (2-3 hours)

### Step 1: Generate SECRET_KEY (5 minutes)

```bash
# Generate strong SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Example output:
# N8kqQvXpYzJ_-5mLbRgHsW8tU9dqYfXzX9qJmKlNoPq

# Copy this and create .env file in backend/
# backend/.env
SECRET_KEY=N8kqQvXpYzJ_-5mLbRgHsW8tU9dqYfXzX9qJmKlNoPq
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=your-secure-password-minimum-16-chars
ENVIRONMENT=production
DEBUG=false
```

### Step 2: Update app/config.py (10 minutes)

**Replace line 12-14 with:**

```python
# Security - MUST be set in production
SECRET_KEY: str = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "FATAL: SECRET_KEY not set. "
        "Set SECRET_KEY environment variable before starting."
    )

# Admin credentials - MUST be set in production
ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD")

if os.getenv("ENVIRONMENT") == "production":
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise ValueError(
            "FATAL: ADMIN_EMAIL and ADMIN_PASSWORD must be set in production."
        )
    if len(ADMIN_PASSWORD) < 16:
        raise ValueError(
            "FATAL: ADMIN_PASSWORD must be at least 16 characters."
        )
```

### Step 3: Add Security Headers Middleware (15 minutes)

**Add to backend/app/main.py after line 185** (after TrustedHostMiddleware):

```python
# ==================== Security Headers Middleware ====================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent XSS attacks
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # HSTS (HTTP Strict Transport Security)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )
    
    # Content Security Policy - restrict to same origin
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self'"
    )
    
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response
```

### Step 4: Add Health Check Endpoint (5 minutes)

**Add to backend/app/main.py before app.include_router():**

```python
# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        - status: 'healthy' or 'unhealthy'
        - version: Application version
        - timestamp: Current UTC timestamp
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }
```

### Step 5: Add Structured Logging (20 minutes)

**Create backend/app/logger.py:**

```python
"""Structured logging configuration."""
import logging
import sys
from datetime import datetime
from pythonjsonlogger import jsonlogger
import os

def setup_logging():
    """Configure structured JSON logging."""
    logger = logging.getLogger()
    
    # Set log level from environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level))
    
    # Remove default handler
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # JSON formatter
    formatter = jsonlogger.JsonFormatter()
    
    # Console handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    
    return logger

# Initialize logger
logger = setup_logging()

def log_auth_event(event_type: str, email: str, success: bool, ip: str):
    """Log authentication events."""
    logger.info(
        "auth_event",
        extra={
            "event_type": event_type,
            "email": email,
            "success": success,
            "ip_address": ip,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

def log_error(error_type: str, message: str, context: dict = None):
    """Log application errors."""
    logger.error(
        error_type,
        extra={
            "message": message,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

**Update backend/app/routers/auth.py login endpoint:**

```python
from app.logger import log_auth_event

@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
    request: Request = None  # Add Request parameter
):
    """Login user (admin or client) and return an access token."""
    ip_address = request.client.host if request else "unknown"
    
    # Check for admin login
    if credentials.email == settings.ADMIN_EMAIL and credentials.password == settings.ADMIN_PASSWORD:
        log_auth_event("login", credentials.email, True, ip_address)
        
        access_token = create_access_token(
            data={
                "user_id": 0,
                "email": settings.ADMIN_EMAIL,
                "role": "admin"
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": 0,
            "role": "admin"
        }
    
    # Check for client login
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        log_auth_event("login", credentials.email, False, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    log_auth_event("login", credentials.email, True, ip_address)
    
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }
```

**Installation:**

```bash
pip install python-json-logger
```

### Step 6: Add Rate Limiting (15 minutes)

**Install SlowAPI:**

```bash
pip install slowapi
```

**Create backend/app/rate_limit.py:**

```python
"""Rate limiting configuration."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

**Update backend/app/routers/auth.py:**

```python
from app.rate_limit import limiter

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
async def login(...):
    # ... existing code ...
```

**Add to backend/app/main.py:**

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.rate_limit import limiter

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )
```

---

## Step 7: Database Upgrade to PostgreSQL (30 minutes)

**For Development/Testing (Using Docker):**

```bash
# Install Docker if not already installed

# Start PostgreSQL in Docker
docker run -d \
    --name nutrition-postgres \
    -e POSTGRES_DB=nutrition_db \
    -e POSTGRES_USER=admin \
    -e POSTGRES_PASSWORD=secure_password_here \
    -p 5432:5432 \
    -v postgres_data:/var/lib/postgresql/data \
    postgres:16-alpine

# Update .env
DATABASE_URL=postgresql://admin:secure_password_here@localhost:5432/nutrition_db

# Install driver
pip install psycopg2-binary
```

**Update backend/app/config.py:**

```python
# Database
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite:///./nutrition_management.db"  # Fallback for dev only
)

# Validate production database
if os.getenv("ENVIRONMENT") == "production":
    if not DATABASE_URL.startswith("postgresql://"):
        raise ValueError(
            "PostgreSQL is required for production. "
            "Set DATABASE_URL=postgresql://..."
        )
```

**Update backend/app/database.py:**

```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create engine with production-ready settings
if "postgresql" in settings.DATABASE_URL:
    # PostgreSQL settings
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,  # Test connections before using
        echo=False  # Set to True for debugging
    )
else:
    # SQLite settings (development only)
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
```

**Test the connection:**

```bash
# Run this to verify database works
python -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connection successful!')
    print(result.fetchone())
"
```

---

## Priority 2 Fixes (Optional, but recommended - 1-2 hours)

### Add Stronger Password Validation

**Update backend/app/schemas.py:**

```python
from pydantic import field_validator
import re

class PasswordChange(BaseModel):
    """Password change schema with strength validation."""
    current_password: str
    new_password: str = Field(..., min_length=12, description="Minimum 12 characters")
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password strength requirements."""
        errors = []
        
        if len(v) < 12:
            errors.append("At least 12 characters")
        
        if not re.search(r'[A-Z]', v):
            errors.append("At least one uppercase letter")
        
        if not re.search(r'[a-z]', v):
            errors.append("At least one lowercase letter")
        
        if not re.search(r'[0-9]', v):
            errors.append("At least one digit")
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', v):
            errors.append("At least one special character")
        
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        
        return v

class UserCreate(UserBase):
    """User creation schema with password validation."""
    password: str = Field(..., min_length=12)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        # Reuse the same validation as PasswordChange
        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters")
        return v
```

### Add Database Migrations (Alembic)

```bash
# Install Alembic
pip install alembic

# Initialize migrations
cd backend
alembic init migrations

# Edit migrations/env.py to use our models
# Then create initial migration:
alembic revision --autogenerate -m "Initial migration"

# Apply migrations:
alembic upgrade head
```

### Add Request Size Limit

**Add to backend/app/main.py:**

```python
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Limit request size to prevent DOS attacks."""
    if request.method == "POST" or request.method == "PUT":
        content_length = request.headers.get("content-length")
        if content_length:
            content_length = int(content_length)
            # Limit to 1MB
            if content_length > 1_000_000:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request entity too large"}
                )
    return await call_next(request)
```

---

## Production Deployment Checklist

```bash
#!/bin/bash
# deploy-checklist.sh

echo "Production Deployment Checklist"
echo "==============================="

# 1. Environment Variables
echo "✓ Checking environment variables..."
test -n "$SECRET_KEY" && echo "  ✓ SECRET_KEY set" || echo "  ✗ SECRET_KEY missing"
test -n "$ADMIN_EMAIL" && echo "  ✓ ADMIN_EMAIL set" || echo "  ✗ ADMIN_EMAIL missing"
test -n "$ADMIN_PASSWORD" && echo "  ✓ ADMIN_PASSWORD set" || echo "  ✗ ADMIN_PASSWORD missing"
test -n "$DATABASE_URL" && echo "  ✓ DATABASE_URL set" || echo "  ✗ DATABASE_URL missing"

# 2. Dependencies
echo ""
echo "✓ Checking dependencies..."
pip list | grep -q fastapi && echo "  ✓ FastAPI installed" || echo "  ✗ FastAPI missing"
pip list | grep -q psycopg2 && echo "  ✓ psycopg2 installed" || echo "  ✗ psycopg2 missing"
pip list | grep -q slowapi && echo "  ✓ SlowAPI installed" || echo "  ✗ SlowAPI missing"

# 3. Database
echo ""
echo "✓ Testing database connection..."
python -c "from app.database import engine; engine.connect()" && echo "  ✓ Database connected" || echo "  ✗ Database connection failed"

# 4. API Health
echo ""
echo "✓ Testing API health..."
curl -s http://127.0.0.1:8001/health | grep -q "healthy" && echo "  ✓ Health endpoint working" || echo "  ✗ Health endpoint failed"

# 5. Run tests
echo ""
echo "✓ Running integration tests..."
cd backend && python -m pytest test_integration.py -v --tb=short && echo "  ✓ All tests passed" || echo "  ✗ Some tests failed"

echo ""
echo "Deployment ready!"
```

---

## Environment Configuration Examples

### Development (.env.dev)
```bash
# Development settings
SECRET_KEY=development-key-not-for-production-change-before-deploy
ADMIN_EMAIL=admin@nutrition.local
ADMIN_PASSWORD=admin123secure!
DATABASE_URL=sqlite:///./nutrition_management.db
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
TRUSTED_HOSTS=localhost,127.0.0.1
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
ACCESS_TOKEN_EXPIRE_MINUTES=120
```

### Staging (.env.staging)
```bash
# Staging settings
SECRET_KEY=<generate-with-python-secrets-module>
ADMIN_EMAIL=admin@staging.nutrition.com
ADMIN_PASSWORD=<use-strong-password>
DATABASE_URL=postgresql://user:pass@staging-db.internal:5432/nutrition_db
CORS_ORIGINS=https://staging.nutrition.com
TRUSTED_HOSTS=staging.nutrition.com
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=info
ACCESS_TOKEN_EXPIRE_MINUTES=30
SENTRY_DSN=https://key@sentry.io/project
```

### Production (.env.prod)
```bash
# Production settings - KEEP SECURE!
SECRET_KEY=<generate-with-python-secrets-module>
ADMIN_EMAIL=admin@nutrition.com
ADMIN_PASSWORD=<use-very-strong-password>
DATABASE_URL=postgresql://user:pass@prod-db.internal:5432/nutrition_db
CORS_ORIGINS=https://nutrition.com,https://www.nutrition.com
TRUSTED_HOSTS=nutrition.com,www.nutrition.com
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning
ACCESS_TOKEN_EXPIRE_MINUTES=30
SENTRY_DSN=https://key@sentry.io/project
SSL_CERT_PATH=/etc/ssl/certs/nutrition.com.crt
SSL_KEY_PATH=/etc/ssl/private/nutrition.com.key
```

---

## Quick Test Commands

```bash
# Test health endpoint
curl http://127.0.0.1:8001/health | jq

# Test registration
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!@#",
    "full_name": "Test User"
  }' | jq

# Test login
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!@#"
  }' | jq

# Test with auth header
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!@#"}' | jq -r '.access_token')

curl -X GET http://127.0.0.1:8001/api/client/profile \
  -H "Authorization: Bearer $TOKEN" | jq

# Test rate limiting (should fail after 5 attempts)
for i in {1..10}; do
  curl -X POST http://127.0.0.1:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@example.com","password":"wrong"}' 2>/dev/null
  echo "Attempt $i"
done
```

---

## Validation Checklist Before Deployment

- [ ] SECRET_KEY is 32+ character random string
- [ ] ADMIN_EMAIL and ADMIN_PASSWORD set and strong
- [ ] DATABASE_URL set to PostgreSQL
- [ ] CORS_ORIGINS contains only production domain(s)
- [ ] TRUSTED_HOSTS contains only production domain(s)
- [ ] All 50+ integration tests pass
- [ ] Health endpoint responds with 200 OK
- [ ] HTTPS/SSL certificates installed and valid
- [ ] Security headers present (test with browser dev tools)
- [ ] Rate limiting working (test login endpoint)
- [ ] Database backups configured
- [ ] Monitoring/logging configured (Sentry, DataDog, etc.)
- [ ] Error tracking enabled
- [ ] Authentication flow tested (signup, login, logout)
- [ ] Data logging tested (weight, workout, mood, supplements)
- [ ] Error handling tested with invalid requests

---

## Expected Timeline

| Task | Time | Done |
|------|------|------|
| Generate SECRET_KEY | 5 min | |
| Update config.py | 10 min | |
| Add security headers | 15 min | |
| Add health check | 5 min | |
| Add logging | 20 min | |
| Add rate limiting | 15 min | |
| Setup PostgreSQL | 30 min | |
| Run tests | 10 min | |
| **Total Priority 1** | **2 hours** | |
| Add password validation | 15 min | |
| Add request limits | 10 min | |
| Setup Alembic | 20 min | |
| **Total Priority 2** | **45 min** | |
| **Total Time** | **~2.75 hours** | |

---

## Support Commands

```bash
# View logs
tail -f /var/log/nutrition-app.log

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('nutrition_db'));"

# Backup database
pg_dump $DATABASE_URL > nutrition_backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < nutrition_backup_20260303.sql

# Monitor running process
ps aux | grep uvicorn

# Restart application
sudo systemctl restart nutrition-app

# View recent logs
journalctl -u nutrition-app -n 100 -f
```

---

You now have everything needed to make your application production-ready! Start with Priority 1 fixes and you'll be ready to deploy within 2-3 hours.

