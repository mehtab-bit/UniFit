from pathlib import Path
from pypdf import PdfReader

PDF_PATH = Path("data/raw/IFCT2017.pdf")

reader = PdfReader(PDF_PATH)

print("Total pages:", len(reader.pages))
print("\nSearching for actual nutrition tables...\n")

for page_number, page in enumerate(reader.pages, start=1):

    try:
        text = page.extract_text() or ""
    except Exception:
        continue

    text_lower = text.lower()

    # These are the columns we actually need.
    required = [
        "moisture",
        "protein",
        "ash",
        "total fat",
        "energy",
    ]

    # Make sure this is NOT the amino-acid section.
    amino_acids = [
        "alanine",
        "arginine",
        "aspartic acid",
        "glutamic acid",
    ]

    has_required = all(x in text_lower for x in required)
    has_amino_acids = sum(x in text_lower for x in amino_acids) >= 2

    if has_required and not has_amino_acids:

        print("=" * 80)
        print(f"LIKELY NUTRITION TABLE — PDF PAGE {page_number}")
        print("=" * 80)

        print(text[:4000])
        print()
