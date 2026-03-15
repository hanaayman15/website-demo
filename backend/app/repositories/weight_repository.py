"""Repository layer for weight logs."""
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import WeightLog
from app.repositories.base import BaseRepository


class WeightRepository(BaseRepository):
    """Data access operations for weight logs."""

    def __init__(self, db: Session):
        super().__init__(db)

    def create(self, *, client_id: int, weight: float, body_fat_percentage: float | None, notes: str | None) -> WeightLog:
        entry = WeightLog(
            client_id=client_id,
            weight=weight,
            body_fat_percentage=body_fat_percentage,
            notes=notes,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_recent(self, *, client_id: int, cutoff_date: datetime, skip: int, limit: int) -> list[WeightLog]:
        return (
            self.db.query(WeightLog)
            .filter(
                WeightLog.client_id == client_id,
                WeightLog.logged_at >= cutoff_date,
            )
            .order_by(WeightLog.logged_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, weight_id: int) -> WeightLog | None:
        return self.db.query(WeightLog).filter(WeightLog.id == weight_id).first()

    def update(self, entry: WeightLog, update_data: dict) -> WeightLog:
        for key, value in update_data.items():
            setattr(entry, key, value)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: WeightLog) -> None:
        self.db.delete(entry)
        self.db.commit()
