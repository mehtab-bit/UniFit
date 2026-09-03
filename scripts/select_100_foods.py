from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

INPUT_PATH = Path("data/processed/ifct_proximate.csv")
OUTPUT_PATH = Path("data/processed/foods_100.csv")


# ============================================================
# LOAD FULL IFCT EXTRACTION
# ============================================================

df = pd.read_csv(INPUT_PATH)

print("Source foods:", len(df))


# ============================================================
# OUR CURATED 100-FOOD PROTOTYPE LIST
# ============================================================

SELECTED_CODES = [

    # --------------------------------------------------------
    # CEREALS / GRAINS — 13
    # --------------------------------------------------------

    "A003",  # Bajra
    "A004",  # Barley
    "A005",  # Jowar
    "A008",  # Sweet maize
    "A009",  # Quinoa
    "A010",  # Ragi
    "A011",  # Rice flakes / poha
    "A013",  # Brown rice
    "A014",  # Parboiled rice
    "A015",  # White rice
    "A019",  # Atta
    "A020",  # Whole wheat
    "A022",  # Semolina / suji

    # --------------------------------------------------------
    # PULSES / LEGUMES — 12
    # --------------------------------------------------------

    "B001",  # Bengal gram dal
    "B002",  # Bengal gram whole
    "B003",  # Black gram dal
    "B005",  # Cowpea
    "B010",  # Green gram dal
    "B011",  # Green gram whole
    "B012",  # Horse gram
    "B013",  # Lentil dal
    "B017",  # Dry peas
    "B020",  # Red rajma
    "B021",  # Red gram / toor dal
    "B025",  # Soybean

    # --------------------------------------------------------
    # GREEN LEAFY VEGETABLES — 8
    # --------------------------------------------------------

    "C002",  # Amaranth leaves
    "C008",  # Bathua
    "C015",  # Cabbage
    "C019",  # Drumstick leaves
    "C020",  # Fenugreek leaves
    "C025",  # Lettuce
    "C026",  # Mustard leaves
    "C033",  # Spinach

    # --------------------------------------------------------
    # OTHER VEGETABLES — 12
    # --------------------------------------------------------

    "D004",  # Bitter gourd
    "D007",  # Bottle gourd
    "D031",  # Brinjal
    "D033",  # Capsicum
    "D036",  # Cauliflower
    "D043",  # Cucumber
    "D046",  # Drumstick
    "D049",  # French beans
    "D056",  # Ladies finger / okra
    "D061",  # Fresh peas
    "D066",  # Pumpkin
    "D076",  # Tomato

    # --------------------------------------------------------
    # FRUITS — 10
    # --------------------------------------------------------

    "E001",  # Apple
    "E012",  # Banana
    "E021",  # Amla
    "E028",  # Guava
    "E033",  # Lemon
    "E039",  # Mango
    "E047",  # Orange
    "E049",  # Papaya
    "E055",  # Pomegranate
    "E065",  # Watermelon

    # --------------------------------------------------------
    # ROOTS / TUBERS — 6
    # --------------------------------------------------------

    "F001",  # Beetroot
    "F002",  # Carrot
    "F006",  # Potato
    "F010",  # Radish
    "F013",  # Sweet potato
    "F017",  # Elephant yam

    # --------------------------------------------------------
    # HERBS / BASIC COOKING INGREDIENTS — 6
    # --------------------------------------------------------

    "G009",  # Coriander
    "G010",  # Curry leaves
    "G011",  # Garlic
    "G014",  # Ginger
    "G017",  # Onion
    "G033",  # Turmeric

    # --------------------------------------------------------
    # NUTS / SEEDS — 8
    # --------------------------------------------------------

    "H001",  # Almond
    "H005",  # Cashew
    "H007",  # Fresh coconut
    "H011",  # Sesame
    "H012",  # Groundnut
    "H014",  # Flaxseed
    "H020",  # Sunflower seeds
    "H021",  # Walnut

    # --------------------------------------------------------
    # MUSHROOM / DRINK — 3
    # --------------------------------------------------------

    "J001",  # Button mushroom
    "J003",  # Shiitake mushroom
    "K002",  # Coconut water

    # --------------------------------------------------------
    # DAIRY — 3
    # --------------------------------------------------------

    "L001",  # Buffalo milk
    "L002",  # Cow milk
    "L003",  # Paneer

    # --------------------------------------------------------
    # EGGS — 3
    # --------------------------------------------------------

    "M004",  # Whole boiled egg
    "M005",  # Boiled egg white
    "M007",  # Omelette

    # --------------------------------------------------------
    # CHICKEN — 4
    # --------------------------------------------------------

    "N001",  # Chicken leg skinless
    "N002",  # Chicken thigh skinless
    "N003",  # Chicken breast skinless
    "N005",  # Chicken liver

    # --------------------------------------------------------
    # GOAT / MEAT — 3
    # --------------------------------------------------------

    "O002",  # Goat chops
    "O003",  # Goat leg
    "O008",  # Goat liver

    # --------------------------------------------------------
    # SEA FISH — 6
    # --------------------------------------------------------

    "P003",  # Anchovy
    "P034",  # Mackerel
    "P055",  # Black pomfret
    "P068",  # Salmon
    "P071",  # Sardine
    "P084",  # Tuna

    # --------------------------------------------------------
    # FRESHWATER / SEAFOOD — 3
    # --------------------------------------------------------

    "S002",  # Catla
    "S006",  # Rohu
    "S008",  # Big prawns
]


