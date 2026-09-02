from pathlib import Path
import csv


# ============================================================
# PATHS
# ============================================================

FOODS_PATH = Path(
    "data/processed/foods_100_final.csv"
)

MEALS_PATH = Path(
    "data/processed/meals.csv"
)

MEAL_ITEMS_PATH = Path(
    "data/processed/meal_items.csv"
)


# ============================================================
# LOAD FOODS
# ============================================================

with FOODS_PATH.open(
    "r",
    encoding="utf-8-sig",
    newline="",
) as file:

    reader = csv.DictReader(file)

    food_rows = list(reader)


if len(food_rows) != 100:

    raise ValueError(
        f"Expected exactly 100 foods. "
        f"Found {len(food_rows)}."
    )


# ============================================================
# HELPERS
# ============================================================

def parse_float(value):

    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return float(value)


foods = {}


for row in food_rows:

    code = row["food_code"]

    foods[code] = {

        **row,

        "energy_kcal":
            parse_float(
                row["energy_kcal"]
            ),

        "protein_g":
            parse_float(
                row["protein_g"]
            ),

        "carbohydrate_g":
            parse_float(
                row["carbohydrate_g"]
            ),

        "fat_g":
            parse_float(
                row["fat_g"]
            ),

        "fiber_g":
            parse_float(
                row["fiber_g"]
            ),
    }


print(
    "Foods loaded:",
    len(foods),
)


# ============================================================
# MEAL STORAGE
# ============================================================

recipes = []


def add_meal(
    meal_id,
    meal_name,
    meal_type,
    items,
    prep_note,
):

    recipes.append({

        "meal_id":
            meal_id,

        "meal_name":
            meal_name,

        "meal_type":
            meal_type,

        "items":
            items,

        "prep_note":
            prep_note,

    })


# ============================================================
# BREAKFAST — 12
# ============================================================

add_meal(
    "BR001",
    "Ragi Banana Almond Cress Porridge",
    "breakfast",
    {
        "A010": 50,
        "E012": 100,
        "H001": 10,
        "H008": 15,
    },
    "Cook ragi with water; top with banana, almonds and garden cress seeds.",
)


add_meal(
    "BR002",
    "Peas Peanut Poha",
    "breakfast",
    {
        "A011": 60,
        "D061": 50,
        "H012": 10,
        "G017": 20,
    },
    "Cook poha with peas and onion. Added cooking oil is not included in nutrition.",
)


add_meal(
    "BR003",
    "Moong Dal Veg Chilla",
    "breakfast",
    {
        "B010": 60,
        "D033": 40,
        "G017": 30,
        "D076": 40,
    },
    "Soak and blend moong dal; cook with capsicum, onion and tomato.",
)


add_meal(
    "BR004",
    "Quinoa Banana Walnut Cress Bowl",
    "breakfast",
    {
        "A009": 50,
        "E012": 80,
        "H021": 10,
        "H008": 10,
    },
    "Cook quinoa in water; serve with banana, walnuts and garden cress seeds.",
)


add_meal(
    "BR005",
    "Chana Dal Spinach Chilla",
    "breakfast",
    {
        "B001": 60,
        "C033": 50,
        "G017": 30,
        "D076": 40,
    },
    "Soak and blend chana dal with spinach, onion and tomato.",
)


add_meal(
    "BR006",
    "Sweet Potato Peanut Cress Bowl",
    "breakfast",
    {
        "F013": 180,
        "H012": 15,
        "H008": 20,
        "E033": 10,
    },
    "Steam sweet potato; top with peanuts, garden cress seeds and lemon juice.",
)


add_meal(
    "BR007",
    "Banana Peanut Atta Pancake",
    "breakfast",
    {
        "A019": 60,
        "E012": 70,
        "H012": 15,
    },
    "Mix atta, mashed banana and water; cook on a non-stick pan and top with peanuts.",
)


add_meal(
    "BR008",
    "Quinoa Moong Breakfast Bowl",
    "breakfast",
    {
        "A009": 40,
        "B011": 35,
        "D061": 40,
        "D076": 30,
    },
    "Cook quinoa and soaked moong; combine with peas and tomato.",
)


