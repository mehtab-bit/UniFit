from pathlib import Path
import re
import pandas as pd


# ============================================================
# PATHS
# ============================================================

INPUT_PATH = Path(
    "data/processed/foods_100_nutrition.csv"
)

OUTPUT_PATH = Path(
    "data/processed/foods_100_final.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(INPUT_PATH)


if len(df) != 100:
    raise ValueError(
        f"Expected exactly 100 foods. Found {len(df)}."
    )


if df["food_code"].duplicated().any():
    raise ValueError(
        "Duplicate food codes found."
    )


print("Input foods:", len(df))


# ============================================================
# CLEAN USER-FACING FOOD NAME
# ============================================================
#
# IFCT names often look like:
#
#   Quinoa (Chenopodium quinoa)
#   Spinach (Spinacia oleracea)
#
# App users only need:
#
#   Quinoa
#   Spinach
#
# We keep the original IFCT name separately.
# ============================================================

df["source_food_name"] = df["food_name"]


def clean_display_name(name):

    name = str(name).strip()

    # Remove the final scientific-name parentheses.
    name = re.sub(
        r"\s*\([^()]*\)\s*$",
        "",
        name,
    )

    # Clean repeated spaces.
    name = re.sub(
        r"\s+",
        " ",
        name,
    )

    return name.strip()


df["display_name"] = (
    df["food_name"]
    .apply(clean_display_name)
)


# ============================================================
# DIET CLASS
# ============================================================
#
# This represents the MOST RESTRICTIVE diet category
# the food belongs to.
#
# vegan food:
#     vegan + vegetarian + egg + nonveg users can eat it
#
# vegetarian food:
#     vegetarian + egg + nonveg
#
# eggetarian:
#     egg + nonveg
#
# non_vegetarian:
#     nonveg only
#
# ============================================================

def determine_diet_class(row):

    if bool(row["vegan_ok"]):
        return "vegan"

    if bool(row["vegetarian_ok"]):
        return "vegetarian"

    if bool(row["eggetarian_ok"]):
        return "eggetarian"

    return "non_vegetarian"


df["diet_class"] = df.apply(
    determine_diet_class,
    axis=1,
)


# ============================================================
# INGREDIENT CONTENT FLAGS
# ============================================================

df["contains_dairy"] = (
    df["food_group"] == "dairy"
)

df["contains_egg"] = (
    df["food_group"] == "egg"
)

df["contains_meat"] = (
    df["food_group"].isin(
        [
            "poultry",
            "meat",
        ]
    )
)

df["contains_fish"] = (
    df["food_group"].isin(
        [
            "fish",
            "seafood",
            "fish_seafood",
        ]
    )
)


# ============================================================
# MEAL SUITABILITY
# ============================================================
#
# These are NOT recipes yet.
#
# They simply tell the future meal generator whether an
# ingredient is sensible for a meal slot.
# ============================================================

BREAKFAST_GROUPS = {

    "grain",
    "legume",
    "fruit",
    "nuts_seeds",
    "dairy",
    "egg",
    "beverage",
}


LUNCH_GROUPS = {

    "grain",
    "legume",
    "leafy_vegetable",
    "vegetable",
    "root_tuber",
    "mushroom",
    "dairy",
    "egg",
    "poultry",
    "meat",
    "fish",
    "seafood",
    "fish_seafood",
}


SNACK_GROUPS = {

    "legume",
    "fruit",
    "nuts_seeds",
    "dairy",
    "egg",
    "beverage",
}


DINNER_GROUPS = {

    "grain",
    "legume",
    "leafy_vegetable",
    "vegetable",
    "root_tuber",
    "mushroom",
    "dairy",
    "egg",
    "poultry",
    "meat",
    "fish",
    "seafood",
    "fish_seafood",
}


df["breakfast_ok"] = (
    df["food_group"].isin(
        BREAKFAST_GROUPS
    )
)

df["lunch_ok"] = (
    df["food_group"].isin(
        LUNCH_GROUPS
    )
)

df["snack_ok"] = (
    df["food_group"].isin(
        SNACK_GROUPS
    )
)

df["dinner_ok"] = (
    df["food_group"].isin(
        DINNER_GROUPS
    )
)


# ============================================================
# INGREDIENT-ONLY FOODS
# ============================================================
#
# Garlic, ginger, onion etc. are recipe ingredients,
# rather than meals on their own.
# ============================================================

df["ingredient_only"] = (
    df["food_group"]
    == "recipe_ingredient"
)


# ============================================================
# PROTEIN DENSITY
# ============================================================
#
# Useful later when the meal planner tries to meet a protein
# target without overshooting calories.
#
# Example:
#
# protein_density = grams protein per 100 kcal
# ============================================================

df["protein_per_100kcal"] = (

    df["protein_g"]
    /
    df["energy_kcal"]
    *
    100

).round(2)


# ============================================================
# PROTEIN LEVEL
# ============================================================
#
# This is planner metadata, not an IFCT nutrient.
#
# We use protein per 100 kcal because it is more useful for
# fitness meal planning than just protein per 100 grams.
# ============================================================

def protein_level(value):

    if pd.isna(value):
        return "unknown"

    if value >= 10:
        return "high"

    if value >= 5:
        return "moderate"

    return "low"


df["protein_level"] = (
    df["protein_per_100kcal"]
    .apply(protein_level)
)


# ============================================================
# ACTIVE FLAG
# ============================================================
#
# Allows us to disable a food later without deleting it from
# Supabase.
# ============================================================

df["is_active"] = True


# ============================================================
# DATA SOURCE
# ============================================================

df["nutrition_source"] = "IFCT 2017"


# ============================================================
# VALIDATE DIET HIERARCHY
# ============================================================

errors = []


for _, row in df.iterrows():

    code = row["food_code"]

    # Vegan must also be accepted by every broader profile.
    if row["vegan_ok"]:

        if not (
            row["vegetarian_ok"]
            and row["eggetarian_ok"]
            and row["nonveg_ok"]
        ):

            errors.append(
                f"{code}: invalid vegan hierarchy"
            )


    # Vegetarian must be accepted by egg/nonveg users.
    if row["vegetarian_ok"]:

        if not (
            row["eggetarian_ok"]
            and row["nonveg_ok"]
        ):

            errors.append(
                f"{code}: invalid vegetarian hierarchy"
            )


    # Eggetarian must also be accepted by nonveg.
    if row["eggetarian_ok"]:

        if not row["nonveg_ok"]:

            errors.append(
                f"{code}: invalid eggetarian hierarchy"
            )


if errors:

    raise ValueError(
        "\n".join(errors)
    )


# ============================================================
# VALIDATE ESSENTIAL NUTRITION
# ============================================================

ESSENTIAL_COLUMNS = [

    "food_code",
    "display_name",
    "food_group",
    "food_role",
    "diet_class",

    "energy_kcal",
    "protein_g",
    "fat_g",
]


for column in ESSENTIAL_COLUMNS:

    missing = df[column].isna().sum()

    if missing:

        raise ValueError(
            f"{column} contains "
            f"{missing} missing values."
        )


# ============================================================
# VALIDATE NUTRIENT STATUS
# ============================================================

if (
    df["carbohydrate_status"]
    .isna()
    .any()
):

    raise ValueError(
        "Missing carbohydrate status."
    )


if (
    df["fiber_status"]
    .isna()
    .any()
):

    raise ValueError(
        "Missing fibre status."
    )


# ============================================================
# FINAL COLUMN ORDER
# ============================================================

final = df[[

    # --------------------------------------------------------
    # Identity
    # --------------------------------------------------------

    "food_code",
    "display_name",
    "source_food_name",

    # --------------------------------------------------------
    # Classification
    # --------------------------------------------------------

    "food_group",
    "food_role",
    "diet_class",

    # --------------------------------------------------------
    # Diet compatibility
    # --------------------------------------------------------

    "vegan_ok",
    "vegetarian_ok",
    "eggetarian_ok",
    "nonveg_ok",

    # --------------------------------------------------------
    # Ingredient flags
    # --------------------------------------------------------

    "contains_dairy",
    "contains_egg",
    "contains_meat",
    "contains_fish",

    # --------------------------------------------------------
    # Meal suitability
    # --------------------------------------------------------

    "breakfast_ok",
    "lunch_ok",
    "snack_ok",
    "dinner_ok",
    "ingredient_only",

    # --------------------------------------------------------
    # Nutrition per 100 g
    # --------------------------------------------------------

    "energy_kcal",
    "protein_g",
    "carbohydrate_g",
    "fat_g",
    "fiber_g",

    # --------------------------------------------------------
    # Nutrition metadata
    # --------------------------------------------------------

    "protein_per_100kcal",
    "protein_level",

    "carbohydrate_status",
    "fiber_status",

    # --------------------------------------------------------
    # Source / provenance
    # --------------------------------------------------------

    "regions",
    "source_page",
    "nutrition_source",

    # --------------------------------------------------------
    # App state
    # --------------------------------------------------------

    "is_active",

]].copy()


# ============================================================
# FINAL VALIDATION
# ============================================================

if len(final) != 100:

    raise ValueError(
        f"Final database should contain "
        f"100 foods, found {len(final)}."
    )


if (
    final["food_code"]
    .duplicated()
    .any()
):

    raise ValueError(
        "Final database contains duplicate codes."
    )


if (
    final["display_name"]
    .duplicated()
    .any()
):

    duplicates = final[
        final["display_name"]
        .duplicated(
            keep=False
        )
    ][
        [
            "food_code",
            "display_name",
        ]
    ]

    print()
    print(
        "WARNING: duplicate display names:"
    )

    print(
        duplicates.to_string(
            index=False
        )
    )


# ============================================================
# SAVE
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)


