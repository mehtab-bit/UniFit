from pathlib import Path
import csv
import re

from pypdf import PdfReader


# ============================================================
# PATHS
# ============================================================

PDF_PATH = Path("data/raw/IFCT2017.pdf")
OUTPUT_PATH = Path("data/processed/ifct_proximate.csv")


# ============================================================
# READ PDF
# ============================================================

reader = PdfReader(PDF_PATH)

print(f"Total PDF pages: {len(reader.pages)}")
print()


# ============================================================
# HELPERS
# ============================================================

def clean_number(value):
    """
    Convert IFCT values such as:

        17.94
        17.94±1.36
        17.94Â±1.36
        518±84
        518Â±84

    into the reported mean.

    Returns:
        float
        None if the value is not numeric.
    """

    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    # Normalize common encoding variants.
    value = value.replace("Â±", "±")

    # Keep only the mean before ±.
    if "±" in value:
        value = value.split("±", 1)[0].strip()

    # Remove stray whitespace.
    value = value.strip()

    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def is_food_code(value):
    """
    IFCT food codes look like:

        A001
        B001
        M001
        P022
        S006

    """

    if not value:
        return False

    return bool(re.fullmatch(r"[A-Z]\d{3}", value))


def is_region_count(value):
    """
    IFCT region counts are small positive integers.

    Usually 1-6, but allow up to 10 defensively.
    """

    if not value:
        return False

    return bool(re.fullmatch(r"\d{1,2}", value)) and 1 <= int(value) <= 10


def is_numeric_token(value):
    """
    True when a token is a valid numeric IFCT value.
    """

    return clean_number(value) is not None


def normalize_text(text):
    """
    Normalize common PDF extraction problems.
    """

    if not text:
        return ""

    text = text.replace("\r", "\n")

    # Normalize non-breaking spaces.
    text = text.replace("\xa0", " ")

    # Normalize encoding of ±.
    text = text.replace("Â±", "±")

    return text


def is_table_header(line):
    """
    Ignore repeated table headers.
    """

    lower = line.lower()

    header_patterns = [
        "food code",
        "food name",
        "no. of regions",
        "moisture protein",
        "protein ash",
        "ash total fat",
        "total fat energy",
        "water protcnt",
        "fatce",
        "enerc",
        "table 1.",
        "proximate principles",
        "dietary fibre",
    ]

    return any(pattern in lower for pattern in header_patterns)


def is_section_header(line):
    """
    Ignore category headings such as:

        A CEREALS AND MILLETS
        B GRAIN LEGUMES
        C GREEN LEAFY VEGETABLES
        S FRESHWATER FISH AND SHELLFISH
    """

    stripped = line.strip()

    if not stripped:
        return True

    # Typical section heading.
    if re.fullmatch(r"[A-Z]\s+.*", stripped):
        # Avoid accidentally treating food names as section headings.
        # A real food row always starts with A001 etc.
        if not is_food_code(stripped.split()[0]):
            return True

    return False


def find_region_index(parts):
    """
    Find the position of the region count in a food row.

    Example:

        A001 Amaranth seed black ... 1 9.89 14.59 ...

    returns the index of '1'.

    We search for an integer followed by a run of numeric values.
    """

    if len(parts) < 7:
        return None

    # Start after food code.
    for index in range(1, len(parts)):

        token = parts[index]

        if not is_region_count(token):
            continue

        remaining = parts[index + 1:]

        if len(remaining) < 5:
            continue

        # The nutrition values should start immediately after
        # the region count.
        #
        # Check at least the first five values.
        first_five = remaining[:5]

        if all(is_numeric_token(value) for value in first_five):
            return index

    return None


def extract_numeric_values(parts):
    """
    Extract the consecutive numeric values from the beginning
    of the nutrition portion.

    Proximate table:

        moisture
        protein
        ash
        fat
        fibre
        insoluble fibre
        soluble fibre
        carbohydrate
        energy

    = 9 values

    Some later tables:

        moisture
        protein
        ash
        fat
        energy

    = 5 values
    """

    values = []

    for token in parts:

        number = clean_number(token)

        if number is None:
            break

        values.append(number)

    return values


def parse_food_line(parts, page_number):
    """
    Parse one complete food row.

    Returns a dictionary or None.
    """

    if not parts:
        return None

    code = parts[0]

    if not is_food_code(code):
        return None

    region_index = find_region_index(parts)

    if region_index is None:
        return None

    # Food name is everything between code and regions.
    food_name_parts = parts[1:region_index]

    if not food_name_parts:
        return None

    food_name = " ".join(food_name_parts).strip()

    if not food_name:
        return None

    regions = int(parts[region_index])

    nutrition_parts = parts[region_index + 1:]

    numeric_values = extract_numeric_values(nutrition_parts)

    # Need at least:
    #
    # moisture, protein, ash, fat, energy
    #
    if len(numeric_values) < 5:
        return None

    moisture = numeric_values[0]
    protein = numeric_values[1]
    ash = numeric_values[2]
    fat = numeric_values[3]

    # Energy is the LAST nutrition value.
    energy = numeric_values[-1]

    return {
        "food_code": code,
        "food_name": food_name,
        "regions": regions,
        "moisture_g": moisture,
        "protein_g": protein,
        "ash_g": ash,
        "fat_g": fat,
        "energy_kj": energy,
        "source_page": page_number,
    }