add_meal(
    "BR009",
    "Ragi Milk Banana Porridge",
    "breakfast",
    {
        "A010": 45,
        "L002": 200,
        "E012": 80,
    },
    "Cook ragi with cow milk and top with banana.",
)


add_meal(
    "BR010",
    "Paneer Spinach Atta Roll",
    "breakfast",
    {
        "A019": 50,
        "L003": 60,
        "C033": 40,
        "D076": 30,
    },
    "Prepare an atta flatbread and fill with paneer, spinach and tomato.",
)


add_meal(
    "BR011",
    "Egg Poha Bowl",
    "breakfast",
    {
        "A011": 50,
        "M004": 100,
        "D061": 40,
        "G017": 20,
    },
    "Serve cooked poha with peas and onion alongside chopped boiled egg.",
)


add_meal(
    "BR012",
    "Egg White Quinoa Bowl",
    "breakfast",
    {
        "A009": 45,
        "M005": 100,
        "D033": 40,
        "D076": 40,
    },
    "Combine cooked quinoa with boiled egg white, capsicum and tomato.",
)


# ============================================================
# LUNCH — 14
# ============================================================

add_meal(
    "LU001",
    "Rajma Brown Rice Bowl",
    "lunch",
    {
        "B020": 50,
        "A013": 50,
        "D076": 50,
        "G017": 30,
    },
    "Cook soaked rajma and brown rice; serve with tomato and onion.",
)


add_meal(
    "LU002",
    "Chana Quinoa Salad Bowl",
    "lunch",
    {
        "B002": 50,
        "A009": 45,
        "D043": 60,
        "D076": 40,
        "E033": 10,
    },
    "Combine cooked chana and quinoa with cucumber, tomato and lemon.",
)


add_meal(
    "LU003",
    "Moong Dal Rice Spinach Bowl",
    "lunch",
    {
        "B010": 45,
        "A015": 50,
        "C033": 60,
        "D076": 40,
    },
    "Cook moong dal and rice; add spinach and tomato.",
)


add_meal(
    "LU004",
    "Lentil Bajra Vegetable Bowl",
    "lunch",
    {
        "B013": 45,
        "A003": 50,
        "D049": 60,
        "D076": 40,
    },
    "Cook lentils and bajra; serve with beans and tomato.",
)


add_meal(
    "LU005",
    "Soy Quinoa Protein Bowl",
    "lunch",
    {
        "B025": 40,
        "A009": 45,
        "D049": 60,
        "D033": 40,
    },
    "Cook soybean and quinoa thoroughly; combine with beans and capsicum.",
)


add_meal(
    "LU006",
    "Cowpea Jowar Cauliflower Bowl",
    "lunch",
    {
        "B005": 50,
        "A005": 50,
        "D036": 80,
        "G017": 30,
    },
    "Cook cowpea and jowar; serve with cauliflower and onion.",
)


add_meal(
    "LU007",
    "Toor Dal Rice Drumstick Bowl",
    "lunch",
    {
        "B021": 45,
        "A015": 50,
        "D046": 80,
        "C019": 30,
    },
    "Cook toor dal and rice with drumstick; finish with drumstick leaves.",
)


add_meal(
    "LU008",
    "Horse Gram Barley Pumpkin Bowl",
    "lunch",
    {
        "B012": 45,
        "A004": 50,
        "D066": 80,
        "C033": 50,
    },
    "Cook horse gram and barley; serve with pumpkin and spinach.",
)


add_meal(
    "LU009",
    "Paneer Brown Rice Spinach Bowl",
    "lunch",
    {
        "L003": 80,
        "A013": 45,
        "C033": 60,
        "D076": 40,
    },
    "Serve paneer with cooked brown rice, spinach and tomato.",
)


add_meal(
    "LU010",
    "Paneer Quinoa Peas Bowl",
    "lunch",
    {
        "L003": 70,
        "A009": 45,
        "D061": 60,
        "D033": 40,
    },
    "Serve paneer and cooked quinoa with peas and capsicum.",
)


add_meal(
    "LU011",
    "Egg Lentil Rice Bowl",
    "lunch",
    {
        "M004": 100,
        "B013": 30,
        "A015": 40,
        "C033": 50,
    },
    "Serve boiled egg with lentil-rice and spinach.",
)


