"""W09 authenticated activity-log endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.routes.deps import require_user_dependency
from backend.schemas.activity import ActivityLogCreate, ActivityLogResponse
from backend.services.auth_service import VerifiedUser, resolve_user_id
from backend.services.supabase_service import supabase_service

router = APIRouter(prefix="/activity", tags=["Activity"])


def _response(row: dict) -> dict:
    return {
        "id": str(row.get("id")),
        "user_id": row.get("user_id"),
        "activity_type": row.get("activity_type"),
        "local_date": str(row.get("local_date"))[:10],
        "source": row.get("source"),
        "operation_id": row.get("operation_id"),
        "started_at": row.get("started_at"),
        "ended_at": row.get("ended_at"),
        "active_duration_seconds": row.get("active_duration_seconds"),
        "duration_minutes": row.get("duration_minutes"),
        "distance_km": row.get("distance_km"),
        "distance_entered": bool(row.get("distance_entered")),
        "completed": bool(row.get("completed")),
        "notes": row.get("notes"),
        "created_at": row.get("created_at"),
    }


@router.get("/logs", response_model=list[ActivityLogResponse])
def list_activity_logs(
    local_date: str | None = Query(default=None),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    rows = supabase_service.list_activity_logs(user_id, local_date)
    return [_response(row) for row in rows]


@router.post("/logs", response_model=ActivityLogResponse)
def create_activity_log(
    request: ActivityLogCreate,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    row = supabase_service.create_activity_log(
        {
            "user_id": user_id,
            "activity_type": request.activity_type,
            "local_date": request.local_date,
            "source": request.source,
            "operation_id": request.operation_id,
            "started_at": request.started_at,
            "ended_at": request.ended_at,
            "active_duration_seconds": request.active_duration_seconds,
            "duration_minutes": request.duration_minutes,
            "distance_km": request.distance_km,
            "distance_entered": request.distance_entered,
            "completed": request.completed,
            "notes": request.notes,
        }
    )
    return ActivityLogResponse.model_validate(_response(row))
