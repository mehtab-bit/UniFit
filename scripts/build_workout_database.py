from pathlib import Path
import csv


# ============================================================
# PATHS
# ============================================================

OUTPUT_DIR = Path("data/workouts")

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ACTIVITIES_PATH = (
    OUTPUT_DIR / "activities.csv"
)

TEMPLATES_PATH = (
    OUTPUT_DIR / "workout_templates.csv"
)

VARIATIONS_PATH = (
    OUTPUT_DIR / "exercise_variations.csv"
)

STRENGTH_ITEMS_PATH = (
    OUTPUT_DIR / "strength_session_items.csv"
)

SCHEDULE_RULES_PATH = (
    OUTPUT_DIR / "lifestyle_schedule_rules.csv"
)

PROGRESSION_PATH = (
    OUTPUT_DIR / "progression_rules.csv"
)


# ============================================================
# HELPER
# ============================================================

def write_csv(
    path,
    rows,
    columns,
):

    with path.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=columns,
        )

        writer.writeheader()
        writer.writerows(rows)


# ============================================================
# 1. ACTIVITIES
# ============================================================

activities = [

    {
        "activity_id": "walking",
        "activity_name": "Walking",
        "selectable_in_onboarding": True,
        "mandatory": False,
        "minimum_sessions_per_week": 0,
        "primary_metrics":
            "distance_km,duration_min,intensity",
        "description":
            "Low-impact cardiovascular activity that can "
            "progress through duration, distance and pace.",
    },

    {
        "activity_id": "running",
        "activity_name": "Running",
        "selectable_in_onboarding": True,
        "mandatory": False,
        "minimum_sessions_per_week": 0,
        "primary_metrics":
            "distance_km,duration_min,intervals,intensity",
        "description":
            "Running progression can use run-walk, easy "
            "continuous, interval and tempo sessions.",
    },

    {
        "activity_id": "cycling",
        "activity_name": "Cycling",
        "selectable_in_onboarding": True,
        "mandatory": False,
        "minimum_sessions_per_week": 0,
        "primary_metrics":
            "distance_km,duration_min,intervals,intensity",
        "description":
            "Cycling progresses through duration, distance "
            "and controlled interval sessions.",
    },

    {
        "activity_id": "swimming",
        "activity_name": "Swimming",
        "selectable_in_onboarding": True,
        "mandatory": False,
        "minimum_sessions_per_week": 0,
        "primary_metrics":
            "distance_m,duration_min,intervals,rest_seconds",
        "description":
            "Swimming progresses through total distance, "
            "technique work and interval sets.",
    },

    {
        "activity_id": "strength",
        "activity_name": "Full Body Strength",
        "selectable_in_onboarding": False,
        "mandatory": True,

        # LOCKED REQUIREMENT
        "minimum_sessions_per_week": 2,

        "primary_metrics":
            "sets,reps,rest_seconds,variation_level",

        "description":
            "Mandatory full-body strength training performed "
            "twice per week.",
    },

]


# ============================================================
# 2. WORKOUT TEMPLATES
# ============================================================
#
# Templates describe HOW a workout is performed.
#
# Progression rules later decide:
#
# distance
# duration
# reps
# intervals
# etc.
#
# ============================================================