# ============================================================
# VALIDATE OUR LIST
# ============================================================

assert len(SELECTED_CODES) == 100, (
    f"Expected 100 codes, got {len(SELECTED_CODES)}"
)

available_codes = set(df["food_code"])

missing_codes = [
    code
    for code in SELECTED_CODES
    if code not in available_codes
]

if missing_codes:
    raise ValueError(
        f"These selected codes are missing from IFCT CSV: "
        f"{missing_codes}"
    )


# ============================================================
# FILTER
# ============================================================

foods = df[
    df["food_code"].isin(SELECTED_CODES)
].copy()


# Preserve our chosen order.
order_map = {
    code: index
    for index, code in enumerate(SELECTED_CODES)
}

foods["sort_order"] = foods["food_code"].map(order_map)

foods = foods.sort_values("sort_order")

foods = foods.drop(columns=["sort_order"])


# ============================================================
# ADD KCAL
# ============================================================

foods["energy_kcal"] = (
    foods["energy_kj"] / 4.184
).round(1)


# ============================================================
# DIET CLASS
# ============================================================

def get_diet_class(code):

    prefix = code[0]

    # Plant foods
    if prefix in list("ABCDEFGHIJK"):
        return "vegan"

    # Dairy
    if prefix == "L":
        return "vegetarian"

    # Eggs
    if prefix == "M":
        return "egg"

    # Meat / fish
    if prefix in list("NOPQRS"):
        return "non_vegetarian"

    return "unknown"


foods["diet_class"] = foods["food_code"].apply(
    get_diet_class
)


# ============================================================
# FOOD ROLE
# ============================================================

ROLE_MAP = {

    "A": "grain",
    "B": "legume",
    "C": "leafy_vegetable",
    "D": "vegetable",
    "E": "fruit",
    "F": "root_tuber",
    "G": "herb_spice",
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


foods["food_role"] = foods["food_code"].str[0].map(
    ROLE_MAP
)


# ============================================================
# MEAL SLOT SUGGESTIONS
# ============================================================

def get_meal_slots(role):

    if role == "grain":
        return "breakfast,lunch,dinner"

    if role == "legume":
        return "breakfast,lunch,dinner,evening_snack"

    if role in [
        "leafy_vegetable",
        "vegetable",
        "root_tuber",
        "mushroom",
    ]:
        return "lunch,dinner"

    if role == "fruit":
        return "breakfast,evening_snack"

    if role == "nuts_seeds":
        return "breakfast,evening_snack"

    if role == "beverage":
        return "breakfast,evening_snack"

    if role == "dairy":
        return "breakfast,lunch,evening_snack,dinner"

    if role == "egg":
        return "breakfast,lunch,evening_snack,dinner"

    if role in [
        "poultry",
        "meat",
        "fish",
        "seafood",
        "fish_seafood",
    ]:
        return "lunch,dinner"

    if role == "herb_spice":
        return "ingredient"

    return "lunch,dinner"


foods["meal_slots"] = foods["food_role"].apply(
    get_meal_slots
)


# ============================================================
# PROTEIN DENSITY
# ============================================================

foods["protein_per_100kcal"] = (
    foods["protein_g"]
    / foods["energy_kcal"]
    * 100
).round(2)


# ============================================================
# FINAL COLUMN ORDER
# ============================================================

foods = foods[[
    "food_code",
    "food_name",

    "diet_class",
    "food_role",
    "meal_slots",

    "energy_kcal",
    "energy_kj",
    "protein_g",
    "fat_g",
    "moisture_g",
    "ash_g",

    "protein_per_100kcal",

    "regions",
    "source_page",
]]


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
print("100-FOOD PROTOTYPE DATABASE CREATED")
print("=" * 70)

print("Rows:", len(foods))
print("Saved to:", OUTPUT_PATH)

print()
print("Diet classes:")
print(
    foods["diet_class"]
    .value_counts()
    .to_string()
)

print()
print("Food roles:")
print(
    foods["food_role"]
    .value_counts()
    .to_string()
)

print()
print("Highest-protein foods per 100g:")

print(
    foods[
        [
            "food_code",
            "food_name",
            "diet_class",
            "protein_g",
            "energy_kcal",
        ]
    ]
    .sort_values(
        "protein_g",
        ascending=False
    )
    .head(15)
    .to_string(index=False)
)

print()
print("DONE")