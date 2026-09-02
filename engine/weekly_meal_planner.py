from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from itertools import product
from pathlib import Path
from typing import Optional
import csv

PLANNER_VERSION = "2.0-user-friendly-portions"

try:
    from engine.nutrition_targets import UserProfile
    from engine.weekly_targets import generate_combined_week
except ModuleNotFoundError:
    from nutrition_targets import UserProfile
    from weekly_targets import generate_combined_week


# ============================================================
# PATHS
# ============================================================

PROCESSED_DIR = Path("data/processed")
FOODS_PATH = PROCESSED_DIR / "foods_100_final.csv"
MEALS_PATH = PROCESSED_DIR / "meals.csv"
MEAL_ITEMS_PATH = PROCESSED_DIR / "meal_items.csv"


# ============================================================
# PLANNER SETTINGS
# ============================================================

MEAL_TYPES = (
    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",
)

# Useful only as a soft distribution preference. The whole-day
# nutrition target is still the main optimization target.
MEAL_CALORIE_SHARES = {
    "breakfast": 0.25,
    "lunch": 0.30,
    "evening_snack": 0.10,
    "dinner": 0.35,
}

# The meal catalogue contains relatively compact recipes. Portion
# multipliers let the same recipe fit users with different energy needs.
MIN_PORTION_MULTIPLIER = 0.75
MAX_PORTION_MULTIPLIER = 2.50

# We first rank unscaled meal combinations, then only portion-optimize
# the best candidates. This keeps the engine fast and deterministic.
TOP_BASE_COMBINATIONS = 36

# Strong variety preference, while still allowing the planner to return
# a result if a diet has limited options.
MAX_PREFERRED_REPEATS_PER_WEEK = 2

# User-facing portions are always practical quarter-serving steps.
# The optimizer may choose any of these values, but never awkward values
# such as 2.44 servings.
PORTION_STEP = 0.25
PORTION_OPTIONS = tuple(
    round(MIN_PORTION_MULTIPLIER + i * PORTION_STEP, 2)
    for i in range(
        int(round((MAX_PORTION_MULTIPLIER - MIN_PORTION_MULTIPLIER) / PORTION_STEP)) + 1
    )
)


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class MealSelection:
    meal_id: str
    meal_name: str
    meal_type: str
    portion_multiplier: float
    portion_label: str
    kcal: float
    protein_g: float
    known_carbohydrate_g: float
    fat_g: float
    known_fiber_g: float
    carbohydrate_complete: bool
    fiber_complete: bool
    prep_note: str
    ingredients: list[dict]

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MealPlanDay:
    day: str
    day_number: int
    workout_title: str
    activity_type: str
    target: dict
    meals: list[MealSelection]
    totals: dict
    target_difference: dict
    carbohydrate_complete: bool
    fiber_complete: bool
    score: float

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class WeeklyMealPlan:
    week_number: int
    diet: str
    days: list[MealPlanDay]

    def to_dict(self) -> dict:
        return asdict(self)


# ============================================================
# CSV HELPERS
# ============================================================

def load_csv(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing meal-planner database file: {path}"
        )

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        return list(csv.DictReader(file))


def as_float(value, default: float = 0.0) -> float:
    if value is None:
        return default

    text = str(value).strip()

    if text == "":
        return default

    return float(text)


def as_bool(value) -> bool:
    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {
        "1",
        "true",
        "yes",
        "y",
        "t",
    }


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))


def format_portion_label(multiplier: float) -> str:
    """Return a clean user-facing serving label."""
    rounded = round(float(multiplier), 2)
    text = f"{rounded:.2f}".rstrip("0").rstrip(".")

    if rounded == 1.0:
        return "1 serving"

    return f"{text} servings"


def validate_portion_multiplier(multiplier: float) -> None:
    """Fail fast if an awkward non-user-facing portion escapes the optimizer."""
    rounded = round(float(multiplier), 2)
    if rounded not in PORTION_OPTIONS:
        raise ValueError(
            f"Invalid portion multiplier {rounded}. "
            f"Allowed values are: {PORTION_OPTIONS}"
        )


# ============================================================
# MEAL DATABASE
# ============================================================

