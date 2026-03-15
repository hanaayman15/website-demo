"""Base repository primitives for phased migration."""
from sqlalchemy.orm import Session


class BaseRepository:
    """Base repository with shared SQLAlchemy session."""

    def __init__(self, db: Session):
        self.db = db
