from dataclasses import dataclass, asdict
from typing import Literal


# ============================================================
# TYPES
# ============================================================

Sex = Literal[
    "male",
    "female",
]

Goal = Literal[
    "fat_loss",
    "maintain",
    "muscle_gain",
]

LifestyleActivity = Literal[
    "sedentary",
    "light",
    "moderate",
    "very_active",
]

DietType = Literal[
    "vegan",
    "vegetarian",
    "eggetarian",
    "non_vegetarian",
]


# ============================================================
# USER PROFILE
# ============================================================
#
# IMPORTANT:
#
# Workout type is NOT stored here.
#
# The user may:
#
# Monday    -> strength
# Tuesday   -> running
# Wednesday -> rest
#
# That information will go into daily_targets.py later.
#
# lifestyle_activity means normal movement OUTSIDE the
# planned workout.
# ============================================================

@dataclass
class UserProfile:

    age: int

    sex: Sex

    height_cm: float

    weight_kg: float

    goal: Goal

    lifestyle_activity: LifestyleActivity

    diet: DietType


# ============================================================
# BASELINE OUTPUT
# ============================================================
#
# This is NOT the final calorie/macronutrient target for a day.
#
# It provides the stable information that daily_targets.py
# will use together with that day's workout.
# ============================================================

@dataclass
class BaselineNutritionTargets:

    # --------------------------------------------------------
    # User information
    # --------------------------------------------------------

    age: int

    sex: str

    height_cm: float

    weight_kg: float

    diet: str

    goal: str

    lifestyle_activity: str


    # --------------------------------------------------------
    # Baseline energy
    # --------------------------------------------------------

    bmr_kcal: float

    baseline_maintenance_kcal: float


    # --------------------------------------------------------
    # Goal adjustment
    # --------------------------------------------------------

    goal_adjustment_percent: float


    # --------------------------------------------------------
    # Protein
    #
    # Protein remains relatively stable across workout days.
    # --------------------------------------------------------

    protein_min_g: float

    protein_target_g: float

    protein_max_g: float


    def to_dict(self):

        return asdict(self)


# ============================================================
# CONFIGURATION
# ============================================================


# ------------------------------------------------------------
# LIFESTYLE FACTORS
# ------------------------------------------------------------
#
# IMPORTANT:
#
# These factors represent NON-WORKOUT daily activity.
#
# We deliberately keep them more conservative than traditional
# TDEE exercise multipliers because planned exercise will be
# added separately in daily_targets.py.
#
# This avoids counting the workout twice.
# ------------------------------------------------------------

LIFESTYLE_FACTORS = {

    "sedentary": 1.20,

    "light": 1.30,

    "moderate": 1.40,

    "very_active": 1.50,
}


# ------------------------------------------------------------
# GOAL ADJUSTMENTS
# ------------------------------------------------------------
#
# These are applied later to total daily maintenance AFTER
# that day's workout has been considered.
#
# Example:
#
# baseline maintenance
# +
# workout expenditure
# =
# daily maintenance
#
# THEN:
#
# fat_loss     -> -15%
# maintain     -> 0%
# muscle_gain  -> +10%
#
# ------------------------------------------------------------

GOAL_ADJUSTMENTS = {

    "fat_loss": -0.15,

    "maintain": 0.00,

    "muscle_gain": 0.10,
}


# ------------------------------------------------------------
# PROTEIN RULE
# ------------------------------------------------------------
#
# Locked project requirement:
#
# 1.50 - 1.75 g / kg bodyweight
#
# Midpoint:
#
# 1.625 g / kg
#
# ------------------------------------------------------------

PROTEIN_MIN_PER_KG = 1.50

PROTEIN_TARGET_PER_KG = 1.625

PROTEIN_MAX_PER_KG = 1.75


# ============================================================
# VALIDATION
# ============================================================