class MealDatabase:
    def __init__(self):
        self.foods = load_csv(FOODS_PATH)
        self.meals = load_csv(MEALS_PATH)
        self.meal_items = load_csv(MEAL_ITEMS_PATH)

        self.food_lookup = {
            row["food_code"]: row
            for row in self.foods
        }

        self.meal_lookup = {
            row["meal_id"]: row
            for row in self.meals
        }

        self.items_by_meal: dict[str, list[dict]] = defaultdict(list)

        for item in self.meal_items:
            self.items_by_meal[item["meal_id"]].append(item)

        self._validate_relationships()

    def _validate_relationships(self) -> None:
        if not self.foods:
            raise ValueError("foods_100_final.csv is empty.")

        if not self.meals:
            raise ValueError("meals.csv is empty.")

        if not self.meal_items:
            raise ValueError("meal_items.csv is empty.")

        if len(self.food_lookup) != len(self.foods):
            raise ValueError("Duplicate food_code found in foods database.")

        if len(self.meal_lookup) != len(self.meals):
            raise ValueError("Duplicate meal_id found in meals database.")

        for item in self.meal_items:
            meal_id = item["meal_id"]
            food_code = item["food_code"]

            if meal_id not in self.meal_lookup:
                raise ValueError(
                    f"meal_items references unknown meal_id: {meal_id}"
                )

            if food_code not in self.food_lookup:
                raise ValueError(
                    f"meal_items references unknown food_code: {food_code}"
                )

    def compatible_meals(
        self,
        diet: str,
        meal_type: str,
    ) -> list[dict]:
        diet_key_map = {
            "vegan": "vegan_ok",
            "vegetarian": "vegetarian_ok",
            "eggetarian": "eggetarian_ok",
            "non_vegetarian": "nonveg_ok",
            "nonvegetarian": "nonveg_ok",
            "nonveg": "nonveg_ok",
        }

        normalized_diet = str(diet).strip().lower()

        if normalized_diet not in diet_key_map:
            raise ValueError(
                f"Unsupported diet for meal planner: {diet!r}"
            )

        flag_column = diet_key_map[normalized_diet]

        results = [
            row
            for row in self.meals
            if (
                str(row.get("meal_type", "")).strip() == meal_type
                and as_bool(row.get(flag_column))
                and as_bool(row.get("is_active", True))
            )
        ]

        if not results:
            raise ValueError(
                f"No active {meal_type} meals are compatible with "
                f"diet {diet!r}."
            )

        return results

    def scaled_ingredients(
        self,
        meal_id: str,
        portion_multiplier: float,
    ) -> list[dict]:
        output = []

        for item in self.items_by_meal.get(meal_id, []):
            food_code = item["food_code"]
            food = self.food_lookup[food_code]
            quantity_g = as_float(item.get("quantity_g"))

            output.append(
                {
                    "food_code": food_code,
                    "food_name": (
                        item.get("food_name")
                        or food.get("display_name")
                        or food.get("source_food_name")
                        or food_code
                    ),
                    "quantity_g": round(
                        quantity_g * portion_multiplier,
                        1,
                    ),
                    "quantity_basis": item.get(
                        "quantity_basis",
                        "",
                    ),
                }
            )

        return output


# ============================================================
# NUTRITION EXTRACTION
# ============================================================

def meal_nutrition(row: dict) -> dict:
    return {
        "kcal": as_float(row.get("total_kcal")),
        "protein_g": as_float(row.get("total_protein_g")),
        "known_carbohydrate_g": as_float(
            row.get("known_carbohydrate_g")
        ),
        "fat_g": as_float(row.get("total_fat_g")),
        "known_fiber_g": as_float(row.get("known_fiber_g")),
        "carbohydrate_complete": as_bool(
            row.get("carbohydrate_complete")
        ),
        "fiber_complete": as_bool(row.get("fiber_complete")),
    }


def scale_nutrition(
    nutrition: dict,
    multiplier: float,
) -> dict:
    return {
        "kcal": nutrition["kcal"] * multiplier,
        "protein_g": nutrition["protein_g"] * multiplier,
        "known_carbohydrate_g": (
            nutrition["known_carbohydrate_g"] * multiplier
        ),
        "fat_g": nutrition["fat_g"] * multiplier,
        "known_fiber_g": nutrition["known_fiber_g"] * multiplier,
        "carbohydrate_complete": nutrition["carbohydrate_complete"],
        "fiber_complete": nutrition["fiber_complete"],
    }


