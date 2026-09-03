"""Pydantic schemas for Meals, Ingredients, and Weekly Meal Plans."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class ScaledIngredientSchema(BaseModel):
    food_code: Optional[str] = None
    name: str
    amount: str
    quantity_g: Optional[float] = None
    quantity_basis: Optional[str] = None


class MealSelectionSchema(BaseModel):
    meal_id: str
    meal_name: str
    title: Optional[str] = None  # Frontend convenience alias
    meal_type: str
    portion_multiplier: float
    portion_label: str
    servings: Optional[float] = None  # Same as portion_multiplier
    kcal: float
    calories: Optional[float] = None  # Frontend convenience alias
    protein_g: float
    known_carbohydrate_g: Optional[float] = None
    carbohydrates_g: Optional[float] = None  # Alias
    fat_g: float
    known_fiber_g: Optional[float] = None
    fiber_g: Optional[float] = None  # Alias
    carbohydrate_complete: bool
    fiber_complete: bool
    prep_note: str
    ingredients: list[dict[str, Any]] = Field(default_factory=list)
    scaled_ingredient_quantities: list[ScaledIngredientSchema] = Field(default_factory=list)


class MealPlanDaySchema(BaseModel):
    day: str
    day_number: int
    workout_title: str
    activity_type: str
    target: dict[str, Any]
    meals: list[MealSelectionSchema]
    totals: dict[str, Any]
    target_difference: dict[str, Any]
    carbohydrate_complete: bool
    fiber_complete: bool
    score: float


class WeeklyMealPlanResponse(BaseModel):
    week_number: int
    diet: str
    days: list[MealPlanDaySchema]
