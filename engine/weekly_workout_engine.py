from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional
import csv
import json


# ============================================================
# PATHS
# ============================================================

DATA_DIR = Path("data/workouts")

TEMPLATES_PATH = DATA_DIR / "workout_templates.csv"
VARIATIONS_PATH = DATA_DIR / "exercise_variations.csv"
STRENGTH_ITEMS_PATH = DATA_DIR / "strength_session_items.csv"
SCHEDULE_RULES_PATH = DATA_DIR / "lifestyle_schedule_rules.csv"
PROGRESSION_RULES_PATH = DATA_DIR / "progression_rules.csv"

ACCESSIBILITY_PROFILES_PATH = DATA_DIR / "accessibility_profiles.csv"
ACCESSIBILITY_RESOURCES_PATH = DATA_DIR / "accessibility_resources.csv"
ACCESSIBILITY_TEMPLATES_PATH = DATA_DIR / "accessibility_workout_templates.csv"
ACCESSIBILITY_GUIDANCE_PATH = DATA_DIR / "accessibility_exercise_guidance.csv"
ACCESSIBILITY_PROGRESSION_PATH = DATA_DIR / "accessibility_progression_rules.csv"


# ============================================================
# GLOBAL SETTINGS
# ============================================================

PROGRESSION_THRESHOLD = 80.0

DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

VALID_LIFESTYLES = {
    "sedentary",
    "light",
    "moderate",
    "very_active",
}

VALID_PREFERENCES = {
    "walking",
    "running",
    "cycling",
    "swimming",
}

VALID_ACCESSIBILITY_IDS = {
    "none",
    "blind_low_vision",
    "deaf_hard_of_hearing",
    "other",
}

VALID_ACCESSIBILITY_RESOURCES = {
    "safe_indoor_space",
    "stable_support",
    "guide",
    "stationary_bike",
    "accessible_pool_support",
}

STRENGTH_FAMILIES = [
    "squat",
    "lunge",
    "pushup",
    "bicep_curl",
    "supported_row",
]

# Generic progression key used when a blind/low-vision user's
# preferred route/equipment-based activity is replaced by the
# home accessible cardio progression.
ACCESSIBLE_CARDIO_KEY = "accessible_cardio"


# ============================================================
# WEEKLY SCHEDULE PATTERNS
# ============================================================
#
# Strength is always included twice.
# The remaining active slots are filled from user preferences.
# ============================================================

SCHEDULE_PATTERNS = {
    3: {
        0: "strength",
        2: "cardio",
        4: "strength",
    },
    4: {
        0: "strength",
        1: "cardio",
        3: "strength",
        5: "cardio",
    },
    5: {
        0: "strength",
        1: "cardio",
        2: "cardio",
        4: "strength",
        5: "cardio",
    },
    6: {
        0: "strength",
        1: "cardio",
        2: "cardio",
        3: "strength",
        4: "cardio",
        5: "cardio",
    },
}


# ============================================================
# PROGRESS STATE
# ============================================================
#
# activity_rule_week:
#   running / cycling / walking / swimming / strength and,
#   when needed, accessible_cardio.
#
# exercise_rule_week:
#   each strength exercise progresses independently.
#
# strength_variation_levels:
#   current variation level for each strength exercise.
# ============================================================

@dataclass
class ProgressState:
    overall_completion_pct: Optional[float] = None

    activity_completion_pct: dict[str, float] = field(
        default_factory=dict
    )

    exercise_completion_pct: dict[str, float] = field(
        default_factory=dict
    )

    activity_rule_week: dict[str, int] = field(
        default_factory=dict
    )

    exercise_rule_week: dict[str, int] = field(
        default_factory=dict
    )

    strength_variation_levels: dict[str, int] = field(
        default_factory=dict
    )

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(
        cls,
        data: Optional[dict],
    ) -> "ProgressState":
        if not data:
            return cls()

        return cls(
            overall_completion_pct=data.get(
                "overall_completion_pct"
            ),
            activity_completion_pct=data.get(
                "activity_completion_pct",
                {},
            ),
            exercise_completion_pct=data.get(
                "exercise_completion_pct",
                {},
            ),
            activity_rule_week=data.get(
                "activity_rule_week",
                {},
            ),
            exercise_rule_week=data.get(
                "exercise_rule_week",
                {},
            ),
            strength_variation_levels=data.get(
                "strength_variation_levels",
                {},
            ),
        )


# ============================================================
# CSV HELPERS
# ============================================================

def load_csv(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing workout database file: {path}"
        )

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        return list(csv.DictReader(file))


def number_or_none(value):
    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return float(value)


def int_or_none(value):
    value = number_or_none(value)

    if value is None:
        return None

    return int(value)


def csv_bool(value) -> bool:
    return str(value).strip().lower() in {
        "true",
        "1",
        "yes",
    }


# ============================================================
# STATIC WORKOUT DATABASE
# ============================================================

class WorkoutDatabase:
    def __init__(self):
        # Standard workout data.
        self.templates = load_csv(TEMPLATES_PATH)
        self.variations = load_csv(VARIATIONS_PATH)
        self.strength_items = load_csv(STRENGTH_ITEMS_PATH)
        self.schedule_rules = load_csv(SCHEDULE_RULES_PATH)
        self.progression_rules = load_csv(PROGRESSION_RULES_PATH)

        # Accessibility data.
        self.accessibility_profiles = load_csv(
            ACCESSIBILITY_PROFILES_PATH
        )
        self.accessibility_resources = load_csv(
            ACCESSIBILITY_RESOURCES_PATH
        )
        self.accessibility_templates = load_csv(
            ACCESSIBILITY_TEMPLATES_PATH
        )
        self.accessibility_guidance = load_csv(
            ACCESSIBILITY_GUIDANCE_PATH
        )
        self.accessibility_progression = load_csv(
            ACCESSIBILITY_PROGRESSION_PATH
        )

        self.template_lookup = {
            row["template_id"]: row
            for row in self.templates
        }

        self.variation_lookup = {
            (
                row["exercise_family"],
                int(row["difficulty_level"]),
            ): row
            for row in self.variations
        }

        self.accessibility_profile_lookup = {
            row["accessibility_id"]: row
            for row in self.accessibility_profiles
        }

        self.accessibility_template_lookup = {
            row["template_id"]: row
            for row in self.accessibility_templates
        }

        self.accessibility_guidance_lookup = {
            (
                row["variation_id"],
                row["accessibility_id"],
            ): row
            for row in self.accessibility_guidance
        }

    def get_schedule_rule(
        self,
        lifestyle: str,
        week_number: int,
    ) -> dict:
        for row in self.schedule_rules:
            if (
                row["lifestyle"] == lifestyle
                and int(row["week_number"]) == week_number
            ):
                return row

        raise ValueError(
            "Schedule rule not found for "
            f"{lifestyle}, week {week_number}"
        )

    def get_progression_rule(
        self,
        lifestyle: str,
        rule_week: int,
        activity_id: str,
        variant: str,
    ) -> dict:
        for row in self.progression_rules:
            if (
                row["lifestyle"] == lifestyle
                and int(row["week_number"]) == rule_week
                and row["activity_id"] == activity_id
                and row["session_variant"] == variant
            ):
                return row

        raise ValueError(
            "Progression rule not found: "
            f"{lifestyle}, week={rule_week}, "
            f"activity={activity_id}, variant={variant}"
        )

    def get_accessibility_profile(
        self,
        accessibility_id: str,
    ) -> dict:
        try:
            return self.accessibility_profile_lookup[
                accessibility_id
            ]
        except KeyError as exc:
            raise ValueError(
                f"Unknown accessibility_id: {accessibility_id}"
            ) from exc

    def get_accessibility_template(
        self,
        template_id: str,
    ) -> dict:
        try:
            return self.accessibility_template_lookup[
                template_id
            ]
        except KeyError as exc:
            raise ValueError(
                f"Unknown accessibility template: {template_id}"
            ) from exc

    def get_accessibility_guidance(
        self,
        variation_id: str,
        accessibility_id: str,
    ) -> Optional[dict]:
        return self.accessibility_guidance_lookup.get(
            (
                variation_id,
                accessibility_id,
            )
        )

    def get_accessibility_progression_rule(
        self,
        accessibility_id: str,
        lifestyle: str,
        rule_week: int,
    ) -> dict:
        for row in self.accessibility_progression:
            if (
                row["accessibility_id"] == accessibility_id
                and row["lifestyle"] == lifestyle
                and int(row["week_number"]) == rule_week
            ):
                return row

        raise ValueError(
            "Accessibility progression rule not found: "
            f"accessibility={accessibility_id}, "
            f"lifestyle={lifestyle}, week={rule_week}"
        )


