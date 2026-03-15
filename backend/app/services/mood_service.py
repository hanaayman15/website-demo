"""Mood service for business logic."""
from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException, status
from app.repositories.mood_repository import MoodRepository
from app.schemas import MoodLogCreate, MoodLogUpdate


class MoodService:
    """Service for mood tracking business logic."""

    def __init__(self, mood_repository: MoodRepository):
        self.mood_repository = mood_repository

    def create_mood_log(self, payload: MoodLogCreate, current_client_id: int):
        """
        Create a new mood log.
        
        Args:
            payload: Mood log data
            current_client_id: ID of the authenticated client
            
        Returns:
            Created mood log entry
            
        Raises:
            HTTPException: 403 if client_id mismatch
        """
        # Verify ownership
        if payload.client_id != current_client_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return self.mood_repository.create(
            client_id=payload.client_id,
            mood_level=payload.mood_level,
            energy_level=payload.energy_level,
            stress_level=payload.stress_level,
            sleep_hours=payload.sleep_hours,
            sleep_quality=payload.sleep_quality,
            notes=payload.notes,
        )

    def get_mood_logs(
        self,
        current_client_id: int,
        days: int = 30,
        skip: int = 0,
        limit: int = 50,
    ) -> List:
        """
        Get mood logs for a client.
        
        Args:
            current_client_id: ID of the authenticated client
            days: Number of days to look back
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of mood log entries
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return self.mood_repository.list_recent(
            client_id=current_client_id,
            cutoff_date=cutoff_date,
            skip=skip,
            limit=limit,
        )

    def update_mood_log(
        self,
        mood_id: int,
        payload: MoodLogUpdate,
        current_client_id: int,
    ):
        """
        Update a mood log.
        
        Args:
            mood_id: ID of the mood log to update
            payload: Update data
            current_client_id: ID of the authenticated client
            
        Returns:
            Updated mood log entry
            
        Raises:
            HTTPException: 404 if not found, 403 if ownership check fails
        """
        mood = self.mood_repository.get_by_id(mood_id)

        if not mood:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mood log not found"
            )

        if mood.client_id != current_client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )

        update_data = payload.model_dump(exclude_unset=True)
        return self.mood_repository.update(mood, update_data)

    def delete_mood_log(self, mood_id: int, current_client_id: int) -> dict:
        """
        Delete a mood log.
        
        Args:
            mood_id: ID of the mood log to delete
            current_client_id: ID of the authenticated client
            
        Returns:
            Success message
            
        Raises:
            HTTPException: 404 if not found, 403 if ownership check fails
        """
        mood = self.mood_repository.get_by_id(mood_id)

        if not mood:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mood log not found"
            )

        if mood.client_id != current_client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )

        self.mood_repository.delete(mood)
        return {"message": "Mood log deleted successfully"}