workout_templates = [

    # --------------------------------------------------------
    # WALKING
    # --------------------------------------------------------

    {
        "template_id": "WALK_EASY",
        "activity_id": "walking",
        "session_type": "easy",
        "title": "Easy Walk",
        "intensity_default": "easy",

        "warmup_description":
            "Begin with 3-5 minutes of relaxed walking. "
            "Gradually lengthen your stride and settle into "
            "a comfortable rhythm.",

        "main_description":
            "Walk at a comfortable conversational pace. "
            "Keep posture upright, shoulders relaxed and "
            "take controlled natural steps.",

        "cooldown_description":
            "Finish with 3-5 minutes of slower walking and "
            "allow breathing to return toward normal.",
    },

    {
        "template_id": "WALK_BRISK",
        "activity_id": "walking",
        "session_type": "brisk",
        "title": "Brisk Walk",
        "intensity_default": "moderate",

        "warmup_description":
            "Walk easily for about 5 minutes before "
            "gradually increasing pace.",

        "main_description":
            "Walk faster than your normal pace while staying "
            "controlled. Arms may swing naturally. You should "
            "still be able to speak in short sentences.",

        "cooldown_description":
            "Reduce the pace gradually for approximately "
            "5 minutes.",
    },

    {
        "template_id": "WALK_INTERVAL",
        "activity_id": "walking",
        "session_type": "interval",
        "title": "Brisk Walking Intervals",
        "intensity_default": "moderate",

        "warmup_description":
            "Walk easily for 5-7 minutes.",

        "main_description":
            "Alternate brisk walking periods with easier "
            "recovery walking. Do not sprint. The goal is "
            "controlled changes in pace.",

        "cooldown_description":
            "Walk slowly for approximately 5 minutes.",
    },


    # --------------------------------------------------------
    # RUNNING
    # --------------------------------------------------------

    {
        "template_id": "RUN_WALK",
        "activity_id": "running",
        "session_type": "run_walk",
        "title": "Run-Walk Session",
        "intensity_default": "easy",

        "warmup_description":
            "Begin with 5-8 minutes of brisk walking. Add a "
            "few short periods of very easy jogging if "
            "comfortable.",

        "main_description":
            "Alternate easy running with walking recovery. "
            "Running portions should feel controlled rather "
            "than like a sprint.",

        "cooldown_description":
            "Finish with at least 5 minutes of easy walking.",
    },

    {
        "template_id": "RUN_EASY",
        "activity_id": "running",
        "session_type": "easy",
        "title": "Easy Continuous Run",
        "intensity_default": "easy",

        "warmup_description":
            "Walk or jog easily for 5-8 minutes before "
            "settling into the main run.",

        "main_description":
            "Run at a comfortable conversational effort. "
            "Focus on relaxed shoulders, controlled breathing "
            "and an easy sustainable pace.",

        "cooldown_description":
            "Slow to an easy jog and then walk for "
            "approximately 5 minutes.",
    },

    {
        "template_id": "RUN_INTERVAL",
        "activity_id": "running",
        "session_type": "interval",
        "title": "Running Interval Session",
        "intensity_default": "moderate_hard",

        "warmup_description":
            "Complete 8-10 minutes of easy walking and "
            "jogging before beginning the intervals.",

        "main_description":
            "Alternate controlled faster running periods "
            "with easy walking or jogging recovery. Faster "
            "does not mean all-out sprinting.",

        "cooldown_description":
            "Jog or walk easily for 5-8 minutes.",
    },

    {
        "template_id": "RUN_TEMPO",
        "activity_id": "running",
        "session_type": "tempo",
        "title": "Controlled Tempo Run",
        "intensity_default": "moderate",

        "warmup_description":
            "Complete approximately 8-10 minutes of easy "
            "walking and jogging.",

        "main_description":
            "Run at a comfortably challenging but controlled "
            "pace. The effort should be clearly harder than "
            "an easy run but should not become an all-out "
            "effort.",

        "cooldown_description":
            "Finish with easy jogging or walking for "
            "5-10 minutes.",
    },


    # --------------------------------------------------------
    # CYCLING
    # --------------------------------------------------------

    {
        "template_id": "CYCLE_EASY",
        "activity_id": "cycling",
        "session_type": "easy",
        "title": "Easy Cycling",
        "intensity_default": "easy",

        "warmup_description":
            "Cycle very easily for the first 5 minutes.",

        "main_description":
            "Maintain a comfortable cadence and resistance. "
            "The effort should feel sustainable and smooth.",

        "cooldown_description":
            "Reduce resistance and pedal easily for "
            "approximately 5 minutes.",
    },

    {
        "template_id": "CYCLE_STEADY",
        "activity_id": "cycling",
        "session_type": "steady",
        "title": "Steady Cycling",
        "intensity_default": "moderate",

        "warmup_description":
            "Cycle easily for 5-8 minutes.",

        "main_description":
            "Ride at a steady moderate effort. Keep the "
            "pedalling rhythm controlled and avoid turning "
            "the session into an all-out effort.",

        "cooldown_description":
            "Pedal easily for approximately 5 minutes.",
    },

    {
        "template_id": "CYCLE_INTERVAL",
        "activity_id": "cycling",
        "session_type": "interval",
        "title": "Cycling Intervals",
        "intensity_default": "moderate_hard",

        "warmup_description":
            "Cycle easily for 8-10 minutes.",

        "main_description":
            "Alternate stronger controlled cycling efforts "
            "with easy pedalling recovery periods.",

        "cooldown_description":
            "Finish with at least 5 minutes of easy cycling.",
    },


    # --------------------------------------------------------
    # SWIMMING
    # --------------------------------------------------------

    {
        "template_id": "SWIM_EASY",
        "activity_id": "swimming",
        "session_type": "easy",
        "title": "Easy Swim",
        "intensity_default": "easy",

        "warmup_description":
            "Begin with several relaxed lengths using a "
            "comfortable stroke.",

        "main_description":
            "Swim at a controlled pace with emphasis on "
            "smooth technique and comfortable breathing.",

        "cooldown_description":
            "Finish with several very easy relaxed lengths.",
    },

    {
        "template_id": "SWIM_TECHNIQUE",
        "activity_id": "swimming",
        "session_type": "technique",
        "title": "Swimming Technique Session",
        "intensity_default": "easy",

        "warmup_description":
            "Begin with easy relaxed swimming.",

        "main_description":
            "Break the total distance into manageable sets. "
            "Prioritize stroke control, body position and "
            "relaxed breathing over speed.",

        "cooldown_description":
            "Finish with relaxed easy swimming.",
    },

    {
        "template_id": "SWIM_INTERVAL",
        "activity_id": "swimming",
        "session_type": "interval",
        "title": "Swimming Interval Session",
        "intensity_default": "moderate_hard",

        "warmup_description":
            "Begin with easy swimming and several relaxed "
            "practice lengths.",

        "main_description":
            "Divide the distance into repeated controlled "
            "efforts separated by recovery at the pool wall. "
            "Maintain technique as intensity rises.",

        "cooldown_description":
            "Finish with relaxed swimming.",
    },


    # --------------------------------------------------------
    # STRENGTH
    # --------------------------------------------------------

    {
        "template_id": "STRENGTH_FULL_BODY",
        "activity_id": "strength",
        "session_type": "full_body",
        "title": "Full Body Strength Session",
        "intensity_default": "moderate",

        "warmup_description":
            "Begin with 5-8 minutes of easy movement. Include "
            "shoulder circles, controlled bodyweight squats, "
            "gentle hip movement and easy marching.",

        "main_description":
            "Perform the five prescribed exercises in order. "
            "Prioritize controlled technique over speed or "
            "heavy resistance.",

        "cooldown_description":
            "Finish with easy walking and relaxed mobility "
            "for the muscles used during the session.",
    },

]


