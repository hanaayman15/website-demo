# FastAPI Production Refactor Migration Plan

## 1) Target Architecture

```
backend/
├─ app/
│  ├─ main.py
│  ├─ api/
│  │  ├─ deps.py
│  │  └─ v1/
│  │     ├─ router.py
│  │     └─ endpoints/
│  │        ├─ auth.py
│  │        ├─ clients.py
│  │        ├─ weights.py
│  │        ├─ moods.py
│  │        └─ supplements.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ security.py
│  │  ├─ logging.py
│  │  ├─ exceptions.py
│  │  └─ middleware.py
│  ├─ db/
│  │  ├─ base.py
│  │  ├─ session.py
│  │  └─ models/
│  ├─ repositories/
│  │  ├─ base.py
│  │  ├─ user_repository.py
│  │  ├─ weight_repository.py
│  │  ├─ mood_repository.py
│  │  └─ supplement_repository.py
│  ├─ services/
│  │  ├─ auth_service.py
│  │  ├─ weight_service.py
│  │  ├─ mood_service.py
│  │  └─ supplement_service.py
│  ├─ schemas/
│  │  ├─ auth.py
│  │  ├─ common.py
│  │  ├─ weight.py
│  │  ├─ mood.py
│  │  └─ supplement.py
│  └─ utils/
│     └─ pagination.py
├─ alembic/
│  ├─ versions/
│  └─ env.py
├─ alembic.ini
└─ tests/
   ├─ unit/
   └─ integration/
```

---

## 2) Phased Migration Plan

## Phase A: Foundation (no behavior changes)
1. Create `core`, `db`, `repositories`, `services`, `api/v1` folders.
2. Move settings into `app/core/config.py`.
3. Move SQLAlchemy engine/session into `app/db/session.py`.
4. Keep current routes working while new modules are added.

Exit criteria:
- App starts unchanged.
- Existing tests still pass.

## Phase B: Dependency Injection + Services/Repositories
1. Introduce repository classes for weight/mood/supplement.
2. Introduce service layer for business rules (ownership checks, 403/404 decisions).
3. Router endpoints call services only.
4. Consolidate dependencies in `app/api/deps.py`.

Exit criteria:
- CRUD behavior unchanged.
- Controllers are thin and reusable.

## Phase C: Security hardening
1. Add cookie-based auth (`HttpOnly`, `Secure`, `SameSite=Lax`/`Strict`).
2. Keep refresh-token rotation.
3. Add centralized security headers middleware.
4. Keep rate limiting enabled on sensitive endpoints.

Exit criteria:
- Browser session flow works with secure cookies.
- Refresh endpoint rotates token pair.

## Phase D: Observability + Errors
1. Add request-id + structured logging middleware.
2. Add global exception handlers (domain, validation, HTTP, unexpected).
3. Standardize error response contract.

Exit criteria:
- Logs include request id, path, status, duration.
- Errors return consistent JSON shape.

## Phase E: Alembic migrations
1. Initialize Alembic.
2. Wire SQLAlchemy metadata.
3. Create initial revision and subsequent schema changes via migrations.

Exit criteria:
- No `create_all` in production startup.
- DB changes are migration-driven.

---

## 3) Environment-based Configuration

```python
# app/core/config.py
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Client Nutrition Management"
    ENV: str = "development"  # development|staging|production
    DEBUG: bool = False

    DATABASE_URL: str

    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    RATE_LIMIT_ENABLED: bool = True
    LOGIN_RATE_LIMIT: str = "5/minute"

    FRONTEND_URL: str
    TRUSTED_HOSTS: str = "*"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

## 4) Database Session + PostgreSQL

```python
# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

PostgreSQL production DSN pattern:

```env
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname?sslmode=require
```

---

