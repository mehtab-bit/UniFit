from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

INPUT_PATH = Path("data/processed/ifct_proximate.csv")
OUTPUT_PATH = Path("data/processed/foods_100_curated.csv")


# ============================================================
# LOAD OUR 527-FOOD SOURCE DATASET
# ============================================================

df = pd.read_csv(INPUT_PATH)

print("IFCT source foods:", len(df))


# ============================================================
# CURATED 100 FOOD CODES
#
# These were chosen for our FITNESS MEAL-PLANNER prototype.
# They are NOT simply the first 100 IFCT rows.
# ============================================================

SELECTED_CODES = [

    # ========================================================
    # 1. GRAINS / CEREALS — 14
    # ========================================================

    "A001",   # Amaranth seed
    "A003",   # Bajra
    "A004",   # Barley
    "A005",   # Jowar
    "A006",   # Maize
    "A008",   # Sweet maize
    "A009",   # Quinoa
    "A010",   # Ragi
    "A011",   # Rice flakes / poha
    "A013",   # Brown rice
    "A015",   # White rice
    "A019",   # Atta
    "A020",   # Whole wheat
    "A022",   # Semolina / suji


    # ========================================================
    # 2. LEGUMES / DALS — 14
    #
    # VERY IMPORTANT for vegan/vegetarian protein
    # ========================================================

    "B001",   # Bengal gram dal
    "B002",   # Bengal gram whole
    "B003",   # Black gram dal
    "B004",   # Black gram whole
    "B005",   # Cowpea
    "B010",   # Green gram dal
    "B011",   # Green gram whole
    "B012",   # Horse gram
    "B013",   # Lentil dal
    "B014",   # Lentil whole
    "B017",   # Dry peas
    "B020",   # Red rajma
    "B021",   # Toor / red gram dal
    "B025",   # Soybean


    # ========================================================
    # 3. GREEN LEAFY VEGETABLES — 7
    # ========================================================

    "C002",   # Amaranth leaves
    "C015",   # Green cabbage
    "C019",   # Drumstick leaves
    "C020",   # Fenugreek / methi
    "C025",   # Lettuce
    "C026",   # Mustard leaves
    "C033",   # Spinach


    # ========================================================
    # 4. VEGETABLES — 12
    # ========================================================

    "D004",   # Bitter gourd
    "D007",   # Bottle gourd
    "D031",   # Brinjal - all varieties
    "D033",   # Green capsicum
    "D036",   # Cauliflower
    "D043",   # Cucumber
    "D046",   # Drumstick
    "D049",   # French beans
    "D056",   # Ladies finger
    "D061",   # Fresh peas
    "D066",   # Pumpkin
    "D076",   # Tomato


    # ========================================================
    # 5. FRUITS — 10
    # ========================================================

    "E001",   # Apple
    "E012",   # Banana
    "E021",   # Amla / gooseberry
    "E028",   # Guava
    "E033",   # Lemon
    "E039",   # Mango
    "E047",   # Orange
    "E049",   # Papaya
    "E055",   # Pomegranate
    "E065",   # Watermelon


    # ========================================================
    # 6. ROOTS / TUBERS — 6
    # ========================================================

    "F001",   # Beetroot
    "F002",   # Carrot
    "F006",   # Potato
    "F010",   # Radish
    "F013",   # Sweet potato
    "F017",   # Elephant yam


    # ========================================================
    # 7. BASIC RECIPE INGREDIENTS — 3
    # ========================================================

    "G011",   # Garlic
    "G014",   # Ginger
    "G017",   # Onion


    # ========================================================
    # 8. NUTS / SEEDS — 9
    #
    # Useful for healthy fats + plant protein + snacks
    # ========================================================

    "H001",   # Almond
    "H005",   # Cashew
    "H007",   # Fresh coconut
    "H008",   # Garden cress seeds
    "H011",   # Sesame
    "H012",   # Groundnut / peanut
    "H014",   # Flaxseed
    "H018",   # Pistachio
    "H021",   # Walnut


    # ========================================================
    # 9. MUSHROOM / BEVERAGE — 2
    # ========================================================

    "J001",   # Button mushroom
    "K002",   # Coconut water


    # ========================================================
    # 10. DAIRY — 3
    # ========================================================

    "L001",   # Buffalo milk
    "L002",   # Cow milk
    "L003",   # Paneer


    # ========================================================
    # 11. EGGS — 3
    # ========================================================

    "M004",   # Whole boiled egg
    "M005",   # Boiled egg white
    "M007",   # Omelette


    # ========================================================
    # 12. CHICKEN — 4
    # ========================================================

    "N002",   # Chicken thigh skinless
    "N003",   # Chicken breast skinless
    "N005",   # Chicken liver
    "N006",   # Chicken gizzard


    # ========================================================
    # 13. GOAT — 1
    # ========================================================

    "O003",   # Goat leg


    # ========================================================
    # 14. FISH — 8
    # ========================================================

    "P003",   # Anchovy
    "P034",   # Mackerel
    "P055",   # Black pomfret
    "P068",   # Salmon
    "P071",   # Sardine
    "P083",   # Tilapia
    "P084",   # Tuna
    "P087",   # Vanjaram


    # ========================================================
    # 15. SEAFOOD / FRESHWATER — 4
    # ========================================================

    "Q002",   # Sea crab
    "S002",   # Catla
    "S006",   # Rohu
    "S008",   # Big prawns
]