def validate_profile(
    profile: UserProfile,
) -> None:


    # --------------------------------------------------------
    # Age
    # --------------------------------------------------------

    if not 18 <= profile.age <= 80:

        raise ValueError(

            "Prototype nutrition engine currently "
            "supports adults aged 18-80."

        )


    # --------------------------------------------------------
    # Height
    # --------------------------------------------------------

    if not 120 <= profile.height_cm <= 230:

        raise ValueError(

            "height_cm must be between "
            "120 and 230."

        )


    # --------------------------------------------------------
    # Weight
    # --------------------------------------------------------

    if not 35 <= profile.weight_kg <= 250:

        raise ValueError(

            "weight_kg must be between "
            "35 and 250."

        )


    # --------------------------------------------------------
    # Sex
    # --------------------------------------------------------

    if profile.sex not in {

        "male",
        "female",

    }:

        raise ValueError(

            "sex must be "
            "'male' or 'female'."

        )


    # --------------------------------------------------------
    # Goal
    # --------------------------------------------------------

    if profile.goal not in GOAL_ADJUSTMENTS:

        raise ValueError(

            f"Unsupported goal: "
            f"{profile.goal}"

        )


    # --------------------------------------------------------
    # Lifestyle
    # --------------------------------------------------------

    if (

        profile.lifestyle_activity

        not in LIFESTYLE_FACTORS

    ):

        raise ValueError(

            "Unsupported lifestyle activity: "
            f"{profile.lifestyle_activity}"

        )


    # --------------------------------------------------------
    # Diet
    # --------------------------------------------------------

    valid_diets = {

        "vegan",
        "vegetarian",
        "eggetarian",
        "non_vegetarian",

    }


    if profile.diet not in valid_diets:

        raise ValueError(

            f"Unsupported diet: "
            f"{profile.diet}"

        )


# ============================================================
# BMR
# ============================================================

def calculate_bmr(
    profile: UserProfile,
) -> float:
    """
    Mifflin-St Jeor equation.

    Male:

        10W + 6.25H - 5A + 5

    Female:

        10W + 6.25H - 5A - 161

    W = weight in kg
    H = height in cm
    A = age
    """


    base = (

        10 * profile.weight_kg

        + 6.25 * profile.height_cm

        - 5 * profile.age

    )


    if profile.sex == "male":

        bmr = base + 5

    else:

        bmr = base - 161


    return round(

        bmr,

        1,

    )


# ============================================================
# BASELINE MAINTENANCE
# ============================================================

def calculate_baseline_maintenance(
    bmr_kcal: float,
    lifestyle_activity: LifestyleActivity,
) -> float:
    """
    Calculates energy requirement from:

        BMR
        +
        ordinary daily movement

    Planned workouts are NOT included here.

    They will be handled by daily_targets.py.
    """


    factor = (

        LIFESTYLE_FACTORS[
            lifestyle_activity
        ]

    )


    calories = (

        bmr_kcal

        *
        factor

    )


    return round(

        calories,

        1,

    )


# ============================================================
# PROTEIN
# ============================================================

def calculate_protein_targets(
    weight_kg: float,
):


    protein_min = (

        weight_kg

        *
        PROTEIN_MIN_PER_KG

    )


    protein_target = (

        weight_kg

        *
        PROTEIN_TARGET_PER_KG

    )


    protein_max = (

        weight_kg

        *
        PROTEIN_MAX_PER_KG

    )


    return (

        round(
            protein_min,
            1,
        ),

        round(
            protein_target,
            1,
        ),

        round(
            protein_max,
            1,
        ),

    )


# ============================================================
# MAIN BASELINE FUNCTION
# ============================================================

