"""Pydantic schemas for Progress, Streak, and the Combined Fitness Plan."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

from backend.schemas.profile import EngineProfilePayload
from backend.schemas.workout import WorkoutDaySchema
from backend.schemas.nutrition import WeeklyNutritionDaySchema
from backend.schemas.meal import MealPlanDaySchema


class WeeklyPlanRequest(BaseModel):
    user_id: Optional[str] = "user_default"
    profile: Optional[EngineProfilePayload] = None
    activity_preferences: list[str] = Field(default_factory=lambda: ["running", "cycling"])
    week_number: Optional[int] = Field(default=None, ge=1, le=8)
    week_start_date: Optional[str] = Field(
        default=None, description="Monday date YYYY-MM-DD for the plan week"
    )
    use_server_profile: bool = Field(
        default=False,
        description=(
            "Generate from the committed server profile instead of client "
            "supplied profile payload."
        ),
    )
    expected_profile_revision: Optional[int] = Field(default=None, ge=1)
    force_regenerate: bool = False
    previous_progress: Optional[dict[str, Any]] = None
    initial_strength_levels: Optional[dict[str, int]] = None
    accessibility_resources: list[str] = Field(default_factory=list)


class CombinedWeeklyPlanResponse(BaseModel):
    """
    Preferred combined endpoint response containing the entire generated fitness week:
    workouts, daily nutrition targets, and portion-scaled meal plans.
    """

    week_number: int
    plan_id: Optional[str] = None
    week_start_date: Optional[str] = None
    profile_revision: Optional[int] = None
    progression_revision: Optional[int] = None
    engine_version: Optional[str] = None
    rule_data_version: Optional[str] = None
    generation_status: Optional[str] = None
    user_id: Optional[str] = "user_default"
    user: dict[str, Any]
    workouts: list[WorkoutDaySchema]
    nutrition: list[WeeklyNutritionDaySchema]
    meals: list[MealPlanDaySchema]
    progression_decisions: dict[str, Any] = Field(default_factory=dict)
    strength_exercise_decisions: dict[str, Any] = Field(default_factory=dict)
    accessibility_unavailable_slots: list[dict[str, Any]] = Field(default_factory=list)


class StreakResponse(BaseModel):
    user_id: str
    current_streak: int = 0
    best_streak: int = 0
    weekly_adherence_pct: float = 0.0
    active_days_this_week: int = 0
    total_active_days_target: int = 4


class ProgressSummaryResponse(BaseModel):
    user_id: str
    current_week: int
    monthly_consistency_pct: float
    activity_rule_week: dict[str, int]
    exercise_rule_week: dict[str, int]
    strength_variation_levels: dict[str, int]
    logged_sessions_count: int
    recent_activity_completions: dict[str, float]
