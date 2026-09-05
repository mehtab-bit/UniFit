"""Pydantic schemas for Profile and Onboarding data."""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

SexOption = Literal["male", "female"]
FitnessGoalOption = Literal["fat_loss", "maintain", "muscle_gain", "lose_fat"]
LifestyleOption = Literal["sedentary", "light", "moderate", "very_active"]
DietOption = Literal["vegan", "vegetarian", "eggetarian", "non_vegetarian"]
AccessibilityOption = Literal["none", "blind_low_vision", "deaf_hard_of_hearing", "other"]


class EngineProfilePayload(BaseModel):
    """Authoritative input schema required by the Python fitness engine."""

    age: int = Field(..., ge=14, le=100, description="Age in years")
    sex: SexOption = Field(..., description="Biological sex ('male' or 'female')")
    height_cm: float = Field(..., gt=50, lt=260, description="Height in cm")
    weight_kg: float = Field(..., gt=25, lt=350, description="Weight in kg")
    goal: str = Field(..., description="Fitness goal ('fat_loss', 'maintain', 'muscle_gain')")
    lifestyle_activity: LifestyleOption = Field(
        ..., description="Daily baseline movement outside planned exercise"
    )
    diet: DietOption = Field(..., description="Dietary pattern")
    accessibility_id: AccessibilityOption = Field(
        default="none", description="Accessibility profile ID"
    )

    def normalized_goal(self) -> str:
        return "fat_loss" if self.goal in ("fat_loss", "lose_fat") else self.goal


class UserProfileRequest(BaseModel):
    """Frontend onboarding / profile schema with comprehensive user context."""

    user_id: Optional[str] = "user_default"
    full_name: Optional[str] = "UniFit Athlete"
    age: int = Field(..., ge=14, le=100)
    sex: SexOption
    height_cm: float = Field(..., gt=50, lt=260)
    weight_kg: float = Field(..., gt=25, lt=350)
    goal: FitnessGoalOption = Field(..., alias="fitness_goal")
    lifestyle_activity: LifestyleOption
    diet: DietOption
    preferred_activities: list[str] = Field(default_factory=lambda: ["running", "cycling"])
    accessibility_id: AccessibilityOption = "none"
    accessibility_resources: list[str] = Field(default_factory=list)
    has_exercise_restriction: bool = False
    exercise_restriction_description: Optional[str] = None
    strength_equipment: list[str] = Field(default_factory=list)
    strength_experience: Optional[str] = None

    class Config:
        populate_by_name = True

    def to_engine_payload(self) -> EngineProfilePayload:
        return EngineProfilePayload(
            age=self.age,
            sex=self.sex,
            height_cm=self.height_cm,
            weight_kg=self.weight_kg,
            goal=self.goal,
            lifestyle_activity=self.lifestyle_activity,
            diet=self.diet,
            accessibility_id=self.accessibility_id,
        )


class ProfilePreviewResponse(BaseModel):
    """Preview response returned on onboarding step completion."""

    user: dict
    bmr_kcal: float
    baseline_maintenance_kcal: float
    goal_adjustment_percent: float
    protein_targets: dict[str, float]
    lifestyle_target_active_days: int
    accessibility_summary: dict


class ProfileWriteRequest(BaseModel):
    """Complete committed profile contract (all onboarding fields)."""

    model_config = ConfigDict(populate_by_name=True)

    full_name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=18, le=100)
    sex: Optional[SexOption] = None
    height_cm: Optional[float] = Field(default=None, gt=50, lt=260)
    weight_kg: Optional[float] = Field(default=None, gt=25, lt=350)
    fitness_goal: Optional[FitnessGoalOption] = Field(default=None, alias="goal")
    lifestyle_activity: Optional[LifestyleOption] = None
    diet: Optional[DietOption] = None
    preferred_activities: list[str] = Field(default_factory=list)
    accessibility_needs: list[AccessibilityOption] = Field(default_factory=list)
    accessibility_other_details: Optional[str] = None
    blind_low_vision_resources: list[str] = Field(default_factory=list)
    has_exercise_restriction: Optional[bool] = None
    exercise_restriction_description: Optional[str] = None
    strength_equipment: list[str] = Field(default_factory=list)
    strength_equipment_other: Optional[str] = None
    strength_experience: Optional[str] = None
    onboarding_completed: bool = False
    expected_profile_revision: Optional[int] = Field(default=None, ge=1)


class ProfileResponse(BaseModel):
    """Full committed profile returned by GET/PUT /api/v1/profile/me."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    user_id: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[SexOption] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    fitness_goal: Optional[str] = None
    lifestyle_activity: Optional[LifestyleOption] = None
    diet: Optional[DietOption] = None
    preferred_activities: list[str] = Field(default_factory=list)
    accessibility_needs: list[str] = Field(default_factory=list)
    accessibility_other_details: Optional[str] = None
    blind_low_vision_resources: list[str] = Field(default_factory=list)
    has_exercise_restriction: Optional[bool] = None
    exercise_restriction_description: Optional[str] = None
    strength_equipment: list[str] = Field(default_factory=list)
    strength_equipment_other: Optional[str] = None
    strength_experience: Optional[str] = None
    onboarding_completed: bool = False
    profile_revision: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