final.to_csv(
    OUTPUT_PATH,
    index=False,
)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)
print("FINAL FOOD DATABASE CREATED")
print("=" * 70)

print(
    "Rows:",
    len(final),
)

print(
    "Output:",
    OUTPUT_PATH,
)


# ------------------------------------------------------------
# DIET CLASS
# ------------------------------------------------------------

print()
print("Diet classes:")

print(
    final[
        "diet_class"
    ]
    .value_counts()
    .to_string()
)


# ------------------------------------------------------------
# DIET COMPATIBILITY
# ------------------------------------------------------------

print()
print("Compatibility:")

print(
    "Vegan:",
    int(
        final[
            "vegan_ok"
        ].sum()
    )
)

print(
    "Vegetarian:",
    int(
        final[
            "vegetarian_ok"
        ].sum()
    )
)

print(
    "Eggetarian:",
    int(
        final[
            "eggetarian_ok"
        ].sum()
    )
)

print(
    "Non-vegetarian:",
    int(
        final[
            "nonveg_ok"
        ].sum()
    )
)


# ------------------------------------------------------------
# MEAL SLOT COUNTS
# ------------------------------------------------------------

print()
print("Meal suitability:")

print(
    "Breakfast:",
    int(
        final[
            "breakfast_ok"
        ].sum()
    )
)

