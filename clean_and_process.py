import pandas as pd
import json
import re

# Load Excel file
file_path = "Calculation.xlsx"
sheet_name = "Lender Criteria"  # Make sure this is the correct sheet name

# Read the sheet
df = pd.read_excel(file_path, sheet_name=sheet_name, header=None, dtype=str).fillna("N/A")

# Extract lender names from the second row (1-based index, so row 1 in 0-based indexing)
lender_names = df.iloc[1, 1:].dropna().tolist()  # Start from column 1 to skip first column

def convertTermToMonths(term):
    term = term.lower().replace("–", "-").strip()  # Normalize dash and lowercase
    term = re.sub(r'\s+', ' ', term)  # Remove extra spaces
    
    # Case: "X-Y months" (Already in months)
    match = re.match(r'(\d+)\s*-\s*(\d+)\s*months?', term)
    if match:
        return f"{match.group(1)}-{match.group(2)} months"

    # Case: "Upto X years" or "Up to X years"
    match = re.search(r'up to (\d+) years?|upto (\d+) years?', term)
    if match:
        high_limit = int(match.group(1) or match.group(2)) * 12
        return f"1-{high_limit} months"

    # Case: "Upto X months" or "Up to X months"
    match = re.search(r'up to (\d+) months?|upto (\d+) months?', term)
    if match:
        high_limit = int(match.group(1) or match.group(2))
        return f"1-{high_limit} months"

    # Case: "X-Y years" (Convert to months)
    match = re.match(r'(\d+)\s*-\s*(\d+)\s*years?', term)
    if match:
        low_limit = int(match.group(1)) * 12
        high_limit = int(match.group(2)) * 12
        return f"{low_limit}-{high_limit} months"

    # Case: "X months max"
    match = re.match(r'(\d+)\s*months?\s*max', term)
    if match:
        high_limit = int(match.group(1))
        return f"1-{high_limit} months"

    # Case: "X months" (Single value)
    match = re.match(r'(\d+)\s*months?', term)
    if match:
        return f"{match.group(1)}-{match.group(1)} months"

    # Case: "X years" (Convert to months)
    match = re.match(r'(\d+)\s*years?', term)
    if match:
        months = int(match.group(1)) * 12
        return f"{months}-{months} months"


    # If nothing matches, return the original term
    return term
def convert_rates(rate_str):
    rate_str = re.sub(r"\s+", " ", rate_str).strip().lower()
    rate_str = rate_str.replace("to", "-").replace("%", "").strip()

    # Case 1: "up to X pm" → "1 - X pm"
    match = re.match(r"up to (\d+\.?\d*) pm", rate_str)
    if match:
        upper = float(match.group(1))
        return f"1 - {upper:.2f} pm"

    # Case 2: "X - Y pm" → Keep as is
    match = re.match(r"(\d+\.?\d*)\s*-\s*(\d+\.?\d*) pm", rate_str)
    if match:
        return f"{match.group(1)} - {match.group(2)} pm"

    # Case 3: "X pm" → Keep as is
    match = re.match(r"(\d+\.?\d*) pm", rate_str)
    if match:
        return f"{match.group(1)} pm"

    # Case 4: "X - Y" (Annual rate) → Convert to monthly
    match = re.match(r"(\d+\.?\d*)\s*-\s*(\d+\.?\d*)", rate_str)
    if match:
        lower, upper = map(float, match.groups())
        return f"{lower / 12:.2f} - {upper / 12:.2f} pm"

    # Case 5: Single percentage (Annual rate) → Convert to monthly
    match = re.match(r"(\d+\.?\d*)", rate_str)
    if match:
        monthly = float(match.group(1)) / 12
        return f"{monthly:.2f} pm"

    # If none of the cases match, return original string
    return rate_str

    
def convertLoanAmountRange(loan_amount):
    """
    Converts a loan amount range from string format (with k/M) to a numeric range.
    
    Example:
        "10k - 50k" → "10000 - 50000"
        "1M - 2M"   → "1000000 - 2000000"
        "5k"        → "5000 - 5000"
    
    Parameters:
        loan_amount (str): Loan amount range as a string.
    
    Returns:
        str: Converted range in numeric format, e.g., "10000 - 50000"
    """
    if not isinstance(loan_amount, str) or not loan_amount.strip():
        return "N/A"

    # Extract numeric values and their units (k or M)
    match = re.findall(r'([\d\.]+)([kM]?)', loan_amount)

    if not match:
        return "N/A"

    def convert(value, unit):
        multiplier = 1000 if unit == "k" else 1000000 if unit == "M" else 1
        return int(float(value) * multiplier)

    # Convert extracted values
    lower_limit = convert(match[0][0], match[0][1])
    upper_limit = convert(match[1][0], match[1][1]) if len(match) > 1 else lower_limit

    return f"{lower_limit} - {upper_limit}"


# Define lender tiers
tier_1 = ["Funding Circle", "Lending Crowd", "Momenta", "Iwoca", "Nucleus", "Shawbrook"]
tier_2 = ["Fleximize", "Swishfund", "Mycashline"]
tier_3 = ["Maxcap", "Capify", "GotCap"]

# Create a dictionary to store lender data
lender_data = {}

# Iterate over lenders to extract their corresponding values
for idx, lender in enumerate(lender_names):
    print('lender',lender,'rate',convert_rates(df.iloc[5, idx + 1]))
    lender_data[lender] = {
        "Net Assets > 0": df.iloc[2, idx + 1],  # Row index 2, respective column
        "Loan Amount": convertLoanAmountRange(df.iloc[3, idx + 1]),
        "Term": convertTermToMonths(df.iloc[4, idx + 1]),
        "Rates": convert_rates(df.iloc[5, idx + 1]),
        "Monthly Repayment": df.iloc[6, idx + 1],
        "Min Trading Time": df.iloc[7, idx + 1],
        "Tier": "Tier 1" if lender in tier_1 else "Tier 2" if lender in tier_2 else "Tier 3"
    }

# Save as JSON file
json_output = "lender_criteria.json"
with open(json_output, "w") as json_file:
    json.dump(lender_data, json_file, indent=4)

print(f"Lender criteria extracted and saved to {json_output}")