# ============================================================
# VALIDATION #1
# EXACTLY 100 FOODS
# ============================================================

if len(SELECTED_CODES) != 100:
    raise ValueError(
        f"Selection must contain exactly 100 foods. "
        f"Current count: {len(SELECTED_CODES)}"
    )


# ============================================================
# VALIDATION #2
# NO DUPLICATE SELECTED CODES
# ============================================================

if len(set(SELECTED_CODES)) != 100:
    raise ValueError("Duplicate food codes exist in SELECTED_CODES.")


# ============================================================
# VALIDATION #3
# ALL CODES MUST EXIST IN OUR 527-FOOD DATASET
# ============================================================

available_codes = set(df["food_code"])

missing_codes = [
    code
    for code in SELECTED_CODES
    if code not in available_codes
]

if missing_codes:
    raise ValueError(
        f"Selected codes missing from IFCT extraction: "
        f"{missing_codes}"
    )


# ============================================================
# FILTER TO OUR 100 FOODS
# ============================================================

foods = df[
    df["food_code"].isin(SELECTED_CODES)
].copy()


# Preserve the order listed above.
order = {
    code: index
    for index, code in enumerate(SELECTED_CODES)
}

foods["selection_order"] = foods["food_code"].map(order)

foods = foods.sort_values("selection_order")

foods = foods.drop(columns=["selection_order"])


# ============================================================
# CONVERT ENERGY kJ -> kcal
#
# 1 kcal = 4.184 kJ
# ============================================================

foods["energy_kcal"] = (
    foods["energy_kj"] / 4.184
).round(1)


# ============================================================
# FOOD GROUP
# ============================================================

GROUP_MAP = {

    "A": "grain",
    "B": "legume",
    "C": "leafy_vegetable",
    "D": "vegetable",
    "E": "fruit",
    "F": "root_tuber",
    "G": "recipe_ingredient",
    "H": "nuts_seeds",
    "I": "sweetener",
    "J": "mushroom",
    "K": "beverage",
    "L": "dairy",
    "M": "egg",
    "N": "poultry",
    "O": "meat",
    "P": "fish",
    "Q": "seafood",
    "R": "seafood",
    "S": "fish_seafood",
}

foods["food_group"] = (
    foods["food_code"]
    .str[0]
    .map(GROUP_MAP)
)


# ============================================================
# DIET COMPATIBILITY
#
# This is better than making four separate databases.
# ============================================================

foods["vegan_ok"] = True
foods["vegetarian_ok"] = True
foods["eggetarian_ok"] = True
foods["nonveg_ok"] = True


# Dairy is NOT vegan.
dairy_mask = foods["food_group"] == "dairy"

foods.loc[
    dairy_mask,
    "vegan_ok"
] = False


# Egg is only for eggetarian + nonveg.
egg_mask = foods["food_group"] == "egg"

foods.loc[
    egg_mask,
    ["vegan_ok", "vegetarian_ok"]
] = False


# Meat/fish is only for nonveg.
animal_groups = [
    "poultry",
    "meat",
    "fish",
    "seafood",
    "fish_seafood",
]

animal_mask = foods["food_group"].isin(animal_groups)