print(
    "Lunch:",
    int(
        final[
            "lunch_ok"
        ].sum()
    )
)

print(
    "Snack:",
    int(
        final[
            "snack_ok"
        ].sum()
    )
)

print(
    "Dinner:",
    int(
        final[
            "dinner_ok"
        ].sum()
    )
)


# ------------------------------------------------------------
# PROTEIN LEVELS
# ------------------------------------------------------------

print()
print("Protein levels:")

print(
    final[
        "protein_level"
    ]
    .value_counts()
    .to_string()
)


# ------------------------------------------------------------
# NULL NUTRIENTS
# ------------------------------------------------------------

print()
print(
    "Carbohydrate not reported:",
    int(
        final[
            "carbohydrate_g"
        ]
        .isna()
        .sum()
    )
)

print(
    "Fibre not reported:",
    int(
        final[
            "fiber_g"
        ]
        .isna()
        .sum()
    )
)


# ------------------------------------------------------------
# SAMPLE
# ------------------------------------------------------------

print()
print("Sample foods:")

print(
    final[
        [
            "food_code",
            "display_name",
            "diet_class",
            "food_role",
            "energy_kcal",
            "protein_g",
            "carbohydrate_g",
            "fat_g",
            "fiber_g",
        ]
    ]
    .head(15)
    .to_string(
        index=False
    )
)


print()
print("=" * 70)
print("DATABASE READY FOR FINAL REVIEW")
print("=" * 70)