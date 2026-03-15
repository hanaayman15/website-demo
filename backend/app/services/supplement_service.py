"""Supplement service for business logic."""
from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException, status
from app.repositories.supplement_repository import SupplementRepository
from app.schemas import SupplementLogCreate, SupplementLogUpdate


class SupplementService:
    """Service for supplement tracking business logic."""

    def __init__(self, supplement_repository: SupplementRepository):
        self.supplement_repository = supplement_repository

    def create_supplement_log(self, payload: SupplementLogCreate, current_client_id: int):
        """
        Create a new supplement log.
        
        Args:
            payload: Supplement log data
            current_client_id: ID of the authenticated client
            
        Returns:
            Created supplement log entry
            
        Raises:
            HTTPException: 403 if client_id mismatch
        """
        # Verify ownership
        if payload.client_id != current_client_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return self.supplement_repository.create(
            client_id=payload.client_id,
            supplement_name=payload.supplement_name,
            dosage=payload.dosage,
            time_taken=payload.time_taken,
            notes=payload.notes,
        )

    def get_supplement_logs(
        self,
        current_client_id: int,
        days: int = 30,
        skip: int = 0,
        limit: int = 50,
    ) -> List:
        """
        Get supplement logs for a client.
        
        Args:
            current_client_id: ID of the authenticated client
            days: Number of days to look back
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of supplement log entries
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return self.supplement_repository.list_recent(
            client_id=current_client_id,
            cutoff_date=cutoff_date,
            skip=skip,
            limit=limit,
        )

    def update_supplement_log(
        self,
        supplement_id: int,
        payload: SupplementLogUpdate,
        current_client_id: int,
    ):
        """
        Update a supplement log.
        
        Args:
            supplement_id: ID of the supplement log to update
            payload: Update data
            current_client_id: ID of the authenticated client
            
        Returns:
            Updated supplement log entry
            
        Raises:
            HTTPException: 404 if not found, 403 if ownership check fails
        """
        supplement = self.supplement_repository.get_by_id(supplement_id)

        if not supplement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplement log not found"
            )

        if supplement.client_id != current_client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )

        update_data = payload.model_dump(exclude_unset=True)
        return self.supplement_repository.update(supplement, update_data)

    def delete_supplement_log(self, supplement_id: int, current_client_id: int) -> dict:
        """
        Delete a supplement log.
        
        Args:
            supplement_id: ID of the supplement log to delete
            current_client_id: ID of the authenticated client
            
        Returns:
            Success message
            
        Raises:
            HTTPException: 404 if not found, 403 if ownership check fails
        """
        supplement = self.supplement_repository.get_by_id(supplement_id)

        if not supplement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplement log not found"
            )

        if supplement.client_id != current_client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )

        self.supplement_repository.delete(supplement)
        return {"message": "Supplement log deleted successfully"}
