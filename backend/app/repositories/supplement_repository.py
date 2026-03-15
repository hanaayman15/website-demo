"""Supplement repository for data access operations."""
from datetime import datetime, timedelta
from typing import List, Optional
from app.models import SupplementLog
from app.repositories.base import BaseRepository


class SupplementRepository(BaseRepository):
    """Repository for supplement log data operations."""

    def create(
        self,
        client_id: int,
        supplement_name: str,
        dosage: Optional[str] = None,
        time_taken: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> SupplementLog:
        """Create a new supplement log entry."""
        supplement = SupplementLog(
            client_id=client_id,
            supplement_name=supplement_name,
            dosage=dosage,
            time_taken=time_taken,
            notes=notes,
        )
        self.db.add(supplement)
        self.db.commit()
        self.db.refresh(supplement)
        return supplement

    def list_recent(
        self,
        client_id: int,
        cutoff_date: datetime,
        skip: int = 0,
        limit: int = 50,
    ) -> List[SupplementLog]:
        """List recent supplement logs for a client."""
        return (
            self.db.query(SupplementLog)
            .filter(
                SupplementLog.client_id == client_id,
                SupplementLog.logged_at >= cutoff_date,
            )
            .order_by(SupplementLog.logged_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, supplement_id: int) -> Optional[SupplementLog]:
        """Get a supplement log by ID."""
        return self.db.query(SupplementLog).filter(SupplementLog.id == supplement_id).first()

    def update(self, entry: SupplementLog, update_data: dict) -> SupplementLog:
        """Update a supplement log entry."""
        for key, value in update_data.items():
            setattr(entry, key, value)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: SupplementLog) -> None:
        """Delete a supplement log entry."""
        self.db.delete(entry)
        self.db.commit()