# ============================================================
# INPUT VALIDATION
# ============================================================

def validate_request(
    lifestyle: str,
    preferences: list[str],
    week_number: int,
    accessibility_id: str,
    accessibility_resources: list[str],
) -> tuple[list[str], list[str]]:
    if lifestyle not in VALID_LIFESTYLES:
        raise ValueError(
            f"Invalid lifestyle: {lifestyle}"
        )

    if not 1 <= week_number <= 8:
        raise ValueError(
            "week_number must be between 1 and 8."
        )

    if not preferences:
        raise ValueError(
            "User must select at least one preferred activity."
        )

    invalid_preferences = (
        set(preferences) - VALID_PREFERENCES
    )

    if invalid_preferences:
        raise ValueError(
            "Invalid preferences: "
            f"{sorted(invalid_preferences)}"
        )

    if accessibility_id not in VALID_ACCESSIBILITY_IDS:
        raise ValueError(
            f"Invalid accessibility_id: {accessibility_id}"
        )

    invalid_resources = (
        set(accessibility_resources)
        - VALID_ACCESSIBILITY_RESOURCES
    )

    if invalid_resources:
        raise ValueError(
            "Invalid accessibility resources: "
            f"{sorted(invalid_resources)}"
        )

    preferences = list(dict.fromkeys(preferences))
    accessibility_resources = list(
        dict.fromkeys(accessibility_resources)
    )

    # In the current prototype, blind/low-vision strength work
    # uses a wall/chair/support as an orientation reference.
    if (
        accessibility_id == "blind_low_vision"
        and "stable_support" not in accessibility_resources
    ):
        raise ValueError(
            "blind_low_vision currently requires the "
            "'stable_support' resource because mandatory "
            "strength sessions use a stable chair, wall or "
            "support as an orientation reference."
        )

    return preferences, accessibility_resources


# ============================================================
# ACCESSIBILITY PRESENTATION SETTINGS
# ============================================================

def build_accessibility_presentation(
    database: WorkoutDatabase,
    accessibility_id: str,
) -> dict:
    profile = database.get_accessibility_profile(
        accessibility_id
    )

    return {
        "accessibility_id": accessibility_id,
        "display_name": profile["display_name"],
        "automatic_workout_adaptation": csv_bool(
            profile["automatic_workout_adaptation"]
        ),
        "audio_guidance": csv_bool(
            profile["audio_guidance"]
        ),
        "visual_captions": csv_bool(
            profile["visual_captions"]
        ),
        "haptic_cues": csv_bool(
            profile["haptic_cues"]
        ),
        "notes": profile["notes"],
    }


# ============================================================
# FRONTEND RESULTS -> WEEKLY SUMMARY
# ============================================================
#
# Standard log:
# {
#   "activity_id": "running",
#   "completion_pct": 85
# }
#
# Accessibility fallback log can use:
# {
#   "activity_id": "walking",
#   "progression_key": "accessible_cardio",
#   "completion_pct": 85
# }
#
# The progression_key controls which rule progresses.
# ============================================================

def summarize_week_completion(
    session_logs: list[dict],
) -> ProgressState:
    if not session_logs:
        return ProgressState()

    all_completion = []
    by_activity = defaultdict(list)
    by_exercise = defaultdict(list)

    for log in session_logs:
        progression_key = log.get(
            "progression_key",
            log.get("activity_id"),
        )

        if not progression_key:
            raise ValueError(
                "Each session log must include activity_id "
                "or progression_key."
            )

        completion = max(
            0.0,
            min(
                float(log["completion_pct"]),
                100.0,
            ),
        )

        all_completion.append(completion)
        by_activity[progression_key].append(completion)

        exercise_data = log.get(
            "exercise_completion_pct",
            {},
        )

        for family, pct in exercise_data.items():
            if family not in STRENGTH_FAMILIES:
                continue

            pct = max(
                0.0,
                min(float(pct), 100.0),
            )

            by_exercise[family].append(pct)

    overall = sum(all_completion) / len(all_completion)

    activity_summary = {
        activity: round(
            sum(values) / len(values),
            1,
        )
        for activity, values in by_activity.items()
    }

    exercise_summary = {
        family: round(
            sum(values) / len(values),
            1,
        )
        for family, values in by_exercise.items()
    }

    return ProgressState(
        overall_completion_pct=round(overall, 1),
        activity_completion_pct=activity_summary,
        exercise_completion_pct=exercise_summary,
    )


