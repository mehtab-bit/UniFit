import pandas as pd
from pathlib import Path

# Path where our cleaned prototype food database will live
OUTPUT_PATH = Path("data/processed/foods.csv")

# These are the columns we decided our prototype needs
columns = [
    "id",
    "name",
    "ifct_code",
    "food_group",

    # Dietary classification
    "diet_type",

    # Where this food can generally be used
    "meal_type",

    # Nutritional role in a meal
    "food_role",

    # Main nutrition values
    "calories_per_100g",
    "protein_per_100g",
    "carbs_per_100g",
    "fat_per_100g",
    "fiber_per_100g",

    # Useful micronutrients
    "calcium_mg_per_100g",
    "iron_mg_per_100g",
    "sodium_mg_per_100g",
    "potassium_mg_per_100g",

    # Dietary restriction flags
    "contains_egg",
    "contains_dairy",
    "contains_meat",
    "contains_fish",
]

# Create an empty dataframe with those columns
df = pd.DataFrame(columns=columns)

# Make sure output folder exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Save CSV
df.to_csv(OUTPUT_PATH, index=False)

print("Food database created successfully!")
print(f"Saved to: {OUTPUT_PATH}")
print(f"Number of columns: {len(df.columns)}")
print("\nColumns:")
for column in df.columns:
    print("-", column)