def sum_nutrition(items: list[dict]) -> dict:
    return {
        "kcal": sum(item["kcal"] for item in items),
        "protein_g": sum(item["protein_g"] for item in items),
        "known_carbohydrate_g": sum(
            item["known_carbohydrate_g"] for item in items
        ),
        "fat_g": sum(item["fat_g"] for item in items),
        "known_fiber_g": sum(item["known_fiber_g"] for item in items),
        "carbohydrate_complete": all(
            item["carbohydrate_complete"] for item in items
        ),
        "fiber_complete": all(item["fiber_complete"] for item in items),
    }


# ============================================================
# SCORING
# ============================================================

def relative_error(actual: float, target: float) -> float:
    if target <= 0:
        return 0.0

    return abs(actual - target) / target


def nutrition_score(
    totals: dict,
    target: dict,
) -> float:
    target_kcal = float(target["target_kcal"])
    protein_target = float(target["protein_target_g"])
    protein_min = float(target["protein_min_g"])
    protein_max = float(target["protein_max_g"])
    carb_target = float(target["carbohydrate_target_g"])
    fat_target = float(target["fat_target_g"])
    fiber_target = float(target["fiber_target_g"])

    score = 0.0

    # Calories and protein are the strongest priorities.
    score += 14.0 * relative_error(totals["kcal"], target_kcal)
    score += 10.0 * relative_error(
        totals["protein_g"],
        protein_target,
    )

    # Extra penalty if protein falls outside the locked range.
    if totals["protein_g"] < protein_min:
        score += 8.0 * relative_error(
            totals["protein_g"],
            protein_min,
        )
    elif totals["protein_g"] > protein_max:
        score += 4.0 * relative_error(
            totals["protein_g"],
            protein_max,
        )

    score += 3.0 * relative_error(totals["fat_g"], fat_target)

    # IFCT does not report carbohydrate/fibre for every food. If the
    # chosen day is complete, use the target normally. If incomplete,
    # treat known values as a lower-bound-style signal and do not punish
    # a low known total as if missing data were true zero.
    if totals["carbohydrate_complete"]:
        activity_type = str(
            target.get("activity_type", "")
        ).strip().lower()

        # Carbohydrate matching matters a little more on endurance days,
        # while calories and protein remain the strongest priorities.
        carb_weight = (
            3.5
            if activity_type in {"running", "cycling", "swimming"}
            else 2.5
        )

        score += carb_weight * relative_error(
            totals["known_carbohydrate_g"],
            carb_target,
        )
    elif totals["known_carbohydrate_g"] > carb_target * 1.10:
        # When IFCT data is incomplete, do not punish a low known total
        # as though missing carbohydrate were truly zero.
        score += 1.2 * relative_error(
            totals["known_carbohydrate_g"],
            carb_target,
        )

    if totals["fiber_complete"]:
        score += 0.8 * relative_error(
            totals["known_fiber_g"],
            fiber_target,
        )

    return score


def variety_penalty(
    meal_ids: list[str],
    previous_day_ids: set[str],
    weekly_usage: Counter,
) -> float:
    penalty = 0.0

    for meal_id in meal_ids:
        # Strongly avoid serving the exact same meal on consecutive days.
        if meal_id in previous_day_ids:
            penalty += 6.0

        used = weekly_usage[meal_id]

        if used >= MAX_PREFERRED_REPEATS_PER_WEEK:
            penalty += 3.0 * (
                used - MAX_PREFERRED_REPEATS_PER_WEEK + 1
            )
        elif used > 0:
            penalty += 0.45 * used

    return penalty


def portion_penalty(
    meal_rows: tuple[dict, ...],
    multipliers: tuple[float, ...],
    target_kcal: float,
) -> float:
    penalty = 0.0

    for row, multiplier, meal_type in zip(
        meal_rows,
        multipliers,
        MEAL_TYPES,
    ):
        meal_kcal = as_float(row.get("total_kcal")) * multiplier
        desired = target_kcal * MEAL_CALORIE_SHARES[meal_type]

        # Softly encourage a reasonable daily calorie distribution.
        penalty += 0.25 * relative_error(meal_kcal, desired)

        # Prefer portions closer to ordinary recipe scale when nutrition
        # quality is otherwise similar.
        penalty += 0.08 * abs(multiplier - 1.0)

        # Portions above 2 servings are allowed up to 2.5, but should be
        # chosen only when they meaningfully improve the full-day plan.
        if multiplier > 2.0:
            penalty += 0.18 * ((multiplier - 2.0) / PORTION_STEP)

    return penalty