# ============================================================
# 3. STRENGTH EXERCISE VARIATIONS
# ============================================================
#
# 5 exercise families
# ×
# 3 difficulty levels
#
# = 15 variations
#
# ============================================================

exercise_variations = [

    # ========================================================
    # SQUAT
    # ========================================================

    {
        "variation_id": "SQUAT_L1",
        "exercise_family": "squat",
        "variation_name": "Chair Squat",
        "difficulty_level": 1,
        "equipment": "chair",

        "description":
            "Stand in front of a stable chair with feet about "
            "shoulder-width apart. Push the hips back and "
            "lower under control until lightly touching the "
            "chair, then stand again.",

        "form_cues":
            "Keep the chest upright; knees follow the "
            "direction of the toes; keep both feet planted.",
    },

    {
        "variation_id": "SQUAT_L2",
        "exercise_family": "squat",
        "variation_name": "Bodyweight Squat",
        "difficulty_level": 2,
        "equipment": "none",

        "description":
            "Stand with feet approximately shoulder-width "
            "apart. Sit the hips back and bend the knees, "
            "then drive through the feet to stand.",

        "form_cues":
            "Keep the torso controlled; knees track with "
            "the toes; move through a comfortable range.",
    },

    {
        "variation_id": "SQUAT_L3",
        "exercise_family": "squat",
        "variation_name": "Loaded Squat",
        "difficulty_level": 3,
        "equipment":
            "dumbbell, backpack, water bottles or other "
            "secure household resistance",

        "description":
            "Perform the squat while holding a manageable "
            "external load close to the body.",

        "form_cues":
            "Use only a secure load; maintain the same "
            "controlled squat technique used in the "
            "bodyweight version.",
    },


    # ========================================================
    # LUNGE
    # ========================================================

    {
        "variation_id": "LUNGE_L1",
        "exercise_family": "lunge",
        "variation_name": "Supported Reverse Lunge",
        "difficulty_level": 1,
        "equipment": "stable chair or support",

        "description":
            "Hold a stable support and step one foot "
            "backward. Lower under control and return "
            "to standing before changing legs.",

        "form_cues":
            "Keep the front foot planted; stay controlled; "
            "use the support for balance rather than pulling.",
    },

    {
        "variation_id": "LUNGE_L2",
        "exercise_family": "lunge",
        "variation_name": "Reverse Lunge",
        "difficulty_level": 2,
        "equipment": "none",

        "description":
            "Step backward into a controlled lunge, then "
            "push through the front foot to return to "
            "standing.",

        "form_cues":
            "Maintain balance; keep the front knee tracking "
            "with the toes; control both the lowering and "
            "return.",
    },

    {
        "variation_id": "LUNGE_L3",
        "exercise_family": "lunge",
        "variation_name": "Loaded Reverse Lunge",
        "difficulty_level": 3,
        "equipment":
            "dumbbells, water bottles or secure household "
            "resistance",

        "description":
            "Perform reverse lunges while holding a "
            "manageable external load.",

        "form_cues":
            "Use a secure load and preserve the same balance "
            "and knee control as the unloaded variation.",
    },


    # ========================================================
    # PUSH-UP
    # ========================================================

    {
        "variation_id": "PUSHUP_L1",
        "exercise_family": "pushup",
        "variation_name": "Wall Push-Up",
        "difficulty_level": 1,
        "equipment": "wall",

        "description":
            "Place both hands against a wall around chest "
            "height. Bend the elbows and bring the chest "
            "toward the wall, then press away.",

        "form_cues":
            "Keep the body in a straight line; avoid letting "
            "the hips collapse forward.",
    },

    {
        "variation_id": "PUSHUP_L2",
        "exercise_family": "pushup",
        "variation_name": "Incline Push-Up",
        "difficulty_level": 2,
        "equipment":
            "stable bench, table or other secure raised "
            "surface",

        "description":
            "Place hands on a stable elevated surface and "
            "perform a push-up while maintaining a straight "
            "body position.",

        "form_cues":
            "Use only a stable surface; keep elbows "
            "controlled; maintain trunk tension.",
    },

    {
        "variation_id": "PUSHUP_L3",
        "exercise_family": "pushup",
        "variation_name": "Floor Push-Up",
        "difficulty_level": 3,
        "equipment": "none",

        "description":
            "From a strong plank position, lower the chest "
            "toward the floor and press back to the starting "
            "position.",

        "form_cues":
            "Keep head, torso and hips aligned; maintain "
            "controlled elbows and trunk position.",
    },


    # ========================================================
    # BICEP CURL
    # ========================================================

    {
        "variation_id": "CURL_L1",
        "exercise_family": "bicep_curl",
        "variation_name": "Light Bottle Bicep Curl",
        "difficulty_level": 1,
        "equipment": "small water bottles or light dumbbells",

        "description":
            "Hold a light object securely in each hand. "
            "Bend the elbows to bring the load upward, then "
            "lower slowly.",

        "form_cues":
            "Keep elbows close to the body and avoid swinging "
            "the torso.",
    },

    {
        "variation_id": "CURL_L2",
        "exercise_family": "bicep_curl",
        "variation_name": "Standard Bicep Curl",
        "difficulty_level": 2,
        "equipment":
            "dumbbells, filled water bottles or other secure "
            "resistance",

        "description":
            "Curl a manageable resistance while keeping the "
            "upper arms relatively still.",

        "form_cues":
            "Avoid momentum; control the lowering phase.",
    },

    {
        "variation_id": "CURL_L3",
        "exercise_family": "bicep_curl",
        "variation_name": "Heavier Controlled Bicep Curl",
        "difficulty_level": 3,
        "equipment":
            "dumbbells or secure household resistance",

        "description":
            "Use a slightly greater resistance while "
            "maintaining strict controlled curl technique.",

        "form_cues":
            "Increase resistance only if previous resistance "
            "can be controlled without swinging.",
    },


    # ========================================================
    # SUPPORTED ROW
    # ========================================================

    {
        "variation_id": "ROW_L1",
        "exercise_family": "supported_row",
        "variation_name": "Light Supported One-Arm Row",
        "difficulty_level": 1,
        "equipment":
            "stable support and light water bottle",

        "description":
            "Place one hand on a stable support. Hold a light "
            "weight in the opposite hand and pull it toward "
            "the side of the rib cage, then lower slowly.",

        "form_cues":
            "Keep the back controlled; avoid twisting the "
            "torso; pull the elbow backward.",
    },

    {
        "variation_id": "ROW_L2",
        "exercise_family": "supported_row",
        "variation_name": "Supported One-Arm Row",
        "difficulty_level": 2,
        "equipment":
            "stable support plus dumbbell, bottle or secure "
            "household resistance",

        "description":
            "Use a supported stance and row a manageable "
            "load toward the torso.",

        "form_cues":
            "Maintain a stable trunk and controlled shoulder "
            "movement.",
    },

    {
        "variation_id": "ROW_L3",
        "exercise_family": "supported_row",
        "variation_name": "Heavier Supported One-Arm Row",
        "difficulty_level": 3,
        "equipment":
            "stable support and heavier secure resistance",

        "description":
            "Perform the same supported rowing motion with a "
            "greater but manageable resistance.",

        "form_cues":
            "Do not sacrifice trunk position or range of "
            "motion simply to use more resistance.",
    },

]