def summarize_planned_week(
    obligations: list[dict],
    attempts: list[dict],
) -> ProgressState:
    """Summarizes a week against its issued plan.

    ``obligations`` are the non-rest scheduled workouts issued for the week
    (each carries a stable identity: scheduled_workout_id or local_date plus
    activity/progression key). ``attempts`` are actual recordings.

    Rules:
      - unattempted obligations are included as zero (no averaging of only the
        work that happened to be logged);
      - repeated attempts roll up to one scheduled workout and are capped at
        100%, so they cannot inflate progress beyond the prescription;
      - overall completion = completed obligations / planned obligations.
    """
    total = len(obligations)
    if total == 0:
        return ProgressState(overall_completion_pct=None)

    def obligation_key(ob: dict) -> str:
        identity = ob.get("scheduled_workout_id") or ob.get("local_date")
        if identity:
            return str(identity)
        return ":".join(
            [
                str(ob.get("day") or ""),
                str(ob.get("activity_id") or ob.get("progression_key") or ""),
            ]
        )

    best_by_obligation: dict[str, float] = {}
    attempts_by_key: dict[str, list[dict]] = {}
    for attempt in attempts:
        identity = (
            attempt.get("scheduled_workout_id")
            or attempt.get("local_date")
        )
        if not identity:
            continue
        key = str(identity)
        pct = max(
            0.0,
            min(float(attempt.get("completion_pct") or 0.0), 100.0),
        )
        best_by_obligation[key] = max(
            best_by_obligation.get(key, 0.0),
            pct,
        )
        attempts_by_key.setdefault(key, []).append(attempt)

    obligation_keys = [obligation_key(ob) for ob in obligations]
    # Cap per-obligation completion at 100 and average only planned work.
    overall_total = sum(
        min(best_by_obligation.get(key, 0.0), 100.0)
        for key in obligation_keys
    )

    activity_aggregate: dict[str, list[float]] = defaultdict(list)
    for obligation in obligations:
        key = obligation_key(obligation)
        progression_key = str(
            obligation.get("progression_key")
            or obligation.get("activity_id")
            or "strength"
        )
        activity_aggregate[progression_key].append(
            min(best_by_obligation.get(key, 0.0), 100.0)
        )

    exercise_aggregate: dict[str, list[float]] = defaultdict(list)
    # Exercise families appear inside strength obligations. A family is
    # planned only when its obligation includes exercise data.
    for obligation in obligations:
        obligation_identity = obligation_key(obligation)
        obligation_attempts = attempts_by_key.get(obligation_identity, [])
        family_values: dict[str, list[float]] = defaultdict(list)
        for attempt in obligation_attempts:
            for family, pct in (attempt.get("exercise_completion_pct") or {}).items():
                if family not in STRENGTH_FAMILIES:
                    continue
                family_values[family].append(max(0.0, min(float(pct), 100.0)))
        exercises = obligation.get("exercises") or []
        for ex in exercises:
            family = ex.get("family") or ex.get("exercise_family")
            if family not in STRENGTH_FAMILIES:
                continue
            exercise_aggregate[family].append(
                min(max(family_values.get(family, [0.0])), 100.0)
            )

    state = ProgressState(
        overall_completion_pct=round(overall_total / total, 1),
        activity_completion_pct={
            activity: round(sum(vals) / len(vals), 1)
            for activity, vals in activity_aggregate.items()
        },
        exercise_completion_pct={
            family: round(sum(vals) / len(vals), 1)
            for family, vals in exercise_aggregate.items()
            if vals
        },
    )
    return state


# ============================================================
# ACTIVITY PROGRESSION GATE
# ============================================================
#
# BOTH must pass:
#   overall week >= 80%
#   progression key >= 80%
#
# Missing completion data means HOLD.
# ============================================================

def activity_can_progress(
    previous_state: ProgressState,
    progression_key: str,
) -> bool:
    overall = previous_state.overall_completion_pct

    if overall is None:
        return False

    if overall < PROGRESSION_THRESHOLD:
        return False

    activity_pct = (
        previous_state
        .activity_completion_pct
        .get(progression_key)
    )

    if activity_pct is None:
        return False

    if activity_pct < PROGRESSION_THRESHOLD:
        return False

    return True


# ============================================================
# ACTIVITY RULE WEEK
# ============================================================

def determine_rule_week(
    progression_key: str,
    calendar_week: int,
    previous_state: ProgressState,
) -> int:
    if calendar_week == 1:
        return 1

    previous_rule_week = int(
        previous_state
        .activity_rule_week
        .get(
            progression_key,
            calendar_week - 1,
        )
    )

    previous_rule_week = max(
        1,
        min(previous_rule_week, 8),
    )

    # Week 4 is a consolidation week.
    if calendar_week == 4:
        if previous_rule_week >= 3:
            return 4
        return previous_rule_week

    if activity_can_progress(
        previous_state,
        progression_key,
    ):
        return min(
            previous_rule_week + 1,
            calendar_week,
            8,
        )

    return previous_rule_week


# ============================================================
# INDIVIDUAL STRENGTH EXERCISE RULE WEEK
# ============================================================

def determine_strength_exercise_rule_week(
    family: str,
    calendar_week: int,
    previous_state: ProgressState,
) -> int:
    if family not in STRENGTH_FAMILIES:
        raise ValueError(
            "Unknown strength exercise family: "
            f"{family}"
        )

    if calendar_week == 1:
        return 1

    previous_rule_week = int(
        previous_state
        .exercise_rule_week
        .get(
            family,
            previous_state
            .activity_rule_week
            .get(
                "strength",
                calendar_week - 1,
            ),
        )
    )

    previous_rule_week = max(
        1,
        min(previous_rule_week, 8),
    )

    if calendar_week == 4:
        if previous_rule_week >= 3:
            return 4
        return previous_rule_week

    overall = previous_state.overall_completion_pct

    if overall is None or overall < PROGRESSION_THRESHOLD:
        return previous_rule_week

    strength_pct = (
        previous_state
        .activity_completion_pct
        .get("strength")
    )

    if (
        strength_pct is None
        or strength_pct < PROGRESSION_THRESHOLD
    ):
        return previous_rule_week

    exercise_pct = (
        previous_state
        .exercise_completion_pct
        .get(family)
    )

    if (
        exercise_pct is None
        or exercise_pct < PROGRESSION_THRESHOLD
    ):
        return previous_rule_week

    return min(
        previous_rule_week + 1,
        calendar_week,
        8,
    )


# ============================================================
# STRENGTH VARIATION LEVEL
# ============================================================

def determine_strength_variation_level(
    family: str,
    recommended_level: int,
    calendar_week: int,
    previous_state: ProgressState,
    initial_strength_levels: dict[str, int],
) -> int:
    recommended_level = max(
        1,
        min(int(recommended_level), 3),
    )

    if calendar_week == 1:
        initial_level = int(
            initial_strength_levels.get(
                family,
                1,
            )
        )

        return max(
            1,
            min(
                initial_level,
                recommended_level,
                3,
            ),
        )

    previous_level = int(
        previous_state
        .strength_variation_levels
        .get(
            family,
            1,
        )
    )

    previous_level = max(
        1,
        min(previous_level, 3),
    )

    if calendar_week == 4:
        return min(
            previous_level,
            recommended_level,
        )

    overall = previous_state.overall_completion_pct

    if overall is None or overall < PROGRESSION_THRESHOLD:
        return previous_level

    strength_pct = (
        previous_state
        .activity_completion_pct
        .get("strength")
    )

    if (
        strength_pct is None
        or strength_pct < PROGRESSION_THRESHOLD
    ):
        return previous_level

    exercise_pct = (
        previous_state
        .exercise_completion_pct
        .get(family)
    )

    if (
        exercise_pct is None
        or exercise_pct < PROGRESSION_THRESHOLD
    ):
        return previous_level

    return min(
        previous_level + 1,
        recommended_level,
        3,
    )


