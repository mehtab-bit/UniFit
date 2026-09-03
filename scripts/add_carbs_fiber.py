from pathlib import Path
import re
import pandas as pd
from pypdf import PdfReader


# ============================================================
# PATHS
# ============================================================

PDF_PATH = Path("data/raw/IFCT2017.pdf")

CURATED_PATH = Path(
    "data/processed/foods_100_curated.csv"
)

OUTPUT_PATH = Path(
    "data/processed/foods_100_nutrition.csv"
)


# ============================================================
# REGEX
# ============================================================

FOOD_CODE_RE = re.compile(
    r"\b([A-S]\d{3})\b"
)

NUMBER_RE = re.compile(
    r"^-?\d+(?:\.\d+)?(?:±\d+(?:\.\d+)?)?$"
)


# ============================================================
# TEXT CLEANING
# ============================================================

def normalize_text(text):
    """
    Normalize common PDF extraction problems.

    Examples:
        24 .78     -> 24.78
        2. 41      -> 2.41
        9.20 ±0.40 -> 9.20±0.40
    """

    text = text.replace("Â±", "±")
    text = text.replace("\xa0", " ")

    # Join broken decimals.
    text = re.sub(
        r"(?<=\d)\s*\.\s*(?=\d)",
        ".",
        text,
    )

    # Normalize ± spacing.
    text = re.sub(
        r"\s*±\s*",
        "±",
        text,
    )

    # Replace line breaks/tabs with spaces.
    text = re.sub(
        r"[\r\n\t]+",
        " ",
        text,
    )

    # Collapse repeated whitespace.
    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# ============================================================
# NUMBER HELPERS
# ============================================================

def is_number(token):
    return bool(
        NUMBER_RE.fullmatch(token)
    )


def clean_number(token):
    """
    IFCT often reports values like:

        13.27±0.34

    We store the reported mean:

        13.27
    """

    token = token.replace(
        "Â±",
        "±",
    )

    if "±" in token:
        token = token.split(
            "±",
            1,
        )[0]

    return float(token)


# ============================================================
# MINIMUM VALUES NEEDED TO LOCATE REGION COUNT
# ============================================================

def minimum_expected_values(prefix):
    """
    We only need enough consecutive numbers to identify the
    region-count position.

    A-J normally have 9 values, but some foods such as
    Lemon juice use a shorter 6-value layout.

    K-L can also use a shorter 6-value layout.

    M-S normally have 5 values.
    """

    if prefix in "ABCDEFGHIJKL":
        return 6

    if prefix in "MNOPQRS":
        return 5

    return None


# ============================================================
# FIND REGION COUNT
# ============================================================

def find_region_index(tokens, minimum_values):
    """
    Example:

        E033 Lemon ... 6 91.59 0.41 ...

    The '6' is the number of regions.

    We identify an integer from 1-10 followed by enough
    consecutive nutrient values.
    """

    for i, token in enumerate(tokens):

        if not re.fullmatch(
            r"\d+",
            token,
        ):
            continue

        region = int(token)

        if not 1 <= region <= 10:
            continue

        numeric_after = 0

        for following in tokens[i + 1:]:

            if is_number(following):

                numeric_after += 1

                if (
                    numeric_after
                    >= minimum_values
                ):
                    return i

            else:

                if numeric_after > 0:
                    break

    return None


# ============================================================
# READ NUTRIENT VALUES
# ============================================================

def get_values_after_region(
    tokens,
    region_index,
):
    """
    Read consecutive numeric nutrient values immediately
    following the region count.
    """

    values = []

    for token in tokens[
        region_index + 1:
    ]:

        if is_number(token):

            values.append(
                clean_number(token)
            )

        else:

            if values:
                break

    return values


# ============================================================
# LOAD CURATED 100
# ============================================================

foods = pd.read_csv(
    CURATED_PATH
)

if len(foods) != 100:

    raise ValueError(
        f"Expected 100 curated foods. "
        f"Found {len(foods)}."
    )


if foods["food_code"].duplicated().any():

    raise ValueError(
        "Duplicate food codes found "
        "in curated dataset."
    )


selected_codes = set(
    foods["food_code"]
)


print(
    "Curated foods:",
    len(selected_codes),
)


# ============================================================
# OPEN IFCT PDF
# ============================================================

reader = PdfReader(
    str(PDF_PATH)
)


# ============================================================
# EXTRACT CARBOHYDRATE + FIBRE
# ============================================================

nutrition = {}