# ============================================================
# 4. STRENGTH SESSION COMPOSITION
# ============================================================

strength_session_items = [

    {
        "session_template_id": "STRENGTH_FULL_BODY",
        "exercise_order": 1,
        "exercise_family": "squat",
        "rep_mode": "total_reps",
    },

    {
        "session_template_id": "STRENGTH_FULL_BODY",
        "exercise_order": 2,
        "exercise_family": "lunge",
        "rep_mode": "reps_each_side",
    },

    {
        "session_template_id": "STRENGTH_FULL_BODY",
        "exercise_order": 3,
        "exercise_family": "pushup",
        "rep_mode": "total_reps",
    },

    {
        "session_template_id": "STRENGTH_FULL_BODY",
        "exercise_order": 4,
        "exercise_family": "bicep_curl",
        "rep_mode": "reps_each_arm",
    },

    {
        "session_template_id": "STRENGTH_FULL_BODY",
        "exercise_order": 5,
        "exercise_family": "supported_row",
        "rep_mode": "reps_each_arm",
    },

]


# ============================================================
# 5. 8-WEEK SCHEDULE RULES
# ============================================================
#
# Strength remains exactly 2 sessions/week.
#
# Preferred cardio/activity sessions change depending on
# lifestyle and week.
#
# Week 4 intentionally consolidates/reduces workload.
#
# ============================================================

