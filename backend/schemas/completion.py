"""Pydantic schema for Workout Completion logging."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class WorkoutCompletionRequest(BaseModel):
    user_id: Optional[str] = "user_default"
    activity_id: str = Field(..., description="Actual performed activity identifier")
    requested_activity_id: Optional[str] = Field(
        None, description="Original user preference before accessibility adaptation"
    )
    progression_key: str = Field(
        ..., description="Key governing progression ('strength', 'running', 'accessible_cardio')"
    )
    session_type: Optional[str] = None
    completion_pct: float = Field(..., ge=0, le=100, description="Overall workout completion %")
    exercise_completion_pct: Optional[dict[str, float]] = Field(
        default_factory=dict,
        description="Individual strength family completion % (squat, lunge, pushup, bicep_curl, supported_row)",
    )


class WorkoutCompletionResponse(BaseModel):
    success: bool
    user_id: str
    activity_id: str
    progression_key: str
    completion_pct: float
    overall_completion_pct: Optional[float]
    activity_can_progress: bool
    exercise_advances: dict[str, bool]
    total_logged_sessions: int
    current_state: dict[str, Any]
    message: str = "Workout completion logged and progression updated."