# ============================================================
# PORTION SEARCH
# ============================================================

def candidate_multiplier_values(
    target_kcal: float,
    base_kcal: float,
) -> list[float]:
    # The arguments are kept for API compatibility and future heuristics.
    # For the prototype we search the complete practical serving set so
    # every returned multiplier is immediately understandable to users.
    _ = target_kcal, base_kcal
    return list(PORTION_OPTIONS)


def score_base_combination(
    meal_rows: tuple[dict, ...],
    target: dict,
    previous_day_ids: set[str],
    weekly_usage: Counter,
) -> float:
    nutrition = [meal_nutrition(row) for row in meal_rows]
    totals = sum_nutrition(nutrition)

    # Scale all meals together only for rough ranking. Precise per-meal
    # scaling happens in the next search stage.
    if totals["kcal"] <= 0:
        return float("inf")

    rough_factor = clamp(
        float(target["target_kcal"]) / totals["kcal"],
        MIN_PORTION_MULTIPLIER,
        MAX_PORTION_MULTIPLIER,
    )

    rough_scaled = sum_nutrition(
        [
            scale_nutrition(item, rough_factor)
            for item in nutrition
        ]
    )

    meal_ids = [row["meal_id"] for row in meal_rows]

    return (
        nutrition_score(rough_scaled, target)
        + variety_penalty(
            meal_ids,
            previous_day_ids,
            weekly_usage,
        )
    )


def optimize_portions(
    meal_rows: tuple[dict, ...],
    target: dict,
    previous_day_ids: set[str],
    weekly_usage: Counter,
) -> tuple[float, tuple[float, ...], dict]:
    base_nutrition = [meal_nutrition(row) for row in meal_rows]
    base_totals = sum_nutrition(base_nutrition)

    multiplier_values = candidate_multiplier_values(
        float(target["target_kcal"]),
        base_totals["kcal"],
    )

    best_score = float("inf")
    best_multipliers: tuple[float, ...] | None = None
    best_totals: dict | None = None

    meal_ids = [row["meal_id"] for row in meal_rows]
    base_variety_penalty = variety_penalty(
        meal_ids,
        previous_day_ids,
        weekly_usage,
    )

    for multipliers in product(
        multiplier_values,
        repeat=len(MEAL_TYPES),
    ):
        scaled = [
            scale_nutrition(nutrition, multiplier)
            for nutrition, multiplier in zip(
                base_nutrition,
                multipliers,
            )
        ]

        totals = sum_nutrition(scaled)

        score = (
            nutrition_score(totals, target)
            + base_variety_penalty
            + portion_penalty(
                meal_rows,
                multipliers,
                float(target["target_kcal"]),
            )
        )

        if score < best_score:
            best_score = score
            best_multipliers = tuple(float(x) for x in multipliers)
            best_totals = totals

    if best_multipliers is None or best_totals is None:
        raise RuntimeError("Portion optimizer failed to produce a result.")

    return best_score, best_multipliers, best_totals


# ============================================================
# DAILY MEAL SELECTION
# ============================================================