ACTIVE_DAYS_BY_LIFESTYLE = {

    "sedentary": [
        3,  # Week 1
        3,
        4,
        3,  # consolidation
        4,
        4,
        4,
        4,
    ],

    "light": [
        4,
        4,
        4,
        4,  # consolidation
        5,
        5,
        5,
        5,
    ],

    "moderate": [
        5,
        5,
        5,
        4,  # consolidation
        5,
        5,
        6,
        5,
    ],

    "very_active": [
        5,
        6,
        6,
        5,  # consolidation
        6,
        6,
        6,
        6,
    ],

}


lifestyle_schedule_rules = []


for lifestyle, weeks in (
    ACTIVE_DAYS_BY_LIFESTYLE.items()
):

    for week_number, active_days in enumerate(
        weeks,
        start=1,
    ):

        strength_sessions = 2

        preferred_activity_sessions = (
            active_days
            -
            strength_sessions
        )

        rest_days = (
            7
            -
            active_days
        )

        lifestyle_schedule_rules.append({

            "lifestyle":
                lifestyle,

            "week_number":
                week_number,

            "active_days_target":
                active_days,

            "strength_sessions":
                strength_sessions,

            "preferred_activity_sessions":
                preferred_activity_sessions,

            "rest_days_target":
                rest_days,

            "is_consolidation_week":
                week_number == 4,

        })


# ============================================================
# 6. PROGRESSION RULES
# ============================================================


# ------------------------------------------------------------
# WEEK LOAD MULTIPLIERS
# ------------------------------------------------------------

WEEK_MULTIPLIERS = {

    1: 1.00,
    2: 1.08,
    3: 1.15,

    # Consolidation week
    4: 0.95,

    5: 1.15,
    6: 1.22,
    7: 1.30,
    8: 1.35,
}


# ------------------------------------------------------------
# CARDIO BASELINES
# ------------------------------------------------------------

CARDIO_BASELINES = {

    "sedentary": {

        "walking": {
            "distance_km": 1.5,
            "duration_min": 20,
        },

        "running": {
            "distance_km": 1.2,
            "duration_min": 15,
        },

        "cycling": {
            "distance_km": 5.0,
            "duration_min": 20,
        },

        "swimming": {
            "distance_m": 300,
            "duration_min": 20,
        },
    },


    "light": {

        "walking": {
            "distance_km": 2.5,
            "duration_min": 30,
        },

        "running": {
            "distance_km": 2.0,
            "duration_min": 20,
        },

        "cycling": {
            "distance_km": 8.0,
            "duration_min": 30,
        },

        "swimming": {
            "distance_m": 500,
            "duration_min": 25,
        },
    },


    "moderate": {

        "walking": {
            "distance_km": 3.5,
            "duration_min": 40,
        },

        "running": {
            "distance_km": 3.5,
            "duration_min": 30,
        },

        "cycling": {
            "distance_km": 12.0,
            "duration_min": 40,
        },

        "swimming": {
            "distance_m": 700,
            "duration_min": 35,
        },
    },


    "very_active": {

        "walking": {
            "distance_km": 5.0,
            "duration_min": 55,
        },

        "running": {
            "distance_km": 5.0,
            "duration_min": 40,
        },

        "cycling": {
            "distance_km": 18.0,
            "duration_min": 55,
        },

        "swimming": {
            "distance_m": 1000,
            "duration_min": 45,
        },
    },

}


# ------------------------------------------------------------
# QUALITY SESSION START
# ------------------------------------------------------------
#
# Higher-intensity interval/tempo work is introduced later
# for less-active starting lifestyles.
#
# ------------------------------------------------------------

QUALITY_START_WEEK = {

    "sedentary": 6,
    "light": 4,
    "moderate": 2,
    "very_active": 1,

}


# ============================================================
# TEMPLATE SELECTION
# ============================================================