# ============================================================
# EXTRACT FOOD ROWS
# ============================================================

foods = []

current_food_parts = None
current_food_page = None


for page_number, page in enumerate(reader.pages, start=1):

    try:
        raw_text = page.extract_text() or ""
    except Exception as exc:
        print(f"WARNING: Could not read page {page_number}: {exc}")
        continue

    text = normalize_text(raw_text)

    # --------------------------------------------------------
    # Only process pages belonging to the proximate table.
    # --------------------------------------------------------

    lower_text = text.lower()

    required_columns = [
        "moisture",
        "protein",
        "ash",
        "total fat",
        "energy",
    ]

    if not all(column in lower_text for column in required_columns):
        continue

    # Do not process amino-acid tables.
    if "alanine" in lower_text and "arginine" in lower_text:
        continue

    print(f"Processing page {page_number}...")

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for line in lines:

        # ----------------------------------------------------
        # Ignore obvious headers.
        # ----------------------------------------------------

        if is_table_header(line):
            continue

        # ----------------------------------------------------
        # Ignore section headers.
        # ----------------------------------------------------

        if is_section_header(line):
            continue

        parts = line.split()

        if not parts:
            continue

        # ----------------------------------------------------
        # CASE 1:
        # Complete food row starts on this line.
        # ----------------------------------------------------

        if is_food_code(parts[0]):

            parsed = parse_food_line(parts, page_number)

            if parsed is not None:
                foods.append(parsed)

                # Reset continuation state.
                current_food_parts = None
                current_food_page = None

                continue

            # ------------------------------------------------
            # The food row may have been split by PDF extraction.
            #
            # Example:
            #
            # A009 Quinoa
            #
            # (Chenopodium quinoa) 1 10.43 ...
            #
            # Store the beginning and wait for next line.
            # ------------------------------------------------

            current_food_parts = parts
            current_food_page = page_number

            continue

        # ----------------------------------------------------
        # CASE 2:
        # Continuation of previous food row.
        # ----------------------------------------------------

        if current_food_parts is not None:

            combined_parts = current_food_parts + parts

            parsed = parse_food_line(
                combined_parts,
                current_food_page,
            )

            if parsed is not None:
                foods.append(parsed)

                current_food_parts = None
                current_food_page = None

                continue

            # Still incomplete.
            current_food_parts = combined_parts


# ============================================================
# REMOVE DUPLICATES
# ============================================================

unique_foods = {}

for food in foods:

    code = food["food_code"]

    # Keep the first occurrence unless it is obviously better.
    if code not in unique_foods:
        unique_foods[code] = food


foods = list(unique_foods.values())


# ============================================================
# SORT BY FOOD CODE
# ============================================================

foods.sort(
    key=lambda food: (
        food["food_code"][0],
        int(food["food_code"][1:])
    )
)


# ============================================================
# WRITE CSV
# ============================================================

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

fieldnames = [
    "food_code",
    "food_name",
    "regions",
    "moisture_g",
    "protein_g",
    "ash_g",
    "fat_g",
    "energy_kj",
    "source_page",
]


with open(
    OUTPUT_PATH,
    "w",
    newline="",
    encoding="utf-8",
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames,
    )

    writer.writeheader()
    writer.writerows(foods)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)
print("EXTRACTION COMPLETE")
print("=" * 70)

print(f"Foods extracted: {len(foods)}")
print(f"Output file: {OUTPUT_PATH}")

print()
print("Food-code distribution:")

distribution = {}

for food in foods:

    prefix = food["food_code"][0]

    distribution[prefix] = distribution.get(prefix, 0) + 1

for prefix in sorted(distribution):
    print(f"{prefix}: {distribution[prefix]}")


print()
print("First 20 foods:")

for food in foods[:20]:

    print(
        f'{food["food_code"]} | '
        f'{food["food_name"]} | '
        f'Regions: {food["regions"]} | '
        f'Protein: {food["protein_g"]} g | '
        f'Fat: {food["fat_g"]} g | '
        f'Energy: {food["energy_kj"]} kJ | '
        f'Page: {food["source_page"]}'
    )


print()
print("Last 20 foods:")

for food in foods[-20:]:

    print(
        f'{food["food_code"]} | '
        f'{food["food_name"]} | '
        f'Regions: {food["regions"]} | '
        f'Protein: {food["protein_g"]} g | '
        f'Fat: {food["fat_g"]} g | '
        f'Energy: {food["energy_kj"]} kJ | '
        f'Page: {food["source_page"]}'
    )


print()
print("=" * 70)
print("DONE")
print("=" * 70)