# Actual proximate table pages.
for pdf_page in range(
    41,
    69,
):

    page = reader.pages[
        pdf_page - 1
    ]

    raw_text = (
        page.extract_text()
        or ""
    )

    text = normalize_text(
        raw_text
    )

    matches = list(
        FOOD_CODE_RE.finditer(text)
    )


    for index, match in enumerate(
        matches
    ):

        code = match.group(1)

        # We only care about our final 100 foods.
        if code not in selected_codes:
            continue


        # --------------------------------------------
        # Extract this food's text chunk
        # --------------------------------------------

        start = match.start()

        if index + 1 < len(matches):

            end = matches[
                index + 1
            ].start()

        else:

            end = len(text)


        chunk = text[
            start:end
        ]

        chunk = normalize_text(
            chunk
        )

        tokens = chunk.split()

        if not tokens:
            continue


        prefix = code[0]


        # --------------------------------------------
        # Number of values needed to identify
        # region count.
        # --------------------------------------------

        minimum_values = (
            minimum_expected_values(
                prefix
            )
        )

        if minimum_values is None:
            continue


        region_index = (
            find_region_index(
                tokens,
                minimum_values,
            )
        )


        if region_index is None:

            print(
                f"WARNING: region not found "
                f"for {code} "
                f"(page {pdf_page})"
            )

            continue


        values = (
            get_values_after_region(
                tokens,
                region_index,
            )
        )


        # Defaults
        carbohydrate = None
        fibre = None

        carbohydrate_status = (
            "not_reported"
        )

        fibre_status = (
            "not_reported"
        )


        # ====================================================
        # A-J FOODS
        # ====================================================
        #
        # FULL LAYOUT:
        #
        # 0 moisture
        # 1 protein
        # 2 ash
        # 3 fat
        # 4 total dietary fibre
        # 5 insoluble fibre
        # 6 soluble fibre
        # 7 available carbohydrate
        # 8 energy
        #
        # Example:
        # A001 Amaranth
        #
        #
        # SHORT LAYOUT:
        #
        # 0 moisture
        # 1 protein
        # 2 ash
        # 3 fat
        # 4 available carbohydrate
        # 5 energy
        #
        # Example:
        # E033 Lemon juice
        # ====================================================

        if prefix in "ABCDEFGHIJ":

            # Full 9-value table
            if len(values) >= 9:

                fibre = values[4]

                carbohydrate = (
                    values[7]
                )

                fibre_status = (
                    "ifct_reported"
                )

                carbohydrate_status = (
                    "ifct_reported"
                )


            # Short 6-value table
            elif len(values) == 6:

                carbohydrate = (
                    values[4]
                )

                fibre = None

                carbohydrate_status = (
                    "ifct_reported"
                )

                fibre_status = (
                    "not_reported"
                )


            else:

                print(
                    f"WARNING: unsupported "
                    f"A-J layout for {code}: "
                    f"{values}"
                )

                continue


        # ====================================================
        # K-L FOODS
        # ====================================================
        #
        # Short layout:
        #
        # moisture
        # protein
        # ash
        # fat
        # available carbohydrate
        # energy
        #
        # Fibre is not reported in this layout.
        # ====================================================

        elif prefix in "KL":

            if len(values) >= 6:

                carbohydrate = (
                    values[4]
                )

                fibre = None

                carbohydrate_status = (
                    "ifct_reported"
                )

                fibre_status = (
                    "not_reported"
                )

            else:

                print(
                    f"WARNING: unsupported "
                    f"K-L layout for {code}: "
                    f"{values}"
                )

                continue


        # ====================================================
        # M-S FOODS
        # ====================================================
        #
        # Animal-food proximate table:
        #
        # moisture
        # protein
        # ash
        # fat
        # energy
        #
        # Carbohydrate/fibre are NOT reported here.
        #
        # IMPORTANT:
        # We do NOT invent zeros.
        # ====================================================

        elif prefix in "MNOPQRS":

            carbohydrate = None
            fibre = None

            carbohydrate_status = (
                "not_reported"
            )

            fibre_status = (
                "not_reported"
            )


        # ====================================================
        # SAVE EXTRACTED RESULT
        # ====================================================

        nutrition[code] = {

            "carbohydrate_g":
                carbohydrate,

            "fiber_g":
                fibre,

            "carbohydrate_status":
                carbohydrate_status,

            "fiber_status":
                fibre_status,

        }


# ============================================================
# CREATE NUTRITION DATAFRAME
# ============================================================

nutrition_df = (
    pd.DataFrame.from_dict(
        nutrition,
        orient="index",
    )
    .reset_index()
    .rename(
        columns={
            "index": "food_code"
        }
    )
)


print()

print(
    "Rows found in PDF:",
    len(nutrition_df),
)


# ============================================================
# MERGE WITH OUR CURATED 100
# ============================================================

foods = foods.merge(
    nutrition_df,
    on="food_code",
    how="left",
)


# ============================================================
# VALIDATION 1
# ALL 100 FOODS MUST HAVE STATUS
# ============================================================

missing_status = foods[
    foods[
        "carbohydrate_status"
    ].isna()
    |
    foods[
        "fiber_status"
    ].isna()
]