def select_template(
    lifestyle,
    activity,
    week,
    variant,
):

    quality_week = (
        QUALITY_START_WEEK[
            lifestyle
        ]
    )


    # --------------------------------------------------------
    # Week 4 = consolidation
    # --------------------------------------------------------

    if week == 4:

        if activity == "walking":
            return "WALK_EASY"

        if activity == "running":

            if lifestyle == "sedentary":
                return "RUN_WALK"

            return "RUN_EASY"

        if activity == "cycling":
            return "CYCLE_EASY"

        if activity == "swimming":
            return "SWIM_TECHNIQUE"


    # --------------------------------------------------------
    # WALKING
    # --------------------------------------------------------

    if activity == "walking":

        if variant == "primary":

            if week <= 2:
                return "WALK_EASY"

            return "WALK_BRISK"


        if week >= quality_week:
            return "WALK_INTERVAL"

        return "WALK_BRISK"


    # --------------------------------------------------------
    # RUNNING
    # --------------------------------------------------------

    if activity == "running":

        if variant == "primary":

            if (
                lifestyle == "sedentary"
                and
                week <= 4
            ):
                return "RUN_WALK"


            if (
                lifestyle == "light"
                and
                week <= 2
            ):
                return "RUN_WALK"


            return "RUN_EASY"


        # Secondary session
        if week < quality_week:

            if lifestyle == "sedentary":
                return "RUN_WALK"

            return "RUN_EASY"


        # Alternate intervals and tempo
        if week % 2 == 1:

            return "RUN_INTERVAL"

        return "RUN_TEMPO"


    # --------------------------------------------------------
    # CYCLING
    # --------------------------------------------------------

    if activity == "cycling":

        if variant == "primary":

            if week <= 2:
                return "CYCLE_EASY"

            return "CYCLE_STEADY"


        if week >= quality_week:
            return "CYCLE_INTERVAL"

        return "CYCLE_STEADY"


    # --------------------------------------------------------
    # SWIMMING
    # --------------------------------------------------------

    if activity == "swimming":

        if variant == "primary":

            if week <= 2:
                return "SWIM_EASY"

            return "SWIM_TECHNIQUE"


        if week >= quality_week:
            return "SWIM_INTERVAL"

        return "SWIM_TECHNIQUE"


    raise ValueError(
        f"Unknown activity: {activity}"
    )


# ============================================================
# INTERVAL CONFIG
# ============================================================

def interval_config(
    lifestyle,
    activity,
    week,
    template_id,
):

    if "INTERVAL" not in template_id:

        return (
            None,
            None,
            None,
        )


    base_counts = {

        "sedentary": 4,
        "light": 5,
        "moderate": 6,
        "very_active": 8,

    }


    interval_count = (
        base_counts[
            lifestyle
        ]
        +
        max(
            0,
            (week - 5) // 2,
        )
    )


    # --------------------------------------------------------
    # Walking
    # --------------------------------------------------------

    if activity == "walking":

        return (
            interval_count,
            120,
            120,
        )


    # --------------------------------------------------------
    # Running
    # --------------------------------------------------------

    if activity == "running":

        work = {

            "sedentary": 45,
            "light": 60,
            "moderate": 75,
            "very_active": 90,

        }[lifestyle]


        recovery = {

            "sedentary": 90,
            "light": 90,
            "moderate": 75,
            "very_active": 60,

        }[lifestyle]


        return (
            interval_count,
            work,
            recovery,
        )


    # --------------------------------------------------------
    # Cycling
    # --------------------------------------------------------

    if activity == "cycling":

        return (
            interval_count,
            90,
            120,
        )


    # --------------------------------------------------------
    # Swimming
    # --------------------------------------------------------
    #
    # Swimming intervals are better represented by repeated
    # lengths/distance, so work_interval_sec stays blank.
    #
    # --------------------------------------------------------

    if activity == "swimming":

        recovery = {

            "sedentary": 60,
            "light": 45,
            "moderate": 40,
            "very_active": 30,

        }[lifestyle]


        return (
            interval_count,
            None,
            recovery,
        )


# ============================================================
# STRENGTH 8-WEEK RULES
# ============================================================
#
# recommended_variation_level is NOT automatically forced.
#
# Later engine:
#
# completion / ability
#       ↓
# decide whether variation increases
#
# ============================================================

STRENGTH_RULES = {

    "sedentary": [

        (2, 6, 75, 1, "easy"),
        (2, 8, 75, 1, "easy"),
        (2, 10, 75, 1, "easy"),

        # consolidation
        (2, 8, 75, 1, "easy"),

        (3, 8, 75, 1, "moderate"),
        (3, 10, 70, 1, "moderate"),
        (3, 8, 70, 2, "moderate"),
        (3, 10, 65, 2, "moderate"),

    ],


    "light": [

        (2, 8, 70, 1, "easy"),
        (2, 10, 70, 1, "moderate"),
        (3, 8, 70, 1, "moderate"),

        # consolidation
        (2, 8, 75, 1, "easy"),

        (3, 10, 65, 1, "moderate"),
        (3, 12, 65, 1, "moderate"),
        (3, 8, 65, 2, "moderate"),
        (3, 10, 60, 2, "moderate"),

    ],


    "moderate": [

        (3, 8, 65, 2, "moderate"),
        (3, 10, 65, 2, "moderate"),
        (3, 12, 60, 2, "moderate"),

        # consolidation
        (2, 10, 70, 2, "easy"),

        (4, 8, 65, 2, "moderate"),
        (4, 10, 60, 2, "moderate"),
        (3, 8, 60, 3, "moderate"),
        (3, 10, 60, 3, "moderate"),

    ],


    "very_active": [

        (3, 10, 60, 2, "moderate"),
        (3, 12, 60, 2, "moderate"),
        (4, 10, 60, 2, "moderate"),

        # consolidation
        (3, 8, 70, 2, "easy"),

        (4, 10, 55, 3, "moderate"),
        (4, 12, 55, 3, "moderate"),
        (4, 10, 50, 3, "moderate_hard"),
        (4, 12, 50, 3, "moderate_hard"),

    ],

}