def calculate_baseline_targets(
    profile: UserProfile,
) -> BaselineNutritionTargets:


    # --------------------------------------------------------
    # Validate
    # --------------------------------------------------------

    validate_profile(
        profile
    )


    # --------------------------------------------------------
    # BMR
    # --------------------------------------------------------

    bmr = (

        calculate_bmr(
            profile
        )

    )


    # --------------------------------------------------------
    # Baseline maintenance
    #
    # NO planned exercise included.
    # --------------------------------------------------------

    baseline_maintenance = (

        calculate_baseline_maintenance(

            bmr_kcal=bmr,

            lifestyle_activity=
                profile.lifestyle_activity,

        )

    )


    # --------------------------------------------------------
    # Protein
    # --------------------------------------------------------

    (

        protein_min,

        protein_target,

        protein_max,

    ) = calculate_protein_targets(

        profile.weight_kg

    )


    # --------------------------------------------------------
    # Goal adjustment
    #
    # We store this now.
    #
    # daily_targets.py will actually apply it after adding
    # today's workout.
    # --------------------------------------------------------

    goal_adjustment = (

        GOAL_ADJUSTMENTS[
            profile.goal
        ]

    )


    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    return BaselineNutritionTargets(


        # User
        age=
            profile.age,

        sex=
            profile.sex,

        height_cm=
            profile.height_cm,

        weight_kg=
            profile.weight_kg,

        diet=
            profile.diet,

        goal=
            profile.goal,

        lifestyle_activity=
            profile.lifestyle_activity,


        # Energy
        bmr_kcal=
            bmr,

        baseline_maintenance_kcal=
            baseline_maintenance,


        # Goal
        goal_adjustment_percent=
            round(
                goal_adjustment * 100,
                1,
            ),


        # Protein
        protein_min_g=
            protein_min,

        protein_target_g=
            protein_target,

        protein_max_g=
            protein_max,

    )


# ============================================================
# DEMO / TEST
# ============================================================

if __name__ == "__main__":


    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Notice there is NO activity_type here.
    #
    # We are NOT saying this user is permanently:
    #
    # strength
    # running
    # cycling
    #
    # Workout comes later.
    # --------------------------------------------------------

    profile = UserProfile(

        age=22,

        sex="male",

        height_cm=175,

        weight_kg=70,

        goal="muscle_gain",

        lifestyle_activity="moderate",

        diet="vegetarian",

    )


    targets = (

        calculate_baseline_targets(
            profile
        )

    )


    print()

    print("=" * 70)

    print(
        "BASELINE NUTRITION PROFILE"
    )

    print("=" * 70)


    print()

    print(
        "USER"
    )

    print("-" * 70)


    print(

        f"Age: "
        f"{targets.age}"

    )


    print(

        f"Sex: "
        f"{targets.sex}"

    )


    print(

        f"Height: "
        f"{targets.height_cm} cm"

    )


    print(

        f"Weight: "
        f"{targets.weight_kg} kg"

    )


    print(

        f"Diet: "
        f"{targets.diet}"

    )


    print(

        f"Goal: "
        f"{targets.goal}"

    )


    print(

        f"Lifestyle activity: "
        f"{targets.lifestyle_activity}"

    )


    print()

    print(
        "BASELINE ENERGY"
    )

    print("-" * 70)


    print(

        f"BMR: "
        f"{targets.bmr_kcal} kcal"

    )


    print(

        f"Baseline maintenance: "
        f"{targets.baseline_maintenance_kcal} kcal"

    )


    print()

    print(

        "NOTE: planned workout calories "
        "are NOT included yet."

    )


    print()

    print(
        "GOAL"
    )

    print("-" * 70)


    print(

        f"Goal adjustment: "
        f"{targets.goal_adjustment_percent:+.1f}%"

    )


    print()

    print(
        "PROTEIN"
    )

    print("-" * 70)


    print(

        f"Minimum: "
        f"{targets.protein_min_g} g"

    )


    print(

        f"Target:  "
        f"{targets.protein_target_g} g"

    )


    print(

        f"Maximum: "
        f"{targets.protein_max_g} g"

    )


    print()

    print("=" * 70)

    print(
        "BASELINE ENGINE WORKING"
    )

    print("=" * 70)