## 5) DI best practices

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth_service import AuthService


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(auth: AuthService = Depends(get_auth_service), token: str = Depends(...)):
    user = auth.get_current_user(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user
```

---

## 6) Repository + Service separation

```python
# app/repositories/weight_repository.py
from sqlalchemy.orm import Session
from app.models import WeightLog

class WeightRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, weight_id: int):
        return self.db.query(WeightLog).filter(WeightLog.id == weight_id).first()

    def create(self, entity: WeightLog):
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: WeightLog):
        self.db.delete(entity)
        self.db.commit()
```

```python
# app/services/weight_service.py
from fastapi import HTTPException, status
from app.repositories.weight_repository import WeightRepository

class WeightService:
    def __init__(self, repo: WeightRepository):
        self.repo = repo

    def update_weight(self, weight_id: int, user_client_id: int, payload: dict):
        weight = self.repo.get_by_id(weight_id)
        if not weight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weight log not found")
        if weight.client_id != user_client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        for key, value in payload.items():
            setattr(weight, key, value)

        self.repo.db.commit()
        self.repo.db.refresh(weight)
        return weight
```

---

## 7) Router example (thin controller)

```python
# app/api/v1/endpoints/weights.py
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, get_db
from app.repositories.weight_repository import WeightRepository
from app.services.weight_service import WeightService
from app.schemas.weight import WeightUpdate, WeightResponse

router = APIRouter(prefix="/weights", tags=["weights"])

@router.put("/{weight_id}", response_model=WeightResponse)
def update_weight(weight_id: int, data: WeightUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    service = WeightService(WeightRepository(db))
    return service.update_weight(weight_id, current_user.client_profile.id, data.model_dump(exclude_unset=True))
```

---

## 8) Logging middleware

```python
# app/core/middleware.py
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.request")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
```

---

## 9) Global exception handlers

```python
# app/core/exceptions.py
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": "validation_error", "details": exc.errors()})

async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "internal_server_error"})
```

Register in `main.py`:

```python
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)
```

---

## 10) Token refresh + secure cookie auth

```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Response

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(response: Response):
    access_token = "..."
    refresh_token = "..."

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 3600,
        path="/auth/refresh",
    )
    return {"message": "logged_in"}

@router.post("/refresh")
def refresh(response: Response):
    # verify refresh token, rotate refresh + issue new access
    ...
```

---

## 11) Rate limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
def login(...):
    ...
```

---

## 12) Security headers middleware

```python
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

## 13) Alembic setup

Initialize:

```bash
cd backend
alembic init alembic
```

`alembic/env.py` (key lines):

```python
from app.db.base import Base
from app.db.session import engine
from app.db import models  # noqa

target_metadata = Base.metadata
```

Create migration:

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Deployment rule:
- Run `alembic upgrade head` in CI/CD before app startup.

---

## 14) Full CRUD standard template

Use this service contract per module (weight/mood/supplement):
- `create(payload, user_client_id)` → 201/200
- `list(user_client_id, filters)` → 200
- `get_by_id(id, user_client_id)` → 200/404/403
- `update(id, payload, user_client_id)` → 200/404/403
- `delete(id, user_client_id)` → 200/404/403

Business rules always in service layer; repositories only access DB.

---

## 15) Migration Checklist

1. Add new module layout without deleting old routes.
2. Move one domain at a time: `weight` → `mood` → `supplement`.
3. Keep endpoint paths unchanged to avoid frontend breakage.
4. Add tests for service layer ownership logic.
5. Add Alembic and stop using runtime `create_all` in production.
6. Enable secure cookie auth for browser clients.
7. Validate logs, exception shape, and headers in staging.
8. Switch traffic after all tests pass.

---

## 16) Recommended Implementation Order (for your current codebase)

1. `core/config.py`, `db/session.py`, `api/deps.py`
2. `repositories/*` and `services/*` for weight/mood/supplement
3. Move current client CRUD endpoints into `api/v1/endpoints/*`
4. Add request logging middleware + exception handlers
5. Add secure cookie endpoints for login/refresh/logout
6. Add Alembic migration baseline
7. Final integration test pass (`pytest -v`)