def strength_experience_initial_level(
    strength_experience: Optional[str],
) -> dict[str, int]:
    """Maps the quiz experience answer to starting variation levels."""
    base = {
        "new": 1,
        "some_experience": 2,
        "regularly_train": 3,
    }.get(strength_experience or "", 1)
    return {family: base for family in STRENGTH_FAMILIES}


def constrain_variation_level_to_equipment(
    database: WorkoutDatabase,
    family: str,
    requested_level: int,
    strength_equipment: Optional[list[str]],
) -> int:
    """Lowers a variation level until it matches the user's declared
    equipment. Furniture/support variations (chair, wall, stable surface) are
    treated as environmental, not equipment purchases; resistance variations
    require dumbbells, household weights, bands, or an explicit other choice.
    """
    declared = {
        str(item).strip().lower()
        for item in (strength_equipment or [])
    }
    for level in range(max(1, requested_level), 0, -1):
        candidates = [
            row
            for row in database.variations
            if row["exercise_family"] == family
            and int(row["difficulty_level"]) == level
        ]
        for variation in candidates:
            required = (variation.get("equipment") or "").lower()
            if "none" in required or required in {"", "bodyweight"}:
                return level
            if any(
                token in required
                for token in (
                    "chair",
                    "wall",
                    "stable support",
                    "bench",
                    "table",
                )
            ):
                return level
            if any(
                token in required
                for token in (
                    "dumbbell",
                    "water bottle",
                    "backpack",
                    "household",
                    "resistance",
                    "band",
                )
            ):
                if declared and declared != {"no_equipment"}:
                    return level
    # No eligible variation exists for the declared equipment. Keep level 1
    # only when it is genuinely bodyweight/environmental; otherwise fail with
    # an explicit unsupported result instead of silently claiming adaptation.
    level_one = [
        row
        for row in database.variations
        if row["exercise_family"] == family
        and int(row["difficulty_level"]) == 1
    ]
    for variation in level_one:
        required = (variation.get("equipment") or "").lower()
        if "none" in required or any(
            token in required
            for token in ("chair", "wall", "stable support", "bench", "table")
        ):
            return 1
    raise ValueError(
        f"No exercise variation for {family} is eligible with the declared "
        "equipment. Add dumbbells or household weights to your profile."
    )


# ============================================================
# STANDARD CARDIO VARIANT SELECTION
# ============================================================

def choose_cardio_variant(
    activity: str,
    occurrence_index: int,
    total_occurrences: int,
    rule_week: int,
    database: WorkoutDatabase,
    lifestyle: str,
) -> str:
    if total_occurrences > 1:
        if occurrence_index % 2 == 0:
            return "primary"
        return "secondary"

    primary = database.get_progression_rule(
        lifestyle,
        rule_week,
        activity,
        "primary",
    )

    secondary = database.get_progression_rule(
        lifestyle,
        rule_week,
        activity,
        "secondary",
    )

    if (
        primary["template_id"]
        != secondary["template_id"]
        and rule_week % 2 == 0
    ):
        return "secondary"

    return "primary"


# ============================================================
# BUILD STANDARD CARDIO SESSION
# ============================================================

def build_standard_cardio_session(
    database: WorkoutDatabase,
    lifestyle: str,
    calendar_week: int,
    activity: str,
    variant: str,
    rule_week: int,
    total_activity_occurrences: int = 1,
) -> dict:
    rule = database.get_progression_rule(
        lifestyle,
        rule_week,
        activity,
        variant,
    )

    template = database.template_lookup[
        rule["template_id"]
    ]

    distance_km = number_or_none(
        rule["distance_km"]
    )
    distance_m = int_or_none(
        rule["distance_m"]
    )
    duration_min = int_or_none(
        rule["duration_min"]
    )
    interval_count = int_or_none(
        rule["interval_count"]
    )
    work_interval_sec = int_or_none(
        rule["work_interval_sec"]
    )
    recovery_interval_sec = int_or_none(
        rule["recovery_interval_sec"]
    )

    # Secondary sessions are shortened only when the same
    # activity occurs more than once in the week.
    if (
        variant == "secondary"
        and total_activity_occurrences > 1
    ):
        factor = 0.85

        if distance_km is not None:
            distance_km = round(
                distance_km * factor,
                1,
            )

        if distance_m is not None:
            distance_m = (
                round(
                    distance_m * factor / 25
                )
                * 25
            )

        if duration_min is not None:
            duration_min = round(
                duration_min * factor
            )

    return {
        "activity_id": activity,
        "requested_activity_id": activity,
        "progression_key": activity,
        "activity_name": activity.replace(
            "_",
            " ",
        ).title(),
        "session_type": template["session_type"],
        "template_id": template["template_id"],
        "title": template["title"],
        "calendar_week": calendar_week,
        "rule_week": rule_week,
        "session_variant": variant,
        "distance_km": distance_km,
        "distance_m": distance_m,
        "duration_min": duration_min,
        "interval_count": interval_count,
        "work_interval_sec": work_interval_sec,
        "recovery_interval_sec": recovery_interval_sec,
        "intensity": rule["intensity"],
        "warmup": template["warmup_description"],
        "main_workout": template["main_description"],
        "cooldown": template["cooldown_description"],
        "safety_note": None,
        "progression_note": rule["progression_note"],
        "accessibility_adapted": False,
        "completion_threshold_pct": PROGRESSION_THRESHOLD,
    }


# ============================================================
# ACCESSIBLE CARDIO RESOLUTION
# ============================================================
#
# Blind/low-vision user preference is respected when the
# required accessible resource exists.
#
# walking + guide              -> guided walk
# running + guide              -> guided run
# cycling + stationary bike    -> stationary cycling
# swimming + pool support      -> supported swim
#
# Otherwise, if safe_indoor_space exists, use the generic
# home accessible cardio progression.
#
# If no supported option exists, return None and the day is
# changed to a recovery/rest slot with an explicit reason.
# ============================================================

def resolve_blind_cardio_mode(
    requested_activity: str,
    resources: set[str],
) -> Optional[str]:
    if (
        requested_activity == "walking"
        and "guide" in resources
    ):
        return "BLV_GUIDED_WALK"

    if (
        requested_activity == "running"
        and "guide" in resources
    ):
        return "BLV_GUIDED_RUN"

    if (
        requested_activity == "cycling"
        and "stationary_bike" in resources
    ):
        return "BLV_STATIONARY_CYCLE"

    if (
        requested_activity == "swimming"
        and "accessible_pool_support" in resources
    ):
        return "BLV_GUIDED_SWIM"

    if "safe_indoor_space" in resources:
        return "HOME_ACCESSIBLE_CARDIO"

    return None


