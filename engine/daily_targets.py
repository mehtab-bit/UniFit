from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

try:
    from engine.nutrition_targets import (
        UserProfile,
        calculate_baseline_targets,
    )
except ModuleNotFoundError:
    from nutrition_targets import (
        UserProfile,
        calculate_baseline_targets,
    )


ActivityType = Literal[
    "rest",
    "walking",
    "running",
    "cycling",
    "swimming",
    "strength",
]

WorkoutIntensity = Literal[
    "rest",
    "light",
    "moderate",
    "high",
]


@dataclass
class DailyWorkout:
    activity_type: ActivityType
    duration_minutes: int
    intensity: WorkoutIntensity
    session_type: str = "general"
    title: str = ""
    source_activity_id: str | None = None
    progression_key: str | None = None
    accessibility_adapted: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class DailyNutritionTargets:
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
    carbohydrate_target_g: float
    fat_target_g: float
    fiber_target_g: float

    protein_calorie_pct: float
    carbohydrate_calorie_pct: float
    fat_calorie_pct: float

    def to_dict(self) -> dict:
        return asdict(self)


# Approximate MET values for a general-fitness prototype.
# Workout energy is calculated as NET energy using (MET - 1),
# because the baseline maintenance estimate already includes
# resting energy during the workout period.
MET_VALUES = {
    "rest": {
        "rest": 1.0,
    },
    "walking": {
        "light": 2.5,
        "moderate": 3.5,
        "high": 4.5,
    },
    "strength": {
        "light": 3.0,
        "moderate": 5.0,
        "high": 6.0,
    },
    "running": {
        "light": 6.0,
        "moderate": 8.0,
        "high": 10.0,
    },
    "cycling": {
        "light": 4.0,
        "moderate": 6.5,
        "high": 8.5,
    },
    "swimming": {
        "light": 4.5,
        "moderate": 6.0,
        "high": 8.0,
    },
}


# Endurance-oriented days leave a little more of the calorie
# budget available for carbohydrate. These are prototype macro
# allocation rules, not clinical nutrition prescriptions.
FAT_CALORIE_FRACTION = {
    "rest": 0.30,
    "walking": 0.30,
    "strength": 0.28,
    "running": 0.25,
    "cycling": 0.25,
    "swimming": 0.25,
}


INTENSITY_MAP = {
    "rest": "rest",
    "easy": "light",
    "very_easy": "light",
    "very easy": "light",
    "light": "light",
    "low": "light",
    "moderate": "moderate",
    "steady": "moderate",
    "medium": "moderate",
    "moderate_hard": "high",
    "moderate-hard": "high",
    "moderate hard": "high",
    "hard": "high",
    "high": "high",
    "vigorous": "high",
}


def normalize_intensity(value: str) -> WorkoutIntensity:
    normalized = str(value).strip().lower()

    if normalized not in INTENSITY_MAP:
        raise ValueError(
            f"Unsupported workout intensity: {value!r}. "
            f"Supported values include: {sorted(INTENSITY_MAP)}"
        )

    return INTENSITY_MAP[normalized]  # type: ignore[return-value]


def validate_daily_workout(workout: DailyWorkout) -> None:
    if workout.activity_type not in MET_VALUES:
        raise ValueError(
            f"Unsupported activity type: {workout.activity_type}"
        )

    if workout.duration_minutes < 0:
        raise ValueError(
            "duration_minutes cannot be negative."
        )

    if workout.activity_type == "rest":
        if workout.duration_minutes != 0:
            raise ValueError(
                "Rest-day duration must be 0 minutes."
            )
        if workout.intensity != "rest":
            raise ValueError(
                "Rest-day intensity must be 'rest'."
            )
        return

    if workout.duration_minutes <= 0:
        raise ValueError(
            "A non-rest workout must have a positive duration."
        )

    if workout.duration_minutes > 300:
        raise ValueError(
            "Workout duration above 300 minutes is outside "
            "the prototype's supported range."
        )

    if workout.intensity not in {
        "light",
        "moderate",
        "high",
    }:
        raise ValueError(
            "Non-rest intensity must be light, moderate or high."
        )


