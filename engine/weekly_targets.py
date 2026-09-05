from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Optional

try:
    from engine.daily_targets import (
        DailyNutritionTargets,
        calculate_daily_targets,
        daily_workout_from_plan_day,
    )
    from engine.nutrition_targets import UserProfile
    from engine.weekly_workout_engine import (
        ProgressState,
        generate_weekly_workout_plan,
    )
except ModuleNotFoundError:
    from daily_targets import (
        DailyNutritionTargets,
        calculate_daily_targets,
        daily_workout_from_plan_day,
    )
    from nutrition_targets import UserProfile
    from weekly_workout_engine import (
        ProgressState,
        generate_weekly_workout_plan,
    )


@dataclass
class WeeklyNutritionDay:
    day: str
    day_number: int
    is_rest_day: bool
    rest_reason: str | None
    workout_title: str
    activity_type: str
    requested_activity_id: str | None
    progression_key: str | None
    accessibility_adapted: bool
    nutrition: dict

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class WeeklyNutritionPlan:
    week_number: int
    lifestyle: str
    diet: str
    accessibility_id: str
    protein_rule_g_per_kg: str
    days: list[WeeklyNutritionDay]

    def to_dict(self) -> dict:
        data = asdict(self)
        return data


def calculate_weekly_nutrition_targets(
    profile: UserProfile,
    workout_plan: dict,
) -> WeeklyNutritionPlan:
    """Calculate nutrition for an already-generated 7-day workout plan.

    This function deliberately consumes the workout plan instead
    of trying to recreate workout logic. That keeps workout and
    nutrition responsibilities separate.
    """

    days = workout_plan.get("days")

    if not isinstance(days, list) or len(days) != 7:
        raise ValueError(
            "workout_plan must contain exactly 7 day objects."
        )

    output_days: list[WeeklyNutritionDay] = []

    for day in days:
        daily_workout = daily_workout_from_plan_day(day)
        targets: DailyNutritionTargets = calculate_daily_targets(
            profile,
            daily_workout,
        )

        source_workout = day.get("workout") or {}

        output_days.append(
            WeeklyNutritionDay(
                day=str(day.get("day", "")),
                day_number=int(day.get("day_number", 0)),
                is_rest_day=bool(day.get("is_rest_day", False)),
                rest_reason=day.get("rest_reason"),
                workout_title=(
                    daily_workout.title
                    if daily_workout.title
                    else "Rest Day"
                ),
                activity_type=daily_workout.activity_type,
                requested_activity_id=(
                    source_workout.get("requested_activity_id")
                    if source_workout
                    else None
                ),
                progression_key=(
                    source_workout.get("progression_key")
                    if source_workout
                    else None
                ),
                accessibility_adapted=(
                    daily_workout.accessibility_adapted
                ),
                nutrition=targets.to_dict(),
            )
        )

    # Protein target should remain stable across all seven days.
    protein_targets = {
        day.nutrition["protein_target_g"]
        for day in output_days
    }

    if len(protein_targets) != 1:
        raise ValueError(
            "Protein target changed between days, but the current "
            "design requires a stable daily protein target."
        )

    return WeeklyNutritionPlan(
        week_number=int(workout_plan["week_number"]),
        lifestyle=str(workout_plan["lifestyle"]),
        diet=str(profile.diet),
        accessibility_id=str(
            workout_plan.get("accessibility_id", "none")
        ),
        protein_rule_g_per_kg="1.5-1.75 (target 1.625)",
        days=output_days,
    )


def generate_combined_week(
    profile: UserProfile,
    preferences: list[str],
    week_number: int,
    previous_progress: Optional[
        ProgressState | dict
    ] = None,
    initial_strength_levels: Optional[
        dict[str, int]
    ] = None,
    accessibility_id: str = "none",
    accessibility_resources: Optional[
        list[str]
    ] = None,
    strength_equipment: Optional[list[str]] = None,
    strength_experience: Optional[str] = None,
) -> dict:
    """Generate workout plan first, then calculate all 7 nutrition targets."""

    workout_plan = generate_weekly_workout_plan(
        lifestyle=profile.lifestyle_activity,
        preferences=preferences,
        week_number=week_number,
        previous_progress=previous_progress,
        initial_strength_levels=initial_strength_levels,
        accessibility_id=accessibility_id,
        accessibility_resources=accessibility_resources,
        strength_equipment=strength_equipment,
        strength_experience=strength_experience,
    )

    nutrition_plan = calculate_weekly_nutrition_targets(
        profile=profile,
        workout_plan=workout_plan,
    )

    return {
        "week_number": week_number,
        "user": {
            "age": profile.age,
            "sex": profile.sex,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "goal": profile.goal,
            "lifestyle_activity": profile.lifestyle_activity,
            "diet": profile.diet,
        },
        "workout_plan": workout_plan,
        "nutrition_plan": nutrition_plan.to_dict(),
    }


def print_weekly_nutrition_summary(combined: dict) -> None:
    nutrition_plan = combined["nutrition_plan"]

    print()
    print("=" * 100)
    print(
        f"WEEK {nutrition_plan['week_number']} - "
        "WORKOUT + NUTRITION TARGETS"
    )
    print("=" * 100)

    print(
        f"Lifestyle: {nutrition_plan['lifestyle']} | "
        f"Diet: {nutrition_plan['diet']} | "
        f"Accessibility: {nutrition_plan['accessibility_id']}"
    )

    print()
    print(
        f"{'Day':10} {'Workout':28} {'Min':>5} "
        f"{'Kcal':>8} {'Workout kcal':>12} "
        f"{'Protein':>10} {'Carbs':>9} {'Fat':>8}"
    )
    print("-" * 100)

    for day in nutrition_plan["days"]:
        n = day["nutrition"]

        print(
            f"{day['day'].title():10} "
            f"{day['workout_title'][:28]:28} "
            f"{n['duration_minutes']:>5} "
            f"{n['target_kcal']:>8.1f} "
            f"{n['workout_kcal']:>12.1f} "
            f"{n['protein_target_g']:>9.1f}g "
            f"{n['carbohydrate_target_g']:>8.1f}g "
            f"{n['fat_target_g']:>7.1f}g"
        )

    print("=" * 100)
    print("WEEKLY WORKOUT -> NUTRITION CONNECTION WORKING")
    print("=" * 100)


if __name__ == "__main__":
    profile = UserProfile(
        age=22,
        sex="male",
        height_cm=175,
        weight_kg=70,
        goal="muscle_gain",
        lifestyle_activity="light",
        diet="vegetarian",
    )

    combined = generate_combined_week(
        profile=profile,
        preferences=[
            "running",
            "cycling",
        ],
        week_number=1,
        accessibility_id="none",
    )

    print_weekly_nutrition_summary(combined)