# ============================================================
# BUILD BLIND/LOW-VISION SUPPORTED PREFERENCE SESSION
# ============================================================
#
# Uses the standard activity progression numbers while
# replacing delivery/environment with the accessibility-safe
# template.
# ============================================================

def build_blind_supported_preference_session(
    database: WorkoutDatabase,
    lifestyle: str,
    calendar_week: int,
    requested_activity: str,
    variant: str,
    rule_week: int,
    accessible_template_id: str,
    total_activity_occurrences: int,
) -> dict:
    standard_rule = database.get_progression_rule(
        lifestyle,
        rule_week,
        requested_activity,
        variant,
    )

    accessibility_template = (
        database.get_accessibility_template(
            accessible_template_id
        )
    )

    standard_template = database.template_lookup[
        standard_rule["template_id"]
    ]

    distance_km = number_or_none(
        standard_rule["distance_km"]
    )
    distance_m = int_or_none(
        standard_rule["distance_m"]
    )
    duration_min = int_or_none(
        standard_rule["duration_min"]
    )
    interval_count = int_or_none(
        standard_rule["interval_count"]
    )
    work_interval_sec = int_or_none(
        standard_rule["work_interval_sec"]
    )
    recovery_interval_sec = int_or_none(
        standard_rule["recovery_interval_sec"]
    )

    # Respect accessibility template metric limits.
    if not csv_bool(accessibility_template["use_distance"]):
        distance_km = None
        distance_m = None

    if not csv_bool(accessibility_template["use_duration"]):
        duration_min = None

    # Keep the same secondary-session shortening behavior.
    if (
        variant == "secondary"
        and total_activity_occurrences > 1
    ):
        factor = 0.85

        if distance_km is not None:
            distance_km = round(
                distance_km * factor,
                1,
            )

        if distance_m is not None:
            distance_m = (
                round(
                    distance_m * factor / 25
                )
                * 25
            )

        if duration_min is not None:
            duration_min = round(
                duration_min * factor
            )

    standard_session_type = standard_template[
        "session_type"
    ]

    title = accessibility_template["title"]

    # Preserve useful session-style information such as
    # run-walk / intervals / tempo without implying that the
    # accessibility delivery method itself has changed.
    if standard_session_type not in {
        "easy",
        "steady",
    }:
        title = (
            f"{title} - "
            f"{standard_template['title']}"
        )

    return {
        "activity_id": requested_activity,
        "requested_activity_id": requested_activity,
        "progression_key": requested_activity,
        "activity_name": requested_activity.replace(
            "_",
            " ",
        ).title(),
        "session_type": accessibility_template[
            "session_type"
        ],
        "source_session_type": standard_session_type,
        "template_id": accessible_template_id,
        "source_template_id": standard_rule["template_id"],
        "title": title,
        "calendar_week": calendar_week,
        "rule_week": rule_week,
        "session_variant": variant,
        "distance_km": distance_km,
        "distance_m": distance_m,
        "duration_min": duration_min,
        "interval_count": interval_count,
        "work_interval_sec": work_interval_sec,
        "recovery_interval_sec": recovery_interval_sec,
        "intensity": standard_rule["intensity"],
        "warmup": accessibility_template["warmup_audio"],
        "main_workout": accessibility_template["main_audio"],
        "cooldown": accessibility_template["cooldown_audio"],
        "safety_note": accessibility_template["safety_note"],
        "required_resource": accessibility_template[
            "required_resource"
        ],
        "requires_guide": csv_bool(
            accessibility_template["requires_guide"]
        ),
        "progression_note": standard_rule[
            "progression_note"
        ],
        "accessibility_adapted": True,
        "accessibility_id": "blind_low_vision",
        "completion_threshold_pct": PROGRESSION_THRESHOLD,
    }


# ============================================================
# BUILD HOME ACCESSIBLE CARDIO SESSION
# ============================================================
#
# This progression is deliberately separate from running /
# cycling / swimming because the actual performed workout is
# indoor marching / step-touch.
# ============================================================

def build_home_accessible_cardio_session(
    database: WorkoutDatabase,
    lifestyle: str,
    calendar_week: int,
    rule_week: int,
    requested_activity: str,
) -> dict:
    rule = database.get_accessibility_progression_rule(
        "blind_low_vision",
        lifestyle,
        rule_week,
    )

    template = database.get_accessibility_template(
        rule["template_id"]
    )

    return {
        # Actual movement type is walking-like indoor cardio.
        # This is useful later for nutrition workload mapping.
        "activity_id": "walking",
        "requested_activity_id": requested_activity,
        "progression_key": ACCESSIBLE_CARDIO_KEY,
        "activity_name": "Accessible Indoor Cardio",
        "session_type": template["session_type"],
        "template_id": template["template_id"],
        "title": template["title"],
        "calendar_week": calendar_week,
        "rule_week": rule_week,
        "session_variant": "accessible_fallback",
        "distance_km": None,
        "distance_m": None,
        "duration_min": int_or_none(
            rule["duration_min"]
        ),
        "interval_count": int_or_none(
            rule["interval_count"]
        ),
        "work_interval_sec": int_or_none(
            rule["work_interval_sec"]
        ),
        "recovery_interval_sec": int_or_none(
            rule["recovery_interval_sec"]
        ),
        "intensity": rule["intensity"],
        "warmup": template["warmup_audio"],
        "main_workout": template["main_audio"],
        "cooldown": template["cooldown_audio"],
        "safety_note": template["safety_note"],
        "required_resource": template[
            "required_resource"
        ],
        "requires_guide": csv_bool(
            template["requires_guide"]
        ),
        "progression_note": rule[
            "progression_note"
        ],
        "accessibility_adapted": True,
        "accessibility_id": "blind_low_vision",
        "fallback_from_activity": requested_activity,
        "completion_threshold_pct": PROGRESSION_THRESHOLD,
    }


# ============================================================
# BUILD STRENGTH SESSION
# ============================================================