add_meal(
    "LU012",
    "Chicken Brown Rice Veg Bowl",
    "lunch",
    {
        "N003": 120,
        "A013": 50,
        "D049": 60,
        "D033": 40,
    },
    "Cook chicken breast thoroughly; serve with brown rice, beans and capsicum.",
)


add_meal(
    "LU013",
    "Tuna Quinoa Salad Bowl",
    "lunch",
    {
        "P084": 120,
        "A009": 45,
        "D043": 80,
        "D076": 50,
        "E033": 10,
    },
    "Cook tuna and quinoa; serve with cucumber, tomato and lemon.",
)


add_meal(
    "LU014",
    "Rohu Rice Spinach Bowl",
    "lunch",
    {
        "S006": 120,
        "A015": 50,
        "C033": 60,
        "D076": 40,
    },
    "Cook rohu thoroughly; serve with rice, spinach and tomato.",
)


# ============================================================
# EVENING SNACK — 10
# ============================================================

add_meal(
    "SN001",
    "Apple Almond Snack",
    "evening_snack",
    {
        "E001": 150,
        "H001": 15,
    },
    "Serve sliced apple with almonds.",
)


add_meal(
    "SN002",
    "Guava Groundnut Snack",
    "evening_snack",
    {
        "E028": 150,
        "H012": 15,
    },
    "Serve guava with groundnuts.",
)


add_meal(
    "SN003",
    "Banana Pistachio Snack",
    "evening_snack",
    {
        "E012": 100,
        "H018": 15,
    },
    "Serve banana with pistachios.",
)


add_meal(
    "SN004",
    "Pomegranate Cress Seed Bowl",
    "evening_snack",
    {
        "E055": 120,
        "H008": 15,
    },
    "Top pomegranate with garden cress seeds.",
)


add_meal(
    "SN005",
    "Sweet Corn Peanut Cup",
    "evening_snack",
    {
        "A008": 120,
        "H012": 15,
        "E033": 10,
    },
    "Steam sweet corn; add peanuts and lemon.",
)


add_meal(
    "SN006",
    "Chana Papaya Snack Bowl",
    "evening_snack",
    {
        "B002": 35,
        "E049": 150,
    },
    "Use chana and serve with papaya.",
)


add_meal(
    "SN007",
    "Coconut Water Walnut Snack",
    "evening_snack",
    {
        "K002": 250,
        "H021": 15,
    },
    "Serve coconut water with walnuts.",
)


add_meal(
    "SN008",
    "Milk Banana Snack",
    "evening_snack",
    {
        "L002": 200,
        "E012": 80,
    },
    "Serve cow milk with banana.",
)


add_meal(
    "SN009",
    "Paneer Cucumber Lemon Snack",
    "evening_snack",
    {
        "L003": 60,
        "D043": 100,
        "E033": 10,
    },
    "Serve paneer cubes with cucumber and lemon.",
)


add_meal(
    "SN010",
    "Boiled Egg Orange Snack",
    "evening_snack",
    {
        "M004": 100,
        "E047": 120,
    },
    "Serve boiled egg with orange.",
)


# ============================================================
# DINNER — 14
# ============================================================

add_meal(
    "DI001",
    "Quinoa Lentil Vegetable Bowl",
    "dinner",
    {
        "A009": 45,
        "B013": 45,
        "D036": 80,
        "C033": 50,
    },
    "Cook quinoa and lentils; serve with cauliflower and spinach.",
)


add_meal(
    "DI002",
    "Brown Rice Moong Bean Bowl",
    "dinner",
    {
        "A013": 45,
        "B011": 45,
        "D049": 60,
        "D076": 40,
    },
    "Cook brown rice and moong; serve with beans and tomato.",
)


add_meal(
    "DI003",
    "Bajra Chana Spinach Bowl",
    "dinner",
    {
        "A003": 45,
        "B001": 45,
        "C033": 60,
        "G017": 30,
    },
    "Cook bajra and chana dal; serve with spinach and onion.",
)