def estimate_strength_duration_minutes(
    strength_session: dict,
) -> int:
    """Estimate session duration from the generated prescription.

    The workout engine intentionally stores sets/reps/rest per
    exercise rather than one fixed strength duration. This
    function converts that prescription into a practical duration
    estimate for daily energy calculations.
    """

    exercises = strength_session.get("exercises", [])

    if not exercises:
        return 30

    seconds_per_rep = 4
    transition_seconds = 30
    warmup_seconds = 5 * 60
    cooldown_seconds = 5 * 60

    total_seconds = warmup_seconds + cooldown_seconds

    for exercise in exercises:
        sets = int(exercise.get("sets") or 0)
        reps = int(exercise.get("reps") or 0)
        rest_seconds = int(exercise.get("rest_seconds") or 0)
        rep_mode = str(exercise.get("rep_mode") or "total_reps")

        if sets <= 0 or reps <= 0:
            raise ValueError(
                "Strength exercise is missing valid sets/reps: "
                f"{exercise.get('exercise_name', 'unknown exercise')}"
            )

        # Lunges, curls and rows may prescribe reps separately
        # for each side/arm. Account for that movement time.
        side_multiplier = (
            2
            if rep_mode in {
                "reps_each_side",
                "reps_each_arm",
            }
            else 1
        )

        movement_seconds = (
            sets
            * reps
            * side_multiplier
            * seconds_per_rep
        )

        between_set_rest = (
            max(sets - 1, 0)
            * rest_seconds
        )

        total_seconds += (
            movement_seconds
            + between_set_rest
            + transition_seconds
        )

    duration = round(total_seconds / 60)

    return max(duration, 15)


def daily_workout_from_plan_day(day: dict) -> DailyWorkout:
    """Convert one day from weekly_workout_engine into nutrition input."""

    if day.get("is_rest_day", False):
        return DailyWorkout(
            activity_type="rest",
            duration_minutes=0,
            intensity="rest",
            session_type="rest",
            title="Rest Day",
        )

    workout = day.get("workout")

    if not workout:
        raise ValueError(
            "Non-rest day is missing its workout object."
        )

    activity_id = str(workout.get("activity_id", "")).strip()

    if activity_id not in {
        "walking",
        "running",
        "cycling",
        "swimming",
        "strength",
    }:
        raise ValueError(
            "Workout engine returned an unsupported activity_id "
            f"for nutrition calculation: {activity_id!r}"
        )

    if activity_id == "strength":
        duration_minutes = estimate_strength_duration_minutes(
            workout
        )
    else:
        raw_duration = workout.get("duration_min")

        if raw_duration in {None, ""}:
            raise ValueError(
                f"{activity_id} workout is missing duration_min."
            )

        duration_minutes = int(float(raw_duration))

    intensity = normalize_intensity(
        workout.get("intensity", "moderate")
    )

    return DailyWorkout(
        activity_type=activity_id,  # type: ignore[arg-type]
        duration_minutes=duration_minutes,
        intensity=intensity,
        session_type=str(
            workout.get("session_type", "general")
        ),
        title=str(
            workout.get("title", activity_id.title())
        ),
        source_activity_id=str(
            workout.get("requested_activity_id", activity_id)
        ),
        progression_key=str(
            workout.get("progression_key", activity_id)
        ),
        accessibility_adapted=bool(
            workout.get("accessibility_adapted", False)
        ),
    )


def calculate_net_workout_kcal(
    weight_kg: float,
    workout: DailyWorkout,
) -> float:
    validate_daily_workout(workout)

    if weight_kg <= 0:
        raise ValueError("weight_kg must be positive.")

    if workout.activity_type == "rest":
        return 0.0

    met = MET_VALUES[
        workout.activity_type
    ][
        workout.intensity
    ]

    hours = workout.duration_minutes / 60.0

    net_met = max(met - 1.0, 0.0)

    calories = (
        net_met
        * float(weight_kg)
        * hours
    )

    return round(calories, 1)