def build_strength_session(
    database: WorkoutDatabase,
    lifestyle: str,
    calendar_week: int,
    rule_week: int,
    previous_state: ProgressState,
    initial_strength_levels: dict[str, int],
    accessibility_id: str,
    strength_equipment: Optional[list[str]] = None,
) -> tuple[dict, dict[str, int], dict[str, int]]:
    session_rule = database.get_progression_rule(
        lifestyle,
        rule_week,
        "strength",
        "strength",
    )

    template = database.template_lookup[
        "STRENGTH_FULL_BODY"
    ]

    exercises = []
    current_variation_levels = {}
    current_exercise_rule_weeks = {}

    ordered_items = sorted(
        database.strength_items,
        key=lambda row: int(
            row["exercise_order"]
        ),
    )

    for item in ordered_items:
        family = item["exercise_family"]

        exercise_rule_week = (
            determine_strength_exercise_rule_week(
                family=family,
                calendar_week=calendar_week,
                previous_state=previous_state,
            )
        )

        current_exercise_rule_weeks[
            family
        ] = exercise_rule_week

        exercise_rule = database.get_progression_rule(
            lifestyle,
            exercise_rule_week,
            "strength",
            "strength",
        )

        sets = int_or_none(exercise_rule["sets"])
        reps = int_or_none(exercise_rule["reps"])
        rest_seconds = int_or_none(
            exercise_rule["rest_seconds"]
        )
        recommended_level = int_or_none(
            exercise_rule[
                "recommended_variation_level"
            ]
        )

        level = determine_strength_variation_level(
            family=family,
            recommended_level=recommended_level,
            calendar_week=calendar_week,
            previous_state=previous_state,
            initial_strength_levels=initial_strength_levels,
        )
        if strength_equipment is not None:
            level = constrain_variation_level_to_equipment(
                database=database,
                family=family,
                requested_level=level,
                strength_equipment=strength_equipment,
            )

        current_variation_levels[family] = level

        variation = database.variation_lookup[
            (
                family,
                level,
            )
        ]

        exercise = {
            "exercise_family": family,
            "exercise_order": int(
                item["exercise_order"]
            ),
            "rule_week": exercise_rule_week,
            "variation_id": variation["variation_id"],
            "exercise_name": variation[
                "variation_name"
            ],
            "variation_level": level,
            "sets": sets,
            "reps": reps,
            "rep_mode": item["rep_mode"],
            "rest_seconds": rest_seconds,
            "equipment": variation["equipment"],
            "description": variation["description"],
            "form_cues": variation["form_cues"],
            "planned_reps_per_set": reps,
            "completion_threshold_pct": (
                PROGRESSION_THRESHOLD
            ),
        }

        # Attach blind/low-vision audio/orientation guidance
        # when available. No rep-counter or computer-vision
        # assumption is made here.
        if accessibility_id == "blind_low_vision":
            guidance = database.get_accessibility_guidance(
                variation["variation_id"],
                "blind_low_vision",
            )

            if guidance is None:
                raise ValueError(
                    "Missing blind/low-vision guidance for "
                    f"{variation['variation_id']}"
                )

            exercise["accessibility_guidance"] = {
                "audio_instruction": guidance[
                    "audio_instruction"
                ],
                "orientation_cue": guidance[
                    "orientation_cue"
                ],
                "safety_note": guidance[
                    "safety_note"
                ],
            }

        exercises.append(exercise)

    session = {
        "activity_id": "strength",
        "requested_activity_id": "strength",
        "progression_key": "strength",
        "activity_name": "Full Body Strength",
        "session_type": "full_body",
        "template_id": "STRENGTH_FULL_BODY",
        "title": template["title"],
        "calendar_week": calendar_week,
        "rule_week": rule_week,
        "intensity": session_rule["intensity"],
        "warmup": template["warmup_description"],
        "main_workout": template["main_description"],
        "cooldown": template["cooldown_description"],
        "progression_note": session_rule[
            "progression_note"
        ],
        "exercises": exercises,
        "accessibility_adapted": (
            accessibility_id == "blind_low_vision"
        ),
        "accessibility_id": accessibility_id,
        "completion_threshold_pct": (
            PROGRESSION_THRESHOLD
        ),
    }

    if accessibility_id == "blind_low_vision":
        session["required_resource"] = "stable_support"
        session["safety_note"] = (
            "Use the stable support and clear familiar "
            "exercise area described in the exercise "
            "instructions."
        )

    return (
        session,
        current_variation_levels,
        current_exercise_rule_weeks,
    )


# ============================================================
# MAIN WEEKLY PLAN GENERATOR
# ============================================================