if not missing_status.empty:

    print()
    print(
        "WARNING: foods missing "
        "nutrition status:"
    )

    print(
        missing_status[
            [
                "food_code",
                "food_name",
            ]
        ]
        .to_string(
            index=False
        )
    )


# ============================================================
# VALIDATION 2
# A-J SHOULD HAVE CARBOHYDRATE
# ============================================================

plant_mask = (
    foods["food_code"]
    .str[0]
    .isin(
        list("ABCDEFGHIJ")
    )
)


missing_plant_carbs = foods[
    plant_mask
    &
    foods[
        "carbohydrate_g"
    ].isna()
]


if not missing_plant_carbs.empty:

    print()
    print(
        "WARNING: A-J foods "
        "missing carbohydrate:"
    )

    print(
        missing_plant_carbs[
            [
                "food_code",
                "food_name",
            ]
        ]
        .to_string(
            index=False
        )
    )


# ============================================================
# VALIDATION 3
# PANEER
# ============================================================

paneer = foods[
    foods["food_code"]
    == "L003"
]


if not paneer.empty:

    row = paneer.iloc[0]

    paneer_carb = (
        row["carbohydrate_g"]
    )

    if (
        pd.isna(paneer_carb)
        or
        abs(
            paneer_carb - 2.41
        ) > 0.01
    ):

        raise ValueError(
            "Paneer carbohydrate "
            "should be 2.41 g. "
            f"Parsed value: "
            f"{paneer_carb}"
        )


# ============================================================
# VALIDATION 4
# LEMON
# ============================================================

lemon = foods[
    foods["food_code"]
    == "E033"
]


if not lemon.empty:

    row = lemon.iloc[0]

    lemon_carb = (
        row["carbohydrate_g"]
    )

    if (
        pd.isna(lemon_carb)
        or
        abs(
            lemon_carb - 6.97
        ) > 0.01
    ):

        raise ValueError(
            "E033 Lemon carbohydrate "
            "should be 6.97 g. "
            f"Parsed value: "
            f"{lemon_carb}"
        )


# ============================================================
# FINAL DATASET VALIDATION
# ============================================================

if len(foods) != 100:

    raise ValueError(
        f"Expected 100 final rows. "
        f"Got {len(foods)}."
    )


if foods[
    "food_code"
].duplicated().any():

    raise ValueError(
        "Duplicate food codes "
        "after nutrition merge."
    )


# ============================================================
# SAVE
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)


foods.to_csv(
    OUTPUT_PATH,
    index=False,
)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)

print(
    "CARBOHYDRATE + FIBRE "
    "ENRICHMENT COMPLETE"
)

print("=" * 70)


print(
    "Final rows:",
    len(foods),
)

print(
    "Output:",
    OUTPUT_PATH,
)


# ------------------------------------------------------------
# AVAILABLE VALUES
# ------------------------------------------------------------

print()

print(
    "Carbohydrate values available:",
    int(
        foods[
            "carbohydrate_g"
        ]
        .notna()
        .sum()
    ),
)


print(
    "Fibre values available:",
    int(
        foods[
            "fiber_g"
        ]
        .notna()
        .sum()
    ),
)


# ------------------------------------------------------------
# STATUS COUNTS
# ------------------------------------------------------------

print()

print(
    "Carbohydrate status:"
)

print(
    foods[
        "carbohydrate_status"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)


print()

print(
    "Fibre status:"
)

print(
    foods[
        "fiber_status"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)


# ------------------------------------------------------------
# PANEER CHECK
# ------------------------------------------------------------

print()
print("Paneer check:")

print(
    foods[
        foods["food_code"]
        == "L003"
    ][
        [
            "food_code",
            "food_name",
            "energy_kcal",
            "protein_g",
            "fat_g",
            "carbohydrate_g",
            "fiber_g",
            "carbohydrate_status",
            "fiber_status",
        ]
    ]
    .to_string(
        index=False
    )
)


# ------------------------------------------------------------
# LEMON CHECK
# ------------------------------------------------------------

print()
print("Lemon check:")

print(
    foods[
        foods["food_code"]
        == "E033"
    ][
        [
            "food_code",
            "food_name",
            "energy_kcal",
            "protein_g",
            "fat_g",
            "carbohydrate_g",
            "fiber_g",
            "carbohydrate_status",
            "fiber_status",
        ]
    ]
    .to_string(
        index=False
    )
)


# ------------------------------------------------------------
# MISSING STATUS CHECK
# ------------------------------------------------------------

print()

missing_status_count = (
    foods[
        "carbohydrate_status"
    ].isna().sum()
    +
    foods[
        "fiber_status"
    ].isna().sum()
)


print(
    "Missing status values:",
    int(
        missing_status_count
    ),
)


print()
print("=" * 70)
print("DONE")
print("=" * 70)