# ============================================================
# GENERATE PROGRESSION RULES
# ============================================================

progression_rules = []

rule_counter = 1


for lifestyle in [

    "sedentary",
    "light",
    "moderate",
    "very_active",

]:

    for week in range(
        1,
        9,
    ):

        # ====================================================
        # STRENGTH
        # ====================================================

        (
            sets,
            reps,
            rest_seconds,
            variation_level,
            strength_intensity,

        ) = STRENGTH_RULES[
            lifestyle
        ][
            week - 1
        ]


        progression_rules.append({

            "rule_id":
                f"PR{rule_counter:04d}",

            "lifestyle":
                lifestyle,

            "week_number":
                week,

            "activity_id":
                "strength",

            "session_variant":
                "strength",

            "template_id":
                "STRENGTH_FULL_BODY",

            "sets":
                sets,

            "reps":
                reps,

            "rest_seconds":
                rest_seconds,

            "recommended_variation_level":
                variation_level,

            "distance_km":
                None,

            "distance_m":
                None,

            "duration_min":
                None,

            "interval_count":
                None,

            "work_interval_sec":
                None,

            "recovery_interval_sec":
                None,

            "intensity":
                strength_intensity,

            "advance_if_completion_pct":
                80,

            "progression_note":
                (
                    "Consolidation week: reduce volume and "
                    "focus on technique."
                    if week == 4
                    else
                    "Progress only when the previous workload "
                    "can be completed with controlled form."
                ),

        })


        rule_counter += 1


        # ====================================================
        # CARDIO ACTIVITIES
        # ====================================================

        for activity in [

            "walking",
            "running",
            "cycling",
            "swimming",

        ]:

            baseline = (
                CARDIO_BASELINES[
                    lifestyle
                ][
                    activity
                ]
            )


            multiplier = (
                WEEK_MULTIPLIERS[
                    week
                ]
            )


            for variant in [

                "primary",
                "secondary",

            ]:

                template_id = (
                    select_template(

                        lifestyle,
                        activity,
                        week,
                        variant,

                    )
                )


                variant_factor = 1.0

                duration = round(

                    baseline[
                        "duration_min"
                    ]
                    *
                    multiplier
                    *
                    variant_factor

                )


                distance_km = None
                distance_m = None


                if "distance_km" in baseline:

                    distance_km = round(

                        baseline[
                            "distance_km"
                        ]
                        *
                        multiplier
                        *
                        variant_factor,

                        1,

                    )


                if "distance_m" in baseline:

                    distance_m = round(

                        baseline[
                            "distance_m"
                        ]
                        *
                        multiplier
                        *
                        variant_factor
                        /
                        25

                    ) * 25


                (
                    interval_count,
                    work_interval_sec,
                    recovery_interval_sec,

                ) = interval_config(

                    lifestyle,
                    activity,
                    week,
                    template_id,

                )


                # --------------------------------------------
                # Intensity from template
                # --------------------------------------------

                template_lookup = {

                    row["template_id"]:
                        row

                    for row in workout_templates

                }


                intensity = (
                    template_lookup[
                        template_id
                    ][
                        "intensity_default"
                    ]
                )


                progression_rules.append({

                    "rule_id":
                        f"PR{rule_counter:04d}",

                    "lifestyle":
                        lifestyle,

                    "week_number":
                        week,

                    "activity_id":
                        activity,

                    "session_variant":
                        variant,

                    "template_id":
                        template_id,

                    "sets":
                        None,

                    "reps":
                        None,

                    "rest_seconds":
                        None,

                    "recommended_variation_level":
                        None,

                    "distance_km":
                        distance_km,

                    "distance_m":
                        distance_m,

                    "duration_min":
                        duration,

                    "interval_count":
                        interval_count,

                    "work_interval_sec":
                        work_interval_sec,

                    "recovery_interval_sec":
                        recovery_interval_sec,

                    "intensity":
                        intensity,

                    "advance_if_completion_pct":
                        80,

                    "progression_note":
                        (
                            "Consolidation week: lower total "
                            "workload and prioritize recovery."
                            if week == 4
                            else
                            "Progress gradually while keeping "
                            "the prescribed session controlled."
                        ),

                })


                rule_counter += 1


# ============================================================
# VALIDATION
# ============================================================


# ------------------------------------------------------------
# Activities
# ------------------------------------------------------------

assert len(activities) == 5


selectable = [

    row
    for row in activities
    if row[
        "selectable_in_onboarding"
    ]

]


assert len(selectable) == 4


strength = [

    row
    for row in activities
    if row["activity_id"]
    == "strength"

][0]


assert (
    strength[
        "minimum_sessions_per_week"
    ]
    == 2
)