def generate_weekly_workout_plan(
    lifestyle: str,
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
    if accessibility_resources is None:
        accessibility_resources = []

    (
        preferences,
        accessibility_resources,
    ) = validate_request(
        lifestyle=lifestyle,
        preferences=preferences,
        week_number=week_number,
        accessibility_id=accessibility_id,
        accessibility_resources=accessibility_resources,
    )

    if isinstance(previous_progress, dict):
        previous_progress = ProgressState.from_dict(
            previous_progress
        )

    if previous_progress is None:
        previous_progress = ProgressState()

    if initial_strength_levels is None:
        initial_strength_levels = strength_experience_initial_level(
            strength_experience
        )

    database = WorkoutDatabase()

    accessibility_presentation = (
        build_accessibility_presentation(
            database,
            accessibility_id,
        )
    )

    resources_set = set(accessibility_resources)

    schedule_rule = database.get_schedule_rule(
        lifestyle,
        week_number,
    )

    active_days = int(
        schedule_rule["active_days_target"]
    )

    if active_days not in SCHEDULE_PATTERNS:
        raise ValueError(
            "Unsupported active_days_target: "
            f"{active_days}"
        )

    pattern = SCHEDULE_PATTERNS[active_days]

    cardio_slots = int(
        schedule_rule[
            "preferred_activity_sessions"
        ]
    )

    cardio_activities = [
        preferences[index % len(preferences)]
        for index in range(cardio_slots)
    ]

    total_activity_occurrences = Counter(
        cardio_activities
    )

    occurrence_counter = defaultdict(int)

    # Determine standard activity rule weeks for activities
    # that appear in this week's preference slots.
    rule_weeks = {
        "strength": determine_rule_week(
            progression_key="strength",
            calendar_week=week_number,
            previous_state=previous_progress,
        )
    }

    for activity in set(cardio_activities):
        rule_weeks[activity] = determine_rule_week(
            progression_key=activity,
            calendar_week=week_number,
            previous_state=previous_progress,
        )

    # A blind/low-vision user may need the generic home
    # accessible cardio progression.
    accessible_cardio_rule_week = None

    if accessibility_id == "blind_low_vision":
        any_home_fallback_needed = any(
            resolve_blind_cardio_mode(
                requested_activity=activity,
                resources=resources_set,
            )
            == "HOME_ACCESSIBLE_CARDIO"
            for activity in cardio_activities
        )

        if any_home_fallback_needed:
            accessible_cardio_rule_week = (
                determine_rule_week(
                    progression_key=(
                        ACCESSIBLE_CARDIO_KEY
                    ),
                    calendar_week=week_number,
                    previous_state=previous_progress,
                )
            )

            rule_weeks[
                ACCESSIBLE_CARDIO_KEY
            ] = accessible_cardio_rule_week

    (
        strength_session,
        current_strength_levels,
        current_exercise_rule_weeks,
    ) = build_strength_session(
        database=database,
        lifestyle=lifestyle,
        calendar_week=week_number,
        rule_week=rule_weeks["strength"],
        previous_state=previous_progress,
        initial_strength_levels=initial_strength_levels,
        accessibility_id=accessibility_id,
        strength_equipment=strength_equipment,
    )

    week = []
    cardio_index = 0
    unavailable_accessibility_slots = []

    for day_index, day_name in enumerate(DAYS):
        slot_type = pattern.get(day_index)

        # ----------------------------------------------------
        # REST DAY
        # ----------------------------------------------------
        if slot_type is None:
            week.append({
                "day": day_name,
                "day_number": day_index + 1,
                "is_rest_day": True,
                "rest_reason": "scheduled_rest",
                "workout": None,
            })
            continue

        # ----------------------------------------------------
        # STRENGTH DAY
        # ----------------------------------------------------
        if slot_type == "strength":
            week.append({
                "day": day_name,
                "day_number": day_index + 1,
                "is_rest_day": False,
                "rest_reason": None,
                "workout": strength_session,
            })
            continue

        # ----------------------------------------------------
        # PREFERRED ACTIVITY SLOT
        # ----------------------------------------------------
        requested_activity = cardio_activities[
            cardio_index
        ]
        cardio_index += 1

        occurrence_index = occurrence_counter[
            requested_activity
        ]
        occurrence_counter[
            requested_activity
        ] += 1

        standard_rule_week = rule_weeks[
            requested_activity
        ]

        variant = choose_cardio_variant(
            activity=requested_activity,
            occurrence_index=occurrence_index,
            total_occurrences=(
                total_activity_occurrences[
                    requested_activity
                ]
            ),
            rule_week=standard_rule_week,
            database=database,
            lifestyle=lifestyle,
        )

        # ====================================================
        # BLIND / LOW-VISION ADAPTATION
        # ====================================================
        if accessibility_id == "blind_low_vision":
            mode = resolve_blind_cardio_mode(
                requested_activity=requested_activity,
                resources=resources_set,
            )

            if mode is None:
                reason = (
                    "No compatible accessible cardio option "
                    f"is available for the selected "
                    f"'{requested_activity}' preference with "
                    "the currently declared resources."
                )

                unavailable_accessibility_slots.append({
                    "day": day_name,
                    "requested_activity_id": (
                        requested_activity
                    ),
                    "reason": reason,
                })

                week.append({
                    "day": day_name,
                    "day_number": day_index + 1,
                    "is_rest_day": True,
                    "rest_reason": (
                        "no_compatible_accessible_option"
                    ),
                    "requested_activity_id": (
                        requested_activity
                    ),
                    "accessibility_message": reason,
                    "workout": None,
                })
                continue

            if mode == "HOME_ACCESSIBLE_CARDIO":
                session = build_home_accessible_cardio_session(
                    database=database,
                    lifestyle=lifestyle,
                    calendar_week=week_number,
                    rule_week=(
                        accessible_cardio_rule_week
                    ),
                    requested_activity=(
                        requested_activity
                    ),
                )

            else:
                session = (
                    build_blind_supported_preference_session(
                        database=database,
                        lifestyle=lifestyle,
                        calendar_week=week_number,
                        requested_activity=(
                            requested_activity
                        ),
                        variant=variant,
                        rule_week=standard_rule_week,
                        accessible_template_id=mode,
                        total_activity_occurrences=(
                            total_activity_occurrences[
                                requested_activity
                            ]
                        ),
                    )
                )

        # ====================================================
        # STANDARD / DEAF / OTHER
        # ====================================================
        else:
            session = build_standard_cardio_session(
                database=database,
                lifestyle=lifestyle,
                calendar_week=week_number,
                activity=requested_activity,
                variant=variant,
                rule_week=standard_rule_week,
                total_activity_occurrences=(
                    total_activity_occurrences[
                        requested_activity
                    ]
                ),
            )

            # Deaf/hard-of-hearing and "other" do not
            # automatically change workout selection.
            session["accessibility_id"] = (
                accessibility_id
            )

        week.append({
            "day": day_name,
            "day_number": day_index + 1,
            "is_rest_day": False,
            "rest_reason": None,
            "workout": session,
        })

    # ========================================================
    # PROGRESSION DECISIONS
    # ========================================================

    progression_keys_used = {"strength"}

    for day in week:
        workout = day.get("workout")
        if workout:
            progression_keys_used.add(
                workout["progression_key"]
            )

    activity_decisions = {}

    for progression_key in sorted(
        progression_keys_used
    ):
        current_rule_week = rule_weeks.get(
            progression_key
        )

        if current_rule_week is None:
            # This should only happen for future extension,
            # but keep the output safe and explicit.
            continue

        activity_decisions[progression_key] = {
            "previous_rule_week": (
                previous_progress
                .activity_rule_week
                .get(progression_key)
            ),
            "current_rule_week": current_rule_week,
            "progression_allowed": (
                activity_can_progress(
                    previous_progress,
                    progression_key,
                )
                if week_number > 1
                else False
            ),
            "previous_activity_completion_pct": (
                previous_progress
                .activity_completion_pct
                .get(progression_key)
            ),
        }

    exercise_decisions = {}

    for family in STRENGTH_FAMILIES:
        previous_week = (
            previous_progress
            .exercise_rule_week
            .get(family)
        )

        current_week = (
            current_exercise_rule_weeks[
                family
            ]
        )

        exercise_decisions[family] = {
            "previous_rule_week": previous_week,
            "current_rule_week": current_week,
            "previous_completion_pct": (
                previous_progress
                .exercise_completion_pct
                .get(family)
            ),
            "progressed": (
                previous_week is not None
                and current_week > previous_week
            ),
        }

    actual_active_days = sum(
        1
        for day in week
        if not day["is_rest_day"]
    )

    return {
        "week_number": week_number,
        "lifestyle": lifestyle,
        "preferences": preferences,
        "accessibility_id": accessibility_id,
        "accessibility_resources": (
            accessibility_resources
        ),
        "accessibility_presentation": (
            accessibility_presentation
        ),
        "active_days_target": active_days,
        "actual_active_days": actual_active_days,
        "strength_sessions": 2,
        "preferred_activity_sessions": cardio_slots,
        "rest_days_target": int(
            schedule_rule["rest_days_target"]
        ),
        "actual_rest_days": 7 - actual_active_days,
        "is_consolidation_week": csv_bool(
            schedule_rule["is_consolidation_week"]
        ),
        "progression_threshold_pct": (
            PROGRESSION_THRESHOLD
        ),
        "progression_decisions": (
            activity_decisions
        ),
        "strength_exercise_decisions": (
            exercise_decisions
        ),
        "accessibility_unavailable_slots": (
            unavailable_accessibility_slots
        ),
        "progress_state": {
            "activity_rule_week": {
                key: rule_weeks[key]
                for key in progression_keys_used
                if key in rule_weeks
            },
            "exercise_rule_week": (
                current_exercise_rule_weeks
            ),
            "strength_variation_levels": (
                current_strength_levels
            ),
        },
        "days": week,
    }


# ============================================================
# CREATE PROGRESS STATE AFTER WEEK
# ============================================================

def create_progress_state_after_week(
    current_plan: dict,
    session_logs: list[dict],
) -> ProgressState:
    summary = summarize_week_completion(
        session_logs
    )

    summary.activity_rule_week = dict(
        current_plan[
            "progress_state"
        ][
            "activity_rule_week"
        ]
    )

    summary.exercise_rule_week = dict(
        current_plan[
            "progress_state"
        ][
            "exercise_rule_week"
        ]
    )

    summary.strength_variation_levels = dict(
        current_plan[
            "progress_state"
        ][
            "strength_variation_levels"
        ]
    )

    return summary


# ============================================================
# TERMINAL SUMMARY
# ============================================================

def print_week_summary(plan: dict) -> None:
    print()
    print("=" * 88)
    print(
        f"WEEK {plan['week_number']} WORKOUT PLAN"
    )
    print("=" * 88)

    print(
        "Lifestyle:",
        plan["lifestyle"],
    )
    print(
        "Preferences:",
        ", ".join(plan["preferences"]),
    )
    print(
        "Accessibility:",
        plan["accessibility_id"],
    )
    print(
        "Resources:",
        ", ".join(
            plan["accessibility_resources"]
        )
        if plan["accessibility_resources"]
        else "none declared",
    )
    print(
        "Progression threshold:",
        f"{plan['progression_threshold_pct']}%",
    )
    print(
        "Consolidation week:",
        plan["is_consolidation_week"],
    )
    print(
        "Active days:",
        f"{plan['actual_active_days']} "
        f"(target {plan['active_days_target']})",
    )

    print()
    print("-" * 88)

    for day in plan["days"]:
        day_name = day["day"].title()

        if day["is_rest_day"]:
            print(
                f"{day_name:10} REST "
                f"[{day['rest_reason']}]"
            )

            if day.get("accessibility_message"):
                print(
                    "             "
                    f"{day['accessibility_message']}"
                )

            continue

        workout = day["workout"]

        print(
            f"{day_name:10} "
            f"{workout['title']} "
            f"[Rule Week {workout['rule_week']}]"
        )

        if workout["activity_id"] == "strength":
            for exercise in workout["exercises"]:
                print(
                    "             "
                    f"- {exercise['exercise_name']} "
                    f"({exercise['sets']} × "
                    f"{exercise['reps']}, "
                    f"rest "
                    f"{exercise['rest_seconds']} sec) "
                    f"[Exercise Rule Week "
                    f"{exercise['rule_week']}]"
                )

                if exercise.get(
                    "accessibility_guidance"
                ):
                    print(
                        "               Audio: "
                        f"{exercise['accessibility_guidance']['audio_instruction']}"
                    )

        else:
            details = []

            if workout.get("distance_km") is not None:
                details.append(
                    f"{workout['distance_km']} km"
                )

            if workout.get("distance_m") is not None:
                details.append(
                    f"{workout['distance_m']} m"
                )

            if workout.get("duration_min") is not None:
                details.append(
                    f"{workout['duration_min']} min"
                )

            if workout.get("interval_count") is not None:
                details.append(
                    f"{workout['interval_count']} intervals"
                )

            if workout.get("work_interval_sec") is not None:
                details.append(
                    "work "
                    f"{workout['work_interval_sec']} sec"
                )

            if workout.get(
                "recovery_interval_sec"
            ) is not None:
                details.append(
                    "recovery "
                    f"{workout['recovery_interval_sec']} sec"
                )

            print(
                "             "
                + " | ".join(details)
            )

            if workout.get("fallback_from_activity"):
                print(
                    "             "
                    "Accessible fallback for preference: "
                    f"{workout['fallback_from_activity']}"
                )

            if workout.get("safety_note"):
                print(
                    "             Safety: "
                    f"{workout['safety_note']}"
                )

    print()
    print("Activity progression decisions:")

    for key, decision in (
        plan["progression_decisions"].items()
    ):
        print(
            f"  {key:18} "
            f"-> Rule Week "
            f"{decision['current_rule_week']} "
            f"| previous completion: "
            f"{decision['previous_activity_completion_pct']}"
        )

    print()
    print("Strength exercise progression decisions:")

    for family, decision in (
        plan[
            "strength_exercise_decisions"
        ].items()
    ):
        print(
            f"  {family:14} "
            f"-> Rule Week "
            f"{decision['current_rule_week']} "
            f"| previous completion: "
            f"{decision['previous_completion_pct']}"
        )

    if plan["accessibility_unavailable_slots"]:
        print()
        print("Accessibility slots requiring attention:")
        for item in plan[
            "accessibility_unavailable_slots"
        ]:
            print(
                f"  {item['day']}: "
                f"{item['reason']}"
            )

    print()
    print("=" * 88)


# ============================================================
# DEMO
# ============================================================
#
# Run this file directly after all workout/accessibility CSVs
# have been generated.
# ============================================================

if __name__ == "__main__":
    print()
    print("TEST 1: STANDARD USER")

    standard_plan = generate_weekly_workout_plan(
        lifestyle="light",
        preferences=[
            "running",
            "cycling",
        ],
        week_number=1,
        accessibility_id="none",
    )

    print_week_summary(standard_plan)

    print()
    print("TEST 2: BLIND/LOW-VISION - HOME FALLBACK")

    blind_home_plan = generate_weekly_workout_plan(
        lifestyle="light",
        preferences=[
            "running",
            "cycling",
        ],
        week_number=1,
        accessibility_id="blind_low_vision",
        accessibility_resources=[
            "safe_indoor_space",
            "stable_support",
        ],
    )

    print_week_summary(blind_home_plan)

    print()
    print("TEST 3: BLIND/LOW-VISION - SUPPORTED PREFERENCES")

    blind_supported_plan = generate_weekly_workout_plan(
        lifestyle="light",
        preferences=[
            "running",
            "cycling",
        ],
        week_number=1,
        accessibility_id="blind_low_vision",
        accessibility_resources=[
            "stable_support",
            "guide",
            "stationary_bike",
        ],
    )

    print_week_summary(blind_supported_plan)

    print()
    print("TEST 4: DEAF/HARD-OF-HEARING")

    deaf_plan = generate_weekly_workout_plan(
        lifestyle="light",
        preferences=[
            "running",
            "cycling",
        ],
        week_number=1,
        accessibility_id="deaf_hard_of_hearing",
    )

    print_week_summary(deaf_plan)

    print()
    print("ACCESSIBILITY-AWARE WEEKLY ENGINE WORKING")