def select_meals_for_day(
    database: MealDatabase,
    diet: str,
    day_target: dict,
    previous_day_ids: set[str],
    weekly_usage: Counter,
) -> tuple[list[MealSelection], dict, float]:
    candidates = {
        meal_type: database.compatible_meals(diet, meal_type)
        for meal_type in MEAL_TYPES
    }

    # If possible, remove yesterday's exact meal from that slot before
    # combination search. It remains a soft-penalty fallback if the diet
    # has only one compatible option.
    for meal_type in MEAL_TYPES:
        filtered = [
            row
            for row in candidates[meal_type]
            if row["meal_id"] not in previous_day_ids
        ]

        if filtered:
            candidates[meal_type] = filtered

    base_ranked: list[tuple[float, tuple[dict, ...]]] = []

    for meal_rows in product(
        candidates["breakfast"],
        candidates["lunch"],
        candidates["evening_snack"],
        candidates["dinner"],
    ):
        score = score_base_combination(
            meal_rows=meal_rows,
            target=day_target,
            previous_day_ids=previous_day_ids,
            weekly_usage=weekly_usage,
        )

        base_ranked.append((score, meal_rows))

    if not base_ranked:
        raise ValueError("No compatible four-meal combination was found.")

    base_ranked.sort(key=lambda item: item[0])

    best_score = float("inf")
    best_rows: tuple[dict, ...] | None = None
    best_multipliers: tuple[float, ...] | None = None
    best_totals: dict | None = None

    for _, meal_rows in base_ranked[:TOP_BASE_COMBINATIONS]:
        score, multipliers, totals = optimize_portions(
            meal_rows=meal_rows,
            target=day_target,
            previous_day_ids=previous_day_ids,
            weekly_usage=weekly_usage,
        )

        if score < best_score:
            best_score = score
            best_rows = meal_rows
            best_multipliers = multipliers
            best_totals = totals

    if (
        best_rows is None
        or best_multipliers is None
        or best_totals is None
    ):
        raise RuntimeError("Meal selection failed to produce a result.")

    selections: list[MealSelection] = []

    for row, multiplier in zip(best_rows, best_multipliers):
        validate_portion_multiplier(multiplier)
        nutrition = scale_nutrition(meal_nutrition(row), multiplier)

        selections.append(
            MealSelection(
                meal_id=row["meal_id"],
                meal_name=str(row.get("meal_name", row["meal_id"])),
                meal_type=str(row.get("meal_type", "")),
                portion_multiplier=round(multiplier, 2),
                portion_label=format_portion_label(multiplier),
                kcal=round(nutrition["kcal"], 1),
                protein_g=round(nutrition["protein_g"], 1),
                known_carbohydrate_g=round(
                    nutrition["known_carbohydrate_g"],
                    1,
                ),
                fat_g=round(nutrition["fat_g"], 1),
                known_fiber_g=round(nutrition["known_fiber_g"], 1),
                carbohydrate_complete=nutrition[
                    "carbohydrate_complete"
                ],
                fiber_complete=nutrition["fiber_complete"],
                prep_note=str(row.get("prep_note", "")),
                ingredients=database.scaled_ingredients(
                    row["meal_id"],
                    multiplier,
                ),
            )
        )

    rounded_totals = {
        "kcal": round(best_totals["kcal"], 1),
        "protein_g": round(best_totals["protein_g"], 1),
        "known_carbohydrate_g": round(
            best_totals["known_carbohydrate_g"],
            1,
        ),
        "fat_g": round(best_totals["fat_g"], 1),
        "known_fiber_g": round(best_totals["known_fiber_g"], 1),
        "carbohydrate_complete": best_totals[
            "carbohydrate_complete"
        ],
        "fiber_complete": best_totals["fiber_complete"],
    }

    return selections, rounded_totals, best_score


# ============================================================
# WEEKLY MEAL PLANNER
# ============================================================

def generate_weekly_meal_plan(
    combined_week: dict,
) -> WeeklyMealPlan:
    nutrition_plan = combined_week.get("nutrition_plan")

    if not isinstance(nutrition_plan, dict):
        raise ValueError(
            "combined_week must contain nutrition_plan from "
            "weekly_targets.generate_combined_week()."
        )

    days = nutrition_plan.get("days")

    if not isinstance(days, list) or len(days) != 7:
        raise ValueError("nutrition_plan must contain exactly 7 days.")

    diet = str(nutrition_plan.get("diet", "")).strip()
    week_number = int(nutrition_plan.get("week_number", 0))

    database = MealDatabase()

    output_days: list[MealPlanDay] = []
    weekly_usage: Counter = Counter()
    previous_day_ids: set[str] = set()

    for day in days:
        target = day.get("nutrition")

        if not isinstance(target, dict):
            raise ValueError(
                f"Nutrition target missing for day: {day.get('day')}"
            )

        meals, totals, score = select_meals_for_day(
            database=database,
            diet=diet,
            day_target=target,
            previous_day_ids=previous_day_ids,
            weekly_usage=weekly_usage,
        )

        selected_ids = {meal.meal_id for meal in meals}

        for meal_id in selected_ids:
            weekly_usage[meal_id] += 1

        previous_day_ids = selected_ids

        target_difference = {
            "kcal": round(
                totals["kcal"] - float(target["target_kcal"]),
                1,
            ),
            "protein_g": round(
                totals["protein_g"]
                - float(target["protein_target_g"]),
                1,
            ),
            "known_carbohydrate_g": round(
                totals["known_carbohydrate_g"]
                - float(target["carbohydrate_target_g"]),
                1,
            ),
            "fat_g": round(
                totals["fat_g"] - float(target["fat_target_g"]),
                1,
            ),
            "known_fiber_g": round(
                totals["known_fiber_g"]
                - float(target["fiber_target_g"]),
                1,
            ),
        }

        output_days.append(
            MealPlanDay(
                day=str(day.get("day", "")),
                day_number=int(day.get("day_number", 0)),
                workout_title=str(day.get("workout_title", "")),
                activity_type=str(day.get("activity_type", "")),
                target=target,
                meals=meals,
                totals=totals,
                target_difference=target_difference,
                carbohydrate_complete=totals[
                    "carbohydrate_complete"
                ],
                fiber_complete=totals["fiber_complete"],
                score=round(score, 4),
            )
        )

    return WeeklyMealPlan(
        week_number=week_number,
        diet=diet,
        days=output_days,
    )