assert (
    strength[
        "selectable_in_onboarding"
    ]
    is False
)


# ------------------------------------------------------------
# Exercise variations
# ------------------------------------------------------------

assert len(
    exercise_variations
) == 15


families = {

    row["exercise_family"]

    for row in exercise_variations

}


assert families == {

    "squat",
    "lunge",
    "pushup",
    "bicep_curl",
    "supported_row",

}


# ------------------------------------------------------------
# Strength session
# ------------------------------------------------------------

assert len(
    strength_session_items
) == 5


# ------------------------------------------------------------
# Schedule
# ------------------------------------------------------------

assert len(
    lifestyle_schedule_rules
) == 32


for row in lifestyle_schedule_rules:

    assert (
        row["strength_sessions"]
        == 2
    )

    assert (
        row["active_days_target"]
        <= 6
    )

    assert (
        row["active_days_target"]
        >= 3
    )


# ------------------------------------------------------------
# Progression
#
# Strength:
# 4 lifestyles × 8 weeks = 32
#
# Cardio:
# 4 lifestyles
# × 8 weeks
# × 4 activities
# × 2 variants
# = 256
#
# TOTAL = 288
# ------------------------------------------------------------

assert len(
    progression_rules
) == 288


# ------------------------------------------------------------
# Unique IDs
# ------------------------------------------------------------

rule_ids = [

    row["rule_id"]

    for row in progression_rules

]


assert (
    len(rule_ids)
    ==
    len(set(rule_ids))
)


# ------------------------------------------------------------
# Every template referenced must exist
# ------------------------------------------------------------

template_ids = {

    row["template_id"]

    for row in workout_templates

}


for row in progression_rules:

    assert (
        row["template_id"]
        in template_ids
    )


# ------------------------------------------------------------
# Exactly 8 weeks per lifestyle
# ------------------------------------------------------------

for lifestyle in [

    "sedentary",
    "light",
    "moderate",
    "very_active",

]:

    weeks = {

        row["week_number"]

        for row in progression_rules

        if row["lifestyle"]
        == lifestyle

    }


    assert weeks == set(
        range(
            1,
            9,
        )
    )


# ============================================================
# WRITE FILES
# ============================================================


write_csv(

    ACTIVITIES_PATH,

    activities,

    [
        "activity_id",
        "activity_name",
        "selectable_in_onboarding",
        "mandatory",
        "minimum_sessions_per_week",
        "primary_metrics",
        "description",
    ],

)


write_csv(

    TEMPLATES_PATH,

    workout_templates,

    [
        "template_id",
        "activity_id",
        "session_type",
        "title",
        "intensity_default",
        "warmup_description",
        "main_description",
        "cooldown_description",
    ],

)


write_csv(

    VARIATIONS_PATH,

    exercise_variations,

    [
        "variation_id",
        "exercise_family",
        "variation_name",
        "difficulty_level",
        "equipment",
        "description",
        "form_cues",
    ],

)


write_csv(

    STRENGTH_ITEMS_PATH,

    strength_session_items,

    [
        "session_template_id",
        "exercise_order",
        "exercise_family",
        "rep_mode",
    ],

)


write_csv(

    SCHEDULE_RULES_PATH,

    lifestyle_schedule_rules,

    [
        "lifestyle",
        "week_number",
        "active_days_target",
        "strength_sessions",
        "preferred_activity_sessions",
        "rest_days_target",
        "is_consolidation_week",
    ],

)


write_csv(

    PROGRESSION_PATH,

    progression_rules,

    [
        "rule_id",
        "lifestyle",
        "week_number",
        "activity_id",
        "session_variant",
        "template_id",
        "sets",
        "reps",
        "rest_seconds",
        "recommended_variation_level",
        "distance_km",
        "distance_m",
        "duration_min",
        "interval_count",
        "work_interval_sec",
        "recovery_interval_sec",
        "intensity",
        "advance_if_completion_pct",
        "progression_note",
    ],

)


# ============================================================
# REPORT
# ============================================================

print()

print("=" * 72)

print(
    "WORKOUT DATABASE CREATED"
)

print("=" * 72)


print()

print(
    "Activities:",
    len(activities),
)

print(
    "Workout templates:",
    len(workout_templates),
)

print(
    "Exercise variations:",
    len(exercise_variations),
)

print(
    "Strength session items:",
    len(strength_session_items),
)

print(
    "Lifestyle schedule rules:",
    len(lifestyle_schedule_rules),
)

print(
    "Progression rules:",
    len(progression_rules),
)


print()

print(
    "Output folder:",
    OUTPUT_DIR,
)


print()

print(
    "Strength sessions/week: 2"
)

print(
    "Onboarding preference activities: 4"
)

print(
    "Progression length: 8 weeks"
)

print(
    "Week 4: consolidation week"
)


print()

print("=" * 72)

print(
    "WORKOUT DATA LAYER READY"
)

print("=" * 72)