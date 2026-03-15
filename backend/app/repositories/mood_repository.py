"""Mood repository for data access operations."""
from datetime import datetime, timedelta
from typing import List, Optional
from app.models import MoodLog
from app.repositories.base import BaseRepository


class MoodRepository(BaseRepository):
    """Repository for mood log data operations."""

    def create(
        self,
        client_id: int,
        mood_level: int,
        energy_level: Optional[int] = None,
        stress_level: Optional[int] = None,
        sleep_hours: Optional[float] = None,
        sleep_quality: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> MoodLog:
        """Create a new mood log entry."""
        mood = MoodLog(
            client_id=client_id,
            mood_level=mood_level,
            energy_level=energy_level,
            stress_level=stress_level,
            sleep_hours=sleep_hours,
            sleep_quality=sleep_quality,
            notes=notes,
        )
        self.db.add(mood)
        self.db.commit()
        self.db.refresh(mood)
        return mood

    def list_recent(
        self,
        client_id: int,
        cutoff_date: datetime,
        skip: int = 0,
        limit: int = 50,
    ) -> List[MoodLog]:
        """List recent mood logs for a client."""
        return (
            self.db.query(MoodLog)
            .filter(
                MoodLog.client_id == client_id,
                MoodLog.logged_at >= cutoff_date,
            )
            .order_by(MoodLog.logged_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, mood_id: int) -> Optional[MoodLog]:
        """Get a mood log by ID."""
        return self.db.query(MoodLog).filter(MoodLog.id == mood_id).first()

    def update(self, entry: MoodLog, update_data: dict) -> MoodLog:
        """Update a mood log entry."""
        for key, value in update_data.items():
            setattr(entry, key, value)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: MoodLog) -> None:
        """Delete a mood log entry."""
        self.db.delete(entry)
        self.db.commit()
