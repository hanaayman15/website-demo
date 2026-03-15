"""Service layer for weight log business rules."""
from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.models import WeightLog
from app.repositories.weight_repository import WeightRepository
from app.schemas import WeightLogCreate, WeightLogUpdate


class WeightService:
    """Business logic for weight tracking flows."""

    def __init__(self, repo: WeightRepository):
        self.repo = repo

    def create_weight_log(self, payload: WeightLogCreate, current_client_id: int) -> WeightLog:
        if payload.client_id != current_client_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return self.repo.create(
            client_id=payload.client_id,
            weight=payload.weight,
            body_fat_percentage=payload.body_fat_percentage,
            notes=payload.notes,
        )

    def get_weight_logs(self, *, current_client_id: int, days: int, skip: int, limit: int) -> list[WeightLog]:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return self.repo.list_recent(
            client_id=current_client_id,
            cutoff_date=cutoff_date,
            skip=skip,
            limit=limit,
        )

    def update_weight_log(self, *, weight_id: int, payload: WeightLogUpdate, current_client_id: int) -> WeightLog:
        weight = self.repo.get_by_id(weight_id)

        if not weight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weight log not found")

        if weight.client_id != current_client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        update_data = payload.model_dump(exclude_unset=True)
        return self.repo.update(weight, update_data)

    def delete_weight_log(self, *, weight_id: int, current_client_id: int) -> None:
        weight = self.repo.get_by_id(weight_id)

        if not weight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weight log not found")

        if weight.client_id != current_client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        self.repo.delete(weight)