add_meal(
    "DI004",
    "Barley Soy Vegetable Bowl",
    "dinner",
    {
        "A004": 45,
        "B025": 35,
        "D036": 80,
        "D033": 40,
    },
    "Cook barley and soybean thoroughly; serve with cauliflower and capsicum.",
)


add_meal(
    "DI005",
    "Jowar Cowpea Pumpkin Bowl",
    "dinner",
    {
        "A005": 45,
        "B005": 45,
        "D066": 80,
        "C020": 50,
    },
    "Cook jowar and cowpea; serve with pumpkin and fenugreek leaves.",
)


add_meal(
    "DI006",
    "Rajma Rice Vegetable Dinner Bowl",
    "dinner",
    {
        "B020": 45,
        "A015": 45,
        "D049": 60,
        "C033": 50,
    },
    "Cook rajma and rice; serve with beans and spinach.",
)


add_meal(
    "DI007",
    "Sweet Potato Soy Spinach Bowl",
    "dinner",
    {
        "F013": 150,
        "B025": 35,
        "C033": 70,
        "D076": 40,
    },
    "Steam sweet potato and cook soybean thoroughly; serve with spinach and tomato.",
)


add_meal(
    "DI008",
    "Paneer Quinoa Spinach Bowl",
    "dinner",
    {
        "L003": 70,
        "A009": 40,
        "C033": 80,
        "D076": 40,
    },
    "Serve paneer with cooked quinoa, spinach and tomato.",
)


add_meal(
    "DI009",
    "Paneer Atta Vegetable Plate",
    "dinner",
    {
        "A019": 50,
        "L003": 70,
        "D036": 80,
        "D033": 50,
    },
    "Serve paneer and vegetables with an atta flatbread.",
)


add_meal(
    "DI010",
    "Egg Moong Atta Bowl",
    "dinner",
    {
        "M004": 100,
        "B010": 30,
        "A019": 40,
        "C033": 50,
    },
    "Serve boiled egg with moong, atta flatbread and spinach.",
)


add_meal(
    "DI011",
    "Chicken Quinoa Veg Bowl",
    "dinner",
    {
        "N003": 120,
        "A009": 45,
        "D049": 60,
        "D033": 40,
    },
    "Cook chicken thoroughly; serve with quinoa, beans and capsicum.",
)


add_meal(
    "DI012",
    "Salmon Brown Rice Greens",
    "dinner",
    {
        "P068": 120,
        "A013": 45,
        "C033": 70,
        "D043": 60,
    },
    "Cook salmon thoroughly; serve with brown rice, spinach and cucumber.",
)


add_meal(
    "DI013",
    "Tuna Atta Spinach Wrap",
    "dinner",
    {
        "P084": 120,
        "A019": 50,
        "C033": 60,
        "D076": 40,
    },
    "Cook tuna; serve in an atta flatbread with spinach and tomato.",
)


add_meal(
    "DI014",
    "Goat Barley Vegetable Bowl",
    "dinner",
    {
        "O003": 120,
        "A004": 45,
        "D036": 80,
        "C020": 50,
    },
    "Cook goat thoroughly; serve with barley, cauliflower and fenugreek leaves.",
)


# ============================================================
# BASIC VALIDATION
# ============================================================

if len(recipes) != 50:

    raise ValueError(
        f"Expected 50 meals. "
        f"Found {len(recipes)}."
    )


# ============================================================
# DIET RANK
# ============================================================

DIET_RANK = {

    "vegan": 0,

    "vegetarian": 1,

    "eggetarian": 2,

    "non_vegetarian": 3,

}


# ============================================================
# CALCULATE MEALS
# ============================================================

meal_rows = []

meal_item_rows = []

meal_item_counter = 1