foods.loc[
    animal_mask,
    [
        "vegan_ok",
        "vegetarian_ok",
        "eggetarian_ok",
    ]
] = False


# ============================================================
# FOOD ROLE
#
# Helps the future meal planner understand WHY a food exists.
# ============================================================

ROLE_MAP = {

    "grain": "carb_source",
    "legume": "plant_protein",
    "leafy_vegetable": "vegetable",
    "vegetable": "vegetable",
    "fruit": "fruit",
    "root_tuber": "carb_vegetable",
    "recipe_ingredient": "ingredient",
    "nuts_seeds": "protein_healthy_fat",
    "mushroom": "vegetable",
    "beverage": "beverage",
    "dairy": "dairy_protein",
    "egg": "egg_protein",
    "poultry": "animal_protein",
    "meat": "animal_protein",
    "fish": "animal_protein",
    "seafood": "animal_protein",
    "fish_seafood": "animal_protein",
}

foods["food_role"] = foods["food_group"].map(ROLE_MAP)


# ============================================================
# PROTEIN SOURCE FLAG
#
# We do NOT call foods simply healthy/unhealthy.
# ============================================================

protein_roles = [
    "plant_protein",
    "protein_healthy_fat",
    "dairy_protein",
    "egg_protein",
    "animal_protein",
]

foods["is_protein_source"] = (
    foods["food_role"]
    .isin(protein_roles)
)


# ============================================================
# SANITY CHECK ENERGY
#
# Protein and fat alone create a minimum possible energy:
#
# protein = 4 kcal/g
# fat     = 9 kcal/g
#
# Actual food energy should not be LOWER than this by a
# large amount.
#
# This helps us find extraction/source anomalies.
# ============================================================

foods["minimum_macro_kcal"] = (
    foods["protein_g"] * 4
    +
    foods["fat_g"] * 9
).round(1)


foods["nutrition_needs_review"] = (
    foods["energy_kcal"]
    <
    foods["minimum_macro_kcal"] * 0.85
)


# ============================================================
# SOURCE
# ============================================================

foods["nutrition_source"] = "IFCT 2017"


# ============================================================
# FINAL COLUMN ORDER
# ============================================================

foods = foods[[
    "food_code",
    "food_name",
    "food_group",
    "food_role",

    "vegan_ok",
    "vegetarian_ok",
    "eggetarian_ok",
    "nonveg_ok",

    "is_protein_source",

    "energy_kcal",
    "energy_kj",
    "protein_g",
    "fat_g",
    "moisture_g",
    "ash_g",

    "minimum_macro_kcal",
    "nutrition_needs_review",

    "regions",
    "source_page",
    "nutrition_source",
]]


# ============================================================
# FINAL VALIDATION
# ============================================================

if len(foods) != 100:
    raise ValueError(
        f"Expected 100 final foods. Got {len(foods)}."
    )

if foods["food_code"].duplicated().any():
    raise ValueError("Duplicate food codes in curated dataset.")

if foods["food_name"].isna().any():
    raise ValueError("Missing food names.")

if foods["protein_g"].isna().any():
    raise ValueError("Missing protein values.")


# ============================================================
# SAVE
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

foods.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)
print("CURATION COMPLETE")
print("=" * 70)

print("Final foods:", len(foods))
print("Saved to:", OUTPUT_PATH)


print()
print("Food groups:")
print(
    foods["food_group"]
    .value_counts()
    .to_string()
)


print()
print("Diet compatibility:")

print(
    "Vegan options:",
    int(foods["vegan_ok"].sum())
)

print(
    "Vegetarian options:",
    int(foods["vegetarian_ok"].sum())
)

print(
    "Eggetarian options:",
    int(foods["eggetarian_ok"].sum())
)

print(
    "Non-veg options:",
    int(foods["nonveg_ok"].sum())
)


print()
print("Protein sources:")
print(
    int(foods["is_protein_source"].sum())
)


print()
print("Nutrition rows requiring manual review:")

review = foods[
    foods["nutrition_needs_review"]
]

if review.empty:
    print("None")
else:
    print(
        review[
            [
                "food_code",
                "food_name",
                "energy_kcal",
                "protein_g",
                "fat_g",
                "minimum_macro_kcal",
            ]
        ]
        .to_string(index=False)
    )


print()
print("=" * 70)
print("DONE")
print("=" * 70)