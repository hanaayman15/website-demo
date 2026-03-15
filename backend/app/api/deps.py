"""Centralized dependency providers for API layers."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.dependencies import get_current_admin, get_current_client, get_current_user
from app.repositories.mood_repository import MoodRepository
from app.repositories.supplement_repository import SupplementRepository
from app.repositories.weight_repository import WeightRepository
from app.services.mood_service import MoodService
from app.services.supplement_service import SupplementService
from app.services.weight_service import WeightService


def get_db_session(db: Session = Depends(get_db)) -> Session:
    """Get active SQLAlchemy session."""
    return db


def get_app_settings() -> Settings:
    """Get loaded application settings."""
    return get_settings()


def get_weight_service(db: Session = Depends(get_db)) -> WeightService:
    """Get weight service with repository wiring."""
    return WeightService(WeightRepository(db))


def get_mood_service(db: Session = Depends(get_db)) -> MoodService:
    """Get mood service with repository wiring."""
    return MoodService(MoodRepository(db))


def get_supplement_service(db: Session = Depends(get_db)) -> SupplementService:
    """Get supplement service with repository wiring."""
    return SupplementService(SupplementRepository(db))


__all__ = [
    "get_db_session",
    "get_app_settings",
    "get_weight_service",
    "get_mood_service",
    "get_supplement_service",
    "get_current_user",
    "get_current_admin",
    "get_current_client",
]