# ============================================================
# FULL PIPELINE WRAPPER
# ============================================================

def generate_full_fitness_week(
    profile: UserProfile,
    preferences: list[str],
    week_number: int,
    previous_progress=None,
    initial_strength_levels: Optional[dict[str, int]] = None,
    accessibility_id: str = "none",
    accessibility_resources: Optional[list[str]] = None,
) -> dict:
    combined = generate_combined_week(
        profile=profile,
        preferences=preferences,
        week_number=week_number,
        previous_progress=previous_progress,
        initial_strength_levels=initial_strength_levels,
        accessibility_id=accessibility_id,
        accessibility_resources=accessibility_resources,
    )

    meal_plan = generate_weekly_meal_plan(combined)

    return {
        **combined,
        "meal_plan": meal_plan.to_dict(),
    }


# ============================================================
# TERMINAL SUMMARY
# ============================================================

def print_meal_plan_summary(plan: WeeklyMealPlan | dict) -> None:
    if isinstance(plan, WeeklyMealPlan):
        data = plan.to_dict()
    else:
        data = plan

    print()
    print("=" * 112)
    print(
        f"WEEK {data['week_number']} - PERSONALIZED 7-DAY MEAL PLAN"
    )
    print("=" * 112)
    print(f"Diet: {data['diet']}")
    print(f"Planner version: {PLANNER_VERSION}")

    for day in data["days"]:
        target = day["target"]
        totals = day["totals"]

        print()
        print("-" * 112)
        print(
            f"{day['day'].upper()} | {day['workout_title']}"
        )
        print(
            f"Target: {target['target_kcal']:.1f} kcal | "
            f"Protein {target['protein_target_g']:.1f} g | "
            f"Carbs {target['carbohydrate_target_g']:.1f} g | "
            f"Fat {target['fat_target_g']:.1f} g"
        )

        for meal in day["meals"]:
            print(
                f"  {meal['meal_type']:16} "
                f"{meal['meal_name'][:35]:35} "
                f"{meal['portion_label']:<14} "
                f"{meal['kcal']:>7.1f} kcal | "
                f"P {meal['protein_g']:>5.1f} g"
            )

        print(
            f"  TOTAL            "
            f"{'':35} "
            f"     {totals['kcal']:>7.1f} kcal | "
            f"P {totals['protein_g']:>5.1f} g | "
            f"C {totals['known_carbohydrate_g']:>6.1f} g | "
            f"F {totals['fat_g']:>5.1f} g"
        )

        print(
            f"  Difference: kcal {day['target_difference']['kcal']:+.1f} | "
            f"protein {day['target_difference']['protein_g']:+.1f} g | "
            f"fat {day['target_difference']['fat_g']:+.1f} g"
        )

        if not day["carbohydrate_complete"]:
            print(
                "  NOTE: carbohydrate total is based on known IFCT values; "
                "one or more selected meals contain unreported carbohydrate data."
            )

        if not day["fiber_complete"]:
            print(
                "  NOTE: fibre total is based on known IFCT values; "
                "one or more selected meals contain unreported fibre data."
            )

    print()
    print("=" * 112)
    print("7-DAY MEAL PLANNER WORKING")
    print("Portions: user-friendly 0.25-serving steps only")
    print("=" * 112)


# ============================================================
# DEMO
# ============================================================

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

    result = generate_full_fitness_week(
        profile=profile,
        preferences=["running", "cycling"],
        week_number=1,
        accessibility_id="none",
    )

    print_meal_plan_summary(result["meal_plan"])