for meal in recipes:

    total_kcal = 0.0

    total_protein = 0.0

    total_fat = 0.0

    known_carbs = 0.0

    known_fiber = 0.0


    carbohydrate_complete = True

    fiber_complete = True


    ingredient_diets = []


    # ========================================================
    # PROCESS EACH INGREDIENT
    # ========================================================

    for food_code, quantity_g in meal["items"].items():

        if food_code not in foods:

            raise ValueError(
                f"{meal['meal_id']} uses "
                f"missing food code: "
                f"{food_code}"
            )


        food = foods[
            food_code
        ]


        ingredient_diets.append(
            food["diet_class"]
        )


        factor = (
            quantity_g
            /
            100.0
        )


        total_kcal += (
            food["energy_kcal"]
            *
            factor
        )


        total_protein += (
            food["protein_g"]
            *
            factor
        )


        total_fat += (
            food["fat_g"]
            *
            factor
        )


        # ----------------------------------------------------
        # CARBOHYDRATE
        # ----------------------------------------------------

        if (
            food["carbohydrate_g"]
            is None
        ):

            carbohydrate_complete = False

        else:

            known_carbs += (
                food["carbohydrate_g"]
                *
                factor
            )


        # ----------------------------------------------------
        # FIBRE
        # ----------------------------------------------------

        if (
            food["fiber_g"]
            is None
        ):

            fiber_complete = False

        else:

            known_fiber += (
                food["fiber_g"]
                *
                factor
            )


        # ----------------------------------------------------
        # CREATE meal_items ROW
        # ----------------------------------------------------

        meal_item_rows.append({

            "meal_item_id":
                f"MI{meal_item_counter:04d}",

            "meal_id":
                meal["meal_id"],

            "food_code":
                food_code,

            "food_name":
                food["display_name"],

            "quantity_g":
                quantity_g,

            "quantity_basis":
                "IFCT food-entry weight",

        })


        meal_item_counter += 1


    # ========================================================
    # DETERMINE MEAL DIET CLASS
    # ========================================================

    meal_diet = max(

        ingredient_diets,

        key=lambda diet:
            DIET_RANK[diet],

    )


    meal_rank = (
        DIET_RANK[
            meal_diet
        ]
    )


    # ========================================================
    # PROTEIN LEVEL
    # ========================================================

    if total_protein >= 20:

        protein_level = "high"

    elif total_protein >= 10:

        protein_level = "moderate"

    else:

        protein_level = "low"


    # ========================================================
    # CREATE MEAL ROW
    # ========================================================

    meal_rows.append({

        "meal_id":
            meal["meal_id"],

        "meal_name":
            meal["meal_name"],

        "meal_type":
            meal["meal_type"],

        "diet_class":
            meal_diet,


        # Compatibility hierarchy
        "vegan_ok":
            meal_rank <= 0,

        "vegetarian_ok":
            meal_rank <= 1,

        "eggetarian_ok":
            meal_rank <= 2,

        "nonveg_ok":
            True,


        "servings":
            1,


        # Nutrition
        "total_kcal":
            round(
                total_kcal,
                1,
            ),

        "total_protein_g":
            round(
                total_protein,
                1,
            ),

        "known_carbohydrate_g":
            round(
                known_carbs,
                1,
            ),

        "total_fat_g":
            round(
                total_fat,
                1,
            ),

        "known_fiber_g":
            round(
                known_fiber,
                1,
            ),


        # Nutrient completeness
        "carbohydrate_complete":
            carbohydrate_complete,

        "fiber_complete":
            fiber_complete,


        "protein_level":
            protein_level,


        "prep_note":
            meal["prep_note"],


        "is_active":
            True,

    })


# ============================================================
# VALIDATE TOTAL LINK COUNT
# ============================================================

if len(meal_item_rows) != 182:

    raise ValueError(
        f"Expected 182 meal-item links. "
        f"Found {len(meal_item_rows)}."
    )


# ============================================================
# VALIDATE VEGAN COVERAGE
# ============================================================

for meal_type in [

    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",

]:

    compatible = [

        meal

        for meal in meal_rows

        if (
            meal["meal_type"]
            == meal_type
            and
            meal["vegan_ok"]
        )

    ]


    if len(compatible) < 7:

        raise ValueError(

            f"Only "
            f"{len(compatible)} "
            f"vegan meals for "
            f"{meal_type}. "

            "Need at least 7."

        )


# ============================================================
# VALIDATE PROTEIN
# ============================================================