def calculate_daily_targets(
    profile: UserProfile,
    workout: DailyWorkout,
) -> DailyNutritionTargets:
    validate_daily_workout(workout)

    baseline = calculate_baseline_targets(profile)

    workout_kcal = calculate_net_workout_kcal(
        profile.weight_kg,
        workout,
    )

    daily_maintenance = (
        float(baseline.baseline_maintenance_kcal)
        + workout_kcal
    )

    # nutrition_targets.py stores this as a percentage, e.g.
    # -15.0, 0.0, +10.0.
    adjustment_percent = float(
        baseline.goal_adjustment_percent
    )

    target_kcal = (
        daily_maintenance
        * (1.0 + adjustment_percent / 100.0)
    )

    if target_kcal <= 0:
        raise ValueError(
            "Calculated target calories are not positive."
        )

    protein_min = float(baseline.protein_min_g)
    protein_target = float(baseline.protein_target_g)
    protein_max = float(baseline.protein_max_g)

    if not (
        protein_min
        <= protein_target
        <= protein_max
    ):
        raise ValueError(
            "Baseline protein target is outside its configured range."
        )

    protein_kcal = protein_target * 4.0

    fat_fraction = FAT_CALORIE_FRACTION[
        workout.activity_type
    ]

    fat_kcal = target_kcal * fat_fraction
    fat_target = fat_kcal / 9.0

    remaining_kcal = (
        target_kcal
        - protein_kcal
        - fat_kcal
    )

    if remaining_kcal <= 0:
        raise ValueError(
            "Daily calorie target is too low for the configured "
            "protein and fat allocation."
        )

    carbohydrate_target = remaining_kcal / 4.0

    # General prototype target: ~14 g fibre per 1000 kcal.
    fiber_target = target_kcal / 1000.0 * 14.0

    calorie_min = target_kcal * 0.95
    calorie_max = target_kcal * 1.05

    protein_pct = protein_kcal / target_kcal * 100.0
    carbohydrate_pct = (
        carbohydrate_target * 4.0 / target_kcal * 100.0
    )
    fat_pct = fat_target * 9.0 / target_kcal * 100.0

    macro_pct_sum = protein_pct + carbohydrate_pct + fat_pct

    if abs(macro_pct_sum - 100.0) > 0.2:
        raise ValueError(
            "Macro calorie percentages do not sum to approximately 100%."
        )

    return DailyNutritionTargets(
        activity_type=workout.activity_type,
        session_type=workout.session_type,
        workout_title=workout.title,
        duration_minutes=workout.duration_minutes,
        intensity=workout.intensity,
        accessibility_adapted=workout.accessibility_adapted,

        bmr_kcal=round(float(baseline.bmr_kcal), 1),
        baseline_maintenance_kcal=round(
            float(baseline.baseline_maintenance_kcal),
            1,
        ),
        workout_kcal=round(workout_kcal, 1),
        daily_maintenance_kcal=round(daily_maintenance, 1),
        goal_adjustment_percent=round(adjustment_percent, 1),

        target_kcal=round(target_kcal, 1),
        calorie_min_kcal=round(calorie_min, 1),
        calorie_max_kcal=round(calorie_max, 1),

        protein_min_g=round(protein_min, 1),
        protein_target_g=round(protein_target, 1),
        protein_max_g=round(protein_max, 1),
        carbohydrate_target_g=round(carbohydrate_target, 1),
        fat_target_g=round(fat_target, 1),
        fiber_target_g=round(fiber_target, 1),

        protein_calorie_pct=round(protein_pct, 1),
        carbohydrate_calorie_pct=round(carbohydrate_pct, 1),
        fat_calorie_pct=round(fat_pct, 1),
    )


if __name__ == "__main__":
    profile = UserProfile(
        age=22,
        sex="male",
        height_cm=175,
        weight_kg=70,
        goal="muscle_gain",
        lifestyle_activity="moderate",
        diet="vegetarian",
    )

    demo_workouts = [
        DailyWorkout(
            activity_type="rest",
            duration_minutes=0,
            intensity="rest",
            session_type="rest",
            title="Rest Day",
        ),
        DailyWorkout(
            activity_type="strength",
            duration_minutes=30,
            intensity="moderate",
            session_type="full_body",
            title="Full Body Strength",
        ),
        DailyWorkout(
            activity_type="running",
            duration_minutes=30,
            intensity="moderate",
            session_type="easy",
            title="Easy Run",
        ),
        DailyWorkout(
            activity_type="cycling",
            duration_minutes=40,
            intensity="moderate",
            session_type="steady",
            title="Steady Cycling",
        ),
    ]

    print("=" * 78)
    print("DAILY NUTRITION TARGET ENGINE")
    print("=" * 78)

    for demo in demo_workouts:
        result = calculate_daily_targets(profile, demo)

        print()
        print(
            f"{demo.activity_type.upper():10} | "
            f"{demo.duration_minutes:3} min | "
            f"{demo.intensity}"
        )
        print(f"  Workout kcal : {result.workout_kcal}")
        print(f"  Target kcal  : {result.target_kcal}")
        print(
            f"  Protein      : {result.protein_target_g} g "
            f"({result.protein_min_g}-{result.protein_max_g} g)"
        )
        print(f"  Carbs        : {result.carbohydrate_target_g} g")
        print(f"  Fat          : {result.fat_target_g} g")
        print(f"  Fibre        : {result.fiber_target_g} g")

    print()
    print("=" * 78)
    print("DAILY TARGET ENGINE WORKING")
    print("=" * 78)
