"""Pydantic schemas for Workout Sessions, Plans, and Exercises."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


class ExerciseSchema(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    exercise_name: Optional[str] = None
    variation_id: Optional[str] = None
    variation_name: Optional[str] = None
    target: str = ""
    family: Optional[str] = None
    exercise_family: Optional[str] = None
    variation_level: Optional[int | str] = None
    difficulty_level: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rest_seconds: Optional[int] = None
    unit: str = "reps"
    equipment: Optional[str] = None
    form_cues: list[str] = Field(default_factory=list)
    instructions: Optional[str] = None
    audio_instruction: Optional[str] = None
    orientation_cue: Optional[str] = None
    safety_note: Optional[str] = None
    accessibility_guidance: Optional[dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize id from variation_id
            if not data.get("id") and data.get("variation_id"):
                data["id"] = data["variation_id"]
            # Normalize name from exercise_name or variation_name
            if not data.get("name"):
                data["name"] = data.get("exercise_name") or data.get("variation_name") or "Exercise"
            # Normalize family from exercise_family
            if not data.get("family") and data.get("exercise_family"):
                data["family"] = data["exercise_family"]
            # Split semicolon delimited form_cues strings
            cues = data.get("form_cues")
            if isinstance(cues, str):
                data["form_cues"] = [c.strip() for c in cues.split(";") if c.strip()]
            elif cues is None:
                data["form_cues"] = []
        return data


class WorkoutSessionSchema(BaseModel):
    """Exposes all frontend-required workout fields without forcing non-strength workouts into strength formats."""

    id: Optional[str] = None
    title: str
    activity: str = "workout"
    activity_id: str
    requested_activity_id: Optional[str] = None
    progression_key: Optional[str] = None
    session_type: Optional[str] = None
    rule_week: Optional[int] = None

    # Strength specific
    sets: Optional[int] = None
    reps: Optional[int] = None
    rest_seconds: Optional[int] = None
    equipment: Optional[str] = None
    exercises: list[ExerciseSchema] = Field(default_factory=list)

    # Cardio / intervals specific
    distance_km: Optional[float] = None
    distance_m: Optional[float] = None
    duration_min: Optional[int] = None
    interval_count: Optional[int] = None
    work_interval_sec: Optional[int] = None
    recovery_interval_sec: Optional[int] = None
    intensity: Optional[str] = None

    # Structural guidance
    warmup: Optional[str] = None
    workout_instructions: Optional[str] = None
    form_cues: list[str] = Field(default_factory=list)
    cooldown: Optional[str] = None

    # Accessibility
    accessibility_id: Optional[str] = "none"
    accessibility_adapted: bool = False
    accessibility_guidance: Optional[str] = None
    safety_note: Optional[str] = None
    fallback_from_activity: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("activity") and data.get("activity_id"):
                data["activity"] = data["activity_id"]
            cues = data.get("form_cues")
            if isinstance(cues, str):
                data["form_cues"] = [c.strip() for c in cues.split(";") if c.strip()]
            elif cues is None:
                data["form_cues"] = []
        return data


class WorkoutDaySchema(BaseModel):
    day: str
    day_number: int
    local_date: Optional[str] = Field(
        default=None, description="YYYY-MM-DD assigned to this scheduled workout"
    )
    scheduled_workout_id: Optional[str] = Field(
        default=None, description="Stable per user+date scheduled-workout identity"
    )
    is_rest_day: bool
    rest_reason: Optional[str] = None
    workout: Optional[WorkoutSessionSchema] = None
    accessibility_message: Optional[str] = None


class WeeklyWorkoutPlanResponse(BaseModel):
    week_number: int
    lifestyle: str
    active_days_target: Optional[int] = None
    active_days: Optional[int] = None
    accessibility_id: str
    days: list[WorkoutDaySchema]
    progression_decisions: dict[str, Any] = Field(default_factory=dict)
    strength_exercise_decisions: dict[str, Any] = Field(default_factory=dict)
    accessibility_unavailable_slots: list[dict[str, Any]] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_plan(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("active_days") and data.get("active_days_target"):
                data["active_days"] = data["active_days_target"]
            elif not data.get("active_days"):
                days = data.get("days", [])
                data["active_days"] = len([d for d in days if not d.get("is_rest_day")])
        return data
