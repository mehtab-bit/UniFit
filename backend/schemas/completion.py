"""Pydantic schema for Workout Completion logging."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class WorkoutCompletionRequest(BaseModel):
    user_id: Optional[str] = "user_default"
    operation_id: Optional[str] = Field(
        default=None,
        description="Client-generated idempotency key reused on retries.",
    )
    scheduled_workout_id: Optional[str] = Field(
        default=None,
        description="Stable identity of the issued scheduled workout.",
    )
    local_date: Optional[str] = Field(
        default=None,
        description="User-local workout date YYYY-MM-DD.",
    )
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    active_duration_seconds: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
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
    source: str = Field(
        default="camera",
        description="How the session was recorded: camera-detected or manual counting.",
    )
    reps_completed: Optional[int] = Field(
        None, description="Total repetitions actually completed in the session."
    )
    range_score: Optional[float] = Field(
        None, description="Average calibration-based range score (0-100)."
    )
    issue_codes: Optional[list[str]] = Field(
        None, description="Form/geometry issue codes observed during the session."
    )


class WorkoutCompletionResponse(BaseModel):
    success: bool
    duplicate: bool = False
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
