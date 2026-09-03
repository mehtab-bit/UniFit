"""Pydantic schemas for Daily and Weekly Nutrition Targets."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class DailyNutritionTargetsSchema(BaseModel):
    activity_type: str
    session_type: str
    workout_title: str
    duration_minutes: int
    intensity: str
    accessibility_adapted: bool

    bmr_kcal: float
    baseline_maintenance_kcal: float
    workout_kcal: float
    daily_maintenance_kcal: float
    goal_adjustment_percent: float

    target_kcal: float
    calorie_min_kcal: float
    calorie_max_kcal: float

    protein_min_g: float
    protein_target_g: float
    protein_max_g: float
    carbohydrate_target_g: Optional[float] = None
    fat_target_g: float
    fiber_target_g: Optional[float] = None

    protein_calorie_pct: float
    carbohydrate_calorie_pct: Optional[float] = None
    fat_calorie_pct: float


class WeeklyNutritionDaySchema(BaseModel):
    day: str
    day_number: int
    is_rest_day: bool
    rest_reason: Optional[str] = None
    workout_title: str
    activity_type: str
    requested_activity_id: Optional[str] = None
    progression_key: Optional[str] = None
    accessibility_adapted: bool
    nutrition: DailyNutritionTargetsSchema


class WeeklyNutritionPlanResponse(BaseModel):
    week_number: int
    lifestyle: str
    diet: str
    accessibility_id: str
    protein_rule_g_per_kg: str
    days: list[WeeklyNutritionDaySchema]
