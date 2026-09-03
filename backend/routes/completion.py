"""Workout completion and progression logging endpoint."""

from fastapi import APIRouter, HTTPException
from backend.schemas.completion import (
    WorkoutCompletionRequest,
    WorkoutCompletionResponse,
)
from backend.services.progression_service import progression_service

router = APIRouter(prefix="/workout", tags=["Workout Completion"])


@router.post("/complete", response_model=WorkoutCompletionResponse)
def complete_workout(payload: WorkoutCompletionRequest):
    try:
        user_id = payload.user_id or "user_default"

        result = progression_service.record_completion(
            user_id=user_id,
            activity_id=payload.activity_id,
            progression_key=payload.progression_key,
            completion_pct=payload.completion_pct,
            requested_activity_id=payload.requested_activity_id,
            session_type=payload.session_type,
            exercise_completion_pct=payload.exercise_completion_pct,
        )

        return WorkoutCompletionResponse(
            success=result["success"],
            user_id=result["user_id"],
            activity_id=result["activity_id"],
            progression_key=result["progression_key"],
            completion_pct=result["completion_pct"],
            overall_completion_pct=result["overall_completion_pct"],
            activity_can_progress=result["activity_can_progress"],
            exercise_advances=result["exercise_advances"],
            total_logged_sessions=result["total_logged_sessions"],
            current_state=result["current_state"],
            message="Workout completion recorded and progression gate evaluated.",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
