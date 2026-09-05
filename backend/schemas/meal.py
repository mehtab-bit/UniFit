"""Pydantic schemas for Meals, Ingredients, and Weekly Meal Plans."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


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


class NutrientSnapshotSchema(BaseModel):
    calories_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbohydrates_g: Optional[float] = None
    fat_g: Optional[float] = None
    fibre_g: Optional[float] = None
    carbohydrate_complete: bool = False
    fiber_complete: bool = False


class MealLogEntryCreate(BaseModel):
    local_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meal_type: Optional[str] = None
    source: str = Field(..., pattern="^(planned_meal|food|custom)$")
    plan_meal_id: Optional[str] = None
    food_code: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float = Field(..., gt=0)
    quantity_unit: str = Field(default="serving", pattern="^(serving|gram|piece)$")
    nutrition: NutrientSnapshotSchema
    notes: Optional[str] = None


class MealLogEntryUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    meal_type: Optional[str] = None
    source: Optional[str] = Field(default=None, pattern="^(planned_meal|food|custom)$")
    plan_meal_id: Optional[str] = None
    food_code: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: Optional[float] = Field(default=None, gt=0)
    quantity_unit: Optional[str] = Field(
        default=None, pattern="^(serving|gram|piece)$"
    )
    nutrition: Optional[NutrientSnapshotSchema] = None
    notes: Optional[str] = None


class MealLogEntryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str
    local_date: str
    meal_type: Optional[str] = None
    source: str
    plan_meal_id: Optional[str] = None
    food_code: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    quantity_unit: str
    nutrition: NutrientSnapshotSchema
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FoodSearchResult(BaseModel):
    food_code: str
    display_name: str
    energy_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbohydrate_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    carbohydrate_status: Optional[str] = None
    fiber_status: Optional[str] = None