for meal in meal_rows:

    if (
        meal["meal_type"]
        in [
            "lunch",
            "dinner",
        ]
        and
        meal["total_protein_g"]
        < 15
    ):

        raise ValueError(

            f"{meal['meal_id']} "
            f"{meal['meal_name']} "
            f"has only "
            f"{meal['total_protein_g']} g "
            f"protein."

        )


    if (
        meal["meal_type"]
        == "breakfast"
        and
        meal["total_protein_g"]
        < 10
    ):

        raise ValueError(

            f"{meal['meal_id']} "
            f"{meal['meal_name']} "
            f"has only "
            f"{meal['total_protein_g']} g "
            f"protein."

        )


# ============================================================
# CREATE OUTPUT FOLDER
# ============================================================

MEALS_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# WRITE meals.csv
# ============================================================

MEAL_COLUMNS = [

    "meal_id",
    "meal_name",
    "meal_type",
    "diet_class",

    "vegan_ok",
    "vegetarian_ok",
    "eggetarian_ok",
    "nonveg_ok",

    "servings",

    "total_kcal",
    "total_protein_g",
    "known_carbohydrate_g",
    "total_fat_g",
    "known_fiber_g",

    "carbohydrate_complete",
    "fiber_complete",

    "protein_level",

    "prep_note",

    "is_active",

]


with MEALS_PATH.open(
    "w",
    encoding="utf-8",
    newline="",
) as file:

    writer = csv.DictWriter(

        file,

        fieldnames=
            MEAL_COLUMNS,

    )

    writer.writeheader()

    writer.writerows(
        meal_rows
    )


# ============================================================
# WRITE meal_items.csv
# ============================================================

MEAL_ITEM_COLUMNS = [

    "meal_item_id",

    "meal_id",

    "food_code",

    "food_name",

    "quantity_g",

    "quantity_basis",

]


with MEAL_ITEMS_PATH.open(
    "w",
    encoding="utf-8",
    newline="",
) as file:

    writer = csv.DictWriter(

        file,

        fieldnames=
            MEAL_ITEM_COLUMNS,

    )

    writer.writeheader()

    writer.writerows(
        meal_item_rows
    )


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)

print(
    "MEAL DATABASE CREATED"
)

print("=" * 70)


print(
    "Foods:",
    len(foods),
)

print(
    "Meals:",
    len(meal_rows),
)

print(
    "Meal-item links:",
    len(meal_item_rows),
)


print()
print(
    "Meals file:",
    MEALS_PATH,
)

print(
    "Meal-items file:",
    MEAL_ITEMS_PATH,
)


# ============================================================
# COVERAGE REPORT
# ============================================================

print()

print(
    "MEAL COVERAGE"
)

print("-" * 70)


for meal_type in [

    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",

]:

    rows = [

        meal

        for meal in meal_rows

        if meal["meal_type"]
        == meal_type

    ]


    vegan = sum(
        meal["vegan_ok"]
        for meal in rows
    )


    vegetarian = sum(
        meal["vegetarian_ok"]
        for meal in rows
    )


    eggetarian = sum(
        meal["eggetarian_ok"]
        for meal in rows
    )


    nonveg = sum(
        meal["nonveg_ok"]
        for meal in rows
    )


    print(

        f"{meal_type:16} "

        f"Total: {len(rows):2} | "

        f"Vegan: {vegan:2} | "

        f"Vegetarian: {vegetarian:2} | "

        f"Eggetarian: {eggetarian:2} | "

        f"Nonveg: {nonveg:2}"

    )


# ============================================================
# NUTRITION RANGES
# ============================================================

print()
print(
    "NUTRITION RANGES"
)

print("-" * 70)


for meal_type in [

    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",

]:

    rows = [

        meal

        for meal in meal_rows

        if meal["meal_type"]
        == meal_type

    ]


    calories = [

        meal["total_kcal"]

        for meal in rows

    ]


    proteins = [

        meal["total_protein_g"]

        for meal in rows

    ]


    print(

        f"{meal_type:16} "

        f"Calories: "
        f"{min(calories):.1f}"
        f" - "
        f"{max(calories):.1f} | "

        f"Protein: "
        f"{min(proteins):.1f}"
        f" - "
        f"{max(proteins):.1f} g"

    )


print()
print("=" * 70)


print("=" * 70)