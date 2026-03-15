"""Load synthetic EPA GHGRP facility data for demo companies."""

import sqlite3
import os
import random

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "carbonlens.db")

# ---------------------------------------------------------------------------
# Helper: given total emissions, split into CO2 / CH4 / N2O
# ---------------------------------------------------------------------------

def split_emissions(total, ch4_pct=0.04, n2o_pct=0.005):
    """Return (co2, ch4, n2o) that sum to total."""
    ch4 = round(total * ch4_pct, 4)
    n2o = round(total * n2o_pct, 4)
    co2 = round(total - ch4 - n2o, 4)
    return co2, ch4, n2o


# ---------------------------------------------------------------------------
# ExxonMobil - multi-year (2021-2023), ~45 facilities per year
# Target total per year: ~73 MtCO2e (slight trend: 75 → 73 → 71)
# ---------------------------------------------------------------------------

EXXON_FACILITIES = [
    # (facility_name, parent_company, city, state, lat, lon, naics, sector, base_emissions)
    ("Baytown Olefins Plant",             "Exxon Mobil Corporation", "Baytown",       "TX", 29.735, -94.977, "324110", "Petroleum Refining",       12.00),
    ("Baton Rouge Refinery",              "Exxon Mobil Corporation", "Baton Rouge",   "LA", 30.452, -91.132, "324110", "Petroleum Refining",        8.00),
    ("Beaumont Refinery",                 "Exxon Mobil Corporation", "Beaumont",      "TX", 30.080, -94.126, "324110", "Petroleum Refining",        6.00),
    ("Baytown Refinery",                  "Exxon Mobil Corporation", "Baytown",       "TX", 29.748, -94.990, "324110", "Petroleum Refining",        5.50),
    ("Joliet Refinery",                   "Exxon Mobil Corporation", "Channahon",     "IL", 41.430, -88.190, "324110", "Petroleum Refining",        3.20),
    ("Billings Refinery",                 "Exxon Mobil Corporation", "Billings",      "MT", 45.783, -108.50, "324110", "Petroleum Refining",        2.80),
    ("Torrance Refinery",                 "Exxon Mobil Corporation", "Torrance",      "CA", 33.830, -118.34, "324110", "Petroleum Refining",        2.50),
    ("Chalmette Refinery",               "Exxon Mobil Corporation", "Chalmette",     "LA", 29.945, -89.960, "324110", "Petroleum Refining",        2.30),
    ("Baton Rouge Chemical Plant",        "Exxon Mobil Corporation", "Baton Rouge",   "LA", 30.460, -91.120, "325110", "Chemical Manufacturing",    3.80),
    ("Baytown Chemical Plant",            "Exxon Mobil Corporation", "Baytown",       "TX", 29.740, -94.985, "325110", "Chemical Manufacturing",    3.00),
    ("Beaumont Chemical Plant",           "Exxon Mobil Corporation", "Beaumont",      "TX", 30.075, -94.130, "325110", "Chemical Manufacturing",    1.80),
    ("Mont Belvieu Plastics Plant",       "Exxon Mobil Corporation", "Mont Belvieu",  "TX", 29.850, -94.880, "325211", "Plastics Manufacturing",    1.50),
    ("Cedar Bayou Plant",                 "Exxon Mobil Corporation", "Baytown",       "TX", 29.780, -94.930, "325110", "Chemical Manufacturing",    1.20),
    ("Baton Rouge Polyolefins Plant",     "Exxon Mobil Corporation", "Baton Rouge",   "LA", 30.455, -91.140, "325211", "Plastics Manufacturing",    0.95),
    ("XTO Energy - Permian Basin Ops",    "XTO Energy",             "Midland",       "TX", 31.997, -102.08, "211120", "Natural Gas Processing",    2.40),
    ("XTO Energy - Barnett Shale Ops",    "XTO Energy",             "Fort Worth",    "TX", 32.750, -97.330, "211120", "Natural Gas Processing",    1.80),
    ("XTO Energy - Marcellus Ops",        "XTO Energy",             "Morgantown",    "WV", 39.630, -79.955, "211120", "Natural Gas Processing",    1.50),
    ("XTO Energy - Woodford Shale Ops",   "XTO Energy",             "Ada",           "OK", 34.775, -96.678, "211120", "Natural Gas Processing",    1.10),
    ("XTO Energy - Haynesville Ops",      "XTO Energy",             "Shreveport",    "LA", 32.525, -93.750, "211120", "Natural Gas Processing",    0.85),
    ("XTO Energy - Bakken Ops",           "XTO Energy",             "Williston",     "ND", 48.147, -103.62, "211120", "Natural Gas Processing",    0.70),
    ("XTO Energy - Piceance Basin Ops",   "XTO Energy",             "Rifle",         "CO", 39.535, -107.78, "211120", "Natural Gas Processing",    0.55),
    ("Shute Creek Gas Processing",        "Exxon Mobil Corporation", "Opal",          "WY", 41.770, -110.32, "211130", "Natural Gas Processing",    1.60),
    ("King Ranch Gas Plant",              "Exxon Mobil Corporation", "Kingsville",    "TX", 27.516, -97.856, "211130", "Natural Gas Processing",    0.90),
    ("Hawkins Gas Plant",                 "Exxon Mobil Corporation", "Hawkins",       "TX", 32.590, -95.200, "211130", "Natural Gas Processing",    0.65),
    ("Sour Lake Terminal",                "Exxon Mobil Corporation", "Sour Lake",     "TX", 30.140, -94.410, "486110", "Pipeline Transportation",   0.30),
    ("Houston Lubricants Plant",          "Exxon Mobil Corporation", "Houston",       "TX", 29.760, -95.370, "324191", "Lubricant Manufacturing",   0.45),
    ("Paulsboro Refinery",               "Exxon Mobil Corporation", "Paulsboro",     "NJ", 39.830, -75.230, "324110", "Petroleum Refining",        1.10),
    ("Sarnia Chemicals (US reporting)",   "Exxon Mobil Corporation", "Port Huron",    "MI", 42.970, -82.425, "325110", "Chemical Manufacturing",    0.85),
    ("Pensacola Chemical Plant",          "Exxon Mobil Corporation", "Pensacola",     "FL", 30.443, -87.195, "325110", "Chemical Manufacturing",    0.60),
    ("Baton Rouge Lubricants",            "Exxon Mobil Corporation", "Baton Rouge",   "LA", 30.448, -91.128, "324191", "Lubricant Manufacturing",   0.40),
    ("Baytown Power Cogeneration",        "Exxon Mobil Corporation", "Baytown",       "TX", 29.742, -94.982, "221112", "Power Generation",          0.75),
    ("Beaumont Power Cogeneration",       "Exxon Mobil Corporation", "Beaumont",      "TX", 30.082, -94.128, "221112", "Power Generation",          0.55),
    ("Baton Rouge Cogeneration",          "Exxon Mobil Corporation", "Baton Rouge",   "LA", 30.458, -91.125, "221112", "Power Generation",          0.50),
    ("Joliet Cogeneration",              "Exxon Mobil Corporation", "Channahon",     "IL", 41.432, -88.192, "221112", "Power Generation",          0.30),
    ("Fairfax Refinery",                 "Exxon Mobil Corporation", "Kansas City",   "KS", 39.115, -94.640, "324110", "Petroleum Refining",        0.80),
    ("Santa Ynez Offshore Ops",          "Exxon Mobil Corporation", "Lompoc",        "CA", 34.750, -120.47, "211120", "Oil Extraction",            0.35),
    ("Hebron Offshore (US reporting)",    "Exxon Mobil Corporation", "Houston",       "TX", 29.760, -95.370, "211120", "Oil Extraction",            0.28),
    ("LaBarge Gas Plant",                "Exxon Mobil Corporation", "Big Piney",     "WY", 42.540, -110.10, "211130", "Natural Gas Processing",    0.52),
    ("Mobile Chemical Plant",            "Exxon Mobil Corporation", "Mobile",        "AL", 30.695, -88.040, "325110", "Chemical Manufacturing",    0.48),
    ("Bayway Refinery",                  "Exxon Mobil Corporation", "Linden",        "NJ", 40.645, -74.240, "324110", "Petroleum Refining",        1.40),
    ("Fife Ethylene Plant",              "Exxon Mobil Corporation", "Fife",          "WA", 47.228, -122.36, "325110", "Chemical Manufacturing",    0.35),
    ("Coral Gables Research",            "Exxon Mobil Corporation", "Annandale",     "NJ", 40.650, -74.880, "541710", "R&D Facility",              0.08),
    ("Houston Campus",                   "Exxon Mobil Corporation", "Spring",        "TX", 30.065, -95.450, "551114", "Corporate HQ",              0.12),
    ("Clinton Township Terminal",        "Exxon Mobil Corporation", "Clinton Twp",   "NJ", 40.640, -74.840, "493190", "Storage",                   0.06),
    ("Chalmette Power Cogen",            "Exxon Mobil Corporation", "Chalmette",     "LA", 29.948, -89.958, "221112", "Power Generation",          0.38),
]

# Year multipliers to simulate a slight downward trend
EXXON_YEAR_MULT = {2021: 1.03, 2022: 1.00, 2023: 0.97}


# ---------------------------------------------------------------------------
# Shell - single year (2022), ~30 facilities, total ~45 MtCO2e
# ---------------------------------------------------------------------------

SHELL_FACILITIES = [
    ("Deer Park Refinery",               "Shell Oil Company",      "Deer Park",     "TX", 29.670, -95.130, "324110", "Petroleum Refining",        6.50),
    ("Norco Manufacturing Complex",      "Shell Oil Company",      "Norco",         "LA", 29.985, -90.410, "324110", "Petroleum Refining",        5.20),
    ("Convent Refinery",                 "Shell Oil Company",      "Convent",       "LA", 30.025, -90.830, "324110", "Petroleum Refining",        4.80),
    ("Puget Sound Refinery",             "Shell Oil Company",      "Anacortes",     "WA", 48.510, -122.61, "324110", "Petroleum Refining",        3.10),
    ("Martinez Refinery",                "Shell Oil Company",      "Martinez",      "CA", 38.020, -122.13, "324110", "Petroleum Refining",        2.90),
    ("Geismar Chemical Plant",           "Shell Chemical LP",      "Geismar",       "LA", 30.215, -91.010, "325110", "Chemical Manufacturing",    2.50),
    ("Deer Park Chemical Plant",         "Shell Chemical LP",      "Deer Park",     "TX", 29.672, -95.128, "325110", "Chemical Manufacturing",    2.00),
    ("Norco Chemical Plant",             "Shell Chemical LP",      "Norco",         "LA", 29.988, -90.415, "325110", "Chemical Manufacturing",    1.70),
    ("Shell Appalachia - Monaca",        "Shell USA, Inc.",        "Monaca",        "PA", 40.680, -80.370, "325211", "Plastics Manufacturing",    1.80),
    ("Permian Basin Ops",                "Shell Oil Company",      "Midland",       "TX", 31.995, -102.07, "211120", "Oil Extraction",            2.10),
    ("Gulf of Mexico Platform A",        "Shell Oil Company",      "offshore",      "LA", 28.700, -89.500, "211120", "Oil Extraction",            1.50),
    ("Gulf of Mexico Platform B",        "Shell Oil Company",      "offshore",      "LA", 28.550, -88.900, "211120", "Oil Extraction",            1.20),
    ("Gulf of Mexico Platform C",        "Shell Oil Company",      "offshore",      "LA", 28.400, -89.200, "211120", "Oil Extraction",            0.90),
    ("Sweeny Refinery",                  "Shell Oil Company",      "Old Ocean",     "TX", 29.140, -95.740, "324110", "Petroleum Refining",        1.60),
    ("Zydeco Pipeline Ops",              "Shell Pipeline Company", "Houston",       "TX", 29.760, -95.370, "486110", "Pipeline Transportation",   0.65),
    ("Mars Pipeline Ops",                "Shell Pipeline Company", "Fourchon",      "LA", 29.100, -90.200, "486110", "Pipeline Transportation",   0.55),
    ("Shell Deer Park Cogeneration",     "Shell Oil Company",      "Deer Park",     "TX", 29.668, -95.132, "221112", "Power Generation",          1.10),
    ("Shell Norco Cogeneration",         "Shell Oil Company",      "Norco",         "LA", 29.983, -90.408, "221112", "Power Generation",          0.80),
    ("Mobile Bay Gas Plant",             "Shell Oil Company",      "Coden",         "AL", 30.380, -88.240, "211130", "Natural Gas Processing",    0.70),
    ("Shell Denver Upstream Office",     "Shell Oil Company",      "Denver",        "CO", 39.740, -104.99, "211120", "Oil Extraction",            0.08),
    ("Lost Hills Oil Field",             "Shell Oil Company",      "Lost Hills",    "CA", 35.610, -119.69, "211120", "Oil Extraction",            0.55),
    ("Aera Energy - Belridge",           "Shell Oil Company",      "McKittrick",    "CA", 35.300, -119.62, "211120", "Oil Extraction",            0.48),
    ("Anacortes Cogeneration",           "Shell Oil Company",      "Anacortes",     "WA", 48.512, -122.60, "221112", "Power Generation",          0.40),
    ("Shell Catalysts - Pasadena",       "Shell USA, Inc.",        "Pasadena",      "TX", 29.690, -95.170, "325180", "Chemical Manufacturing",    0.35),
    ("Convent Cogeneration",             "Shell Oil Company",      "Convent",       "LA", 30.027, -90.832, "221112", "Power Generation",          0.55),
    ("Shell Scotford (US reporting)",    "Shell USA, Inc.",        "Houston",       "TX", 29.760, -95.370, "324110", "Petroleum Refining",        0.42),
    ("Martinez Cogeneration",            "Shell Oil Company",      "Martinez",      "CA", 38.022, -122.13, "221112", "Power Generation",          0.35),
    ("Sweeny Cogeneration",              "Shell Oil Company",      "Old Ocean",     "TX", 29.142, -95.738, "221112", "Power Generation",          0.25),
    ("Shell Houston Campus",             "Shell USA, Inc.",        "Houston",       "TX", 29.720, -95.390, "551114", "Corporate HQ",              0.10),
    ("Geismar Cogeneration",             "Shell Chemical LP",      "Geismar",       "LA", 30.217, -91.012, "221112", "Power Generation",          0.45),
]


# ---------------------------------------------------------------------------
# Amazon - single year (2022), ~15 data centers, total ~5 MtCO2e
# ---------------------------------------------------------------------------

AMAZON_FACILITIES = [
    ("AWS US-East-1 (N. Virginia) DC-A",    "Amazon Data Services", "Ashburn",       "VA", 39.040, -77.490, "518210", "Data Center",  0.72),
    ("AWS US-East-1 (N. Virginia) DC-B",    "Amazon Data Services", "Ashburn",       "VA", 39.045, -77.485, "518210", "Data Center",  0.68),
    ("AWS US-East-1 (N. Virginia) DC-C",    "Amazon Data Services", "Manassas",      "VA", 38.750, -77.480, "518210", "Data Center",  0.55),
    ("AWS US-East-2 (Ohio) DC-A",           "Amazon Data Services", "Columbus",      "OH", 39.960, -82.998, "518210", "Data Center",  0.42),
    ("AWS US-East-2 (Ohio) DC-B",           "Amazon Data Services", "New Albany",    "OH", 40.080, -82.800, "518210", "Data Center",  0.38),
    ("AWS US-West-2 (Oregon) DC-A",         "Amazon Data Services", "Boardman",      "OR", 45.840, -119.70, "518210", "Data Center",  0.35),
    ("AWS US-West-2 (Oregon) DC-B",         "Amazon Data Services", "Umatilla",      "OR", 45.920, -119.34, "518210", "Data Center",  0.30),
    ("AWS US-West-1 (N. California) DC-A",  "Amazon Data Services", "San Jose",      "CA", 37.340, -121.89, "518210", "Data Center",  0.28),
    ("AWS GovCloud West DC-A",              "Amazon Data Services", "Boardman",      "OR", 45.845, -119.71, "518210", "Data Center",  0.22),
    ("Amazon DEN Fulfillment Center",       "Amazon.com Services LLC", "Aurora",     "CO", 39.730, -104.83, "493110", "Warehousing",  0.15),
    ("Amazon BFI4 Fulfillment Center",      "Amazon.com Services LLC", "Kent",       "WA", 47.380, -122.23, "493110", "Warehousing",  0.18),
    ("Amazon JFK8 Fulfillment Center",      "Amazon.com Services LLC", "Staten Island","NY",40.580, -74.170, "493110", "Warehousing",  0.20),
    ("Amazon MKE1 Fulfillment Center",      "Amazon.com Services LLC", "Kenosha",    "WI", 42.580, -87.820, "493110", "Warehousing",  0.14),
    ("Amazon MDW2 Sortation Center",        "Amazon.com Services LLC", "Joliet",     "IL", 41.530, -88.160, "493110", "Warehousing",  0.12),
    ("Amazon SEA HQ Campus",                "Amazon.com Inc",       "Seattle",       "WA", 47.620, -122.34, "551114", "Corporate HQ", 0.05),
]


# ---------------------------------------------------------------------------
# Chevron - single year (2022), ~35 facilities, total ~55 MtCO2e
# ---------------------------------------------------------------------------

CHEVRON_FACILITIES = [
    ("Pascagoula Refinery",              "Chevron U.S.A. Inc.",           "Pascagoula",   "MS", 30.360, -88.530, "324110", "Petroleum Refining",       5.80),
    ("El Segundo Refinery",              "Chevron U.S.A. Inc.",           "El Segundo",   "CA", 33.910, -118.40, "324110", "Petroleum Refining",       5.20),
    ("Richmond Refinery",                "Chevron U.S.A. Inc.",           "Richmond",     "CA", 37.930, -122.38, "324110", "Petroleum Refining",       4.60),
    ("Salt Lake City Refinery",          "Chevron U.S.A. Inc.",           "Salt Lake City","UT",40.790, -111.92, "324110", "Petroleum Refining",       2.10),
    ("El Paso Refinery",                 "Chevron U.S.A. Inc.",           "El Paso",      "TX", 31.760, -106.44, "324110", "Petroleum Refining",       1.50),
    ("Kapolei Refinery",                 "Chevron U.S.A. Inc.",           "Kapolei",      "HI", 21.320, -158.09, "324110", "Petroleum Refining",       1.20),
    ("Chevron Phillips - Cedar Bayou",   "Chevron Phillips Chemical",     "Baytown",      "TX", 29.785, -94.925, "325110", "Chemical Manufacturing",   3.50),
    ("Chevron Phillips - Sweeny",        "Chevron Phillips Chemical",     "Old Ocean",    "TX", 29.145, -95.745, "325110", "Chemical Manufacturing",   2.80),
    ("Chevron Phillips - Port Arthur",   "Chevron Phillips Chemical",     "Port Arthur",  "TX", 29.890, -93.930, "325110", "Chemical Manufacturing",   2.20),
    ("Chevron Phillips - Orange",        "Chevron Phillips Chemical",     "Orange",       "TX", 30.093, -93.740, "325211", "Plastics Manufacturing",   1.50),
    ("Chevron Phillips - Borger",        "Chevron Phillips Chemical",     "Borger",       "TX", 35.660, -101.40, "325110", "Chemical Manufacturing",   1.10),
    ("Permian Basin - Midland Ops",      "Chevron U.S.A. Inc.",           "Midland",      "TX", 32.000, -102.08, "211120", "Oil Extraction",           3.20),
    ("Permian Basin - Delaware Ops",     "Chevron U.S.A. Inc.",           "Pecos",        "TX", 31.420, -103.49, "211120", "Oil Extraction",           2.50),
    ("San Joaquin Valley Ops",           "Chevron U.S.A. Inc.",           "Bakersfield",  "CA", 35.370, -119.02, "211120", "Oil Extraction",           1.90),
    ("DJ Basin Ops",                     "Chevron U.S.A. Inc.",           "Greeley",      "CO", 40.420, -104.71, "211120", "Oil Extraction",           1.10),
    ("Gulf of Mexico - Jack/St. Malo",   "Chevron U.S.A. Inc.",           "offshore",     "LA", 28.250, -89.100, "211120", "Oil Extraction",           1.80),
    ("Gulf of Mexico - Tahiti Platform", "Chevron U.S.A. Inc.",           "offshore",     "LA", 28.100, -89.800, "211120", "Oil Extraction",           1.30),
    ("Gulf of Mexico - Big Foot",        "Chevron U.S.A. Inc.",           "offshore",     "LA", 27.900, -89.500, "211120", "Oil Extraction",           0.95),
    ("Gulf of Mexico - Anchor",          "Chevron U.S.A. Inc.",           "offshore",     "LA", 28.000, -89.300, "211120", "Oil Extraction",           0.70),
    ("Carter Creek Gas Plant",           "Chevron U.S.A. Inc.",           "Evanston",     "WY", 41.260, -110.96, "211130", "Natural Gas Processing",   1.40),
    ("Lost Cabin Gas Plant",             "Chevron U.S.A. Inc.",           "Lysite",       "WY", 43.230, -107.68, "211130", "Natural Gas Processing",   0.90),
    ("Anse La Butte Gas Plant",          "Chevron U.S.A. Inc.",           "Breaux Bridge","LA", 30.270, -91.900, "211130", "Natural Gas Processing",   0.65),
    ("El Segundo Cogeneration",          "Chevron U.S.A. Inc.",           "El Segundo",   "CA", 33.912, -118.40, "221112", "Power Generation",         0.85),
    ("Richmond Cogeneration",            "Chevron U.S.A. Inc.",           "Richmond",     "CA", 37.932, -122.38, "221112", "Power Generation",         0.70),
    ("Pascagoula Cogeneration",          "Chevron U.S.A. Inc.",           "Pascagoula",   "MS", 30.362, -88.530, "221112", "Power Generation",         0.60),
    ("Pascagoula Hydrogen Plant",        "Chevron U.S.A. Inc.",           "Pascagoula",   "MS", 30.365, -88.535, "325120", "Gas Manufacturing",        0.50),
    ("El Segundo Hydrogen Plant",        "Chevron U.S.A. Inc.",           "El Segundo",   "CA", 33.908, -118.39, "325120", "Gas Manufacturing",        0.45),
    ("Chevron Shipping - Long Beach",    "Chevron U.S.A. Inc.",           "Long Beach",   "CA", 33.770, -118.19, "483111", "Marine Transport",         0.30),
    ("Chevron Pipeline - Gulf",          "Chevron U.S.A. Inc.",           "Houston",      "TX", 29.760, -95.370, "486110", "Pipeline Transportation",  0.40),
    ("Chevron Pipeline - Rockies",       "Chevron U.S.A. Inc.",           "Rangely",      "CO", 40.085, -108.80, "486110", "Pipeline Transportation",  0.25),
    ("Questa CO2 Plant",                 "Chevron U.S.A. Inc.",           "Questa",       "NM", 36.700, -105.59, "211130", "Natural Gas Processing",   0.35),
    ("Chevron Houston Campus",           "Chevron Corporation",           "Houston",      "TX", 29.740, -95.370, "551114", "Corporate HQ",             0.10),
    ("Chevron San Ramon Campus",         "Chevron Corporation",           "San Ramon",    "CA", 37.770, -121.96, "551114", "Corporate HQ",             0.08),
    ("Richmond Lubricants Plant",        "Chevron U.S.A. Inc.",           "Richmond",     "CA", 37.928, -122.37, "324191", "Lubricant Manufacturing",  0.25),
    ("Pascagoula Lubricants Plant",      "Chevron U.S.A. Inc.",           "Pascagoula",   "MS", 30.358, -88.528, "324191", "Lubricant Manufacturing",  0.20),
]


def build_rows(facilities, year, year_mult=1.0, ch4_pct=0.04, n2o_pct=0.005):
    """Build a list of tuples ready for INSERT from a facility template list."""
    rows = []
    for (name, parent, city, state, lat, lon, naics, sector, base_em) in facilities:
        # Add small random jitter so each year isn't identical
        jitter = random.uniform(0.97, 1.03)
        total = round(base_em * year_mult * jitter, 4)
        co2, ch4, n2o = split_emissions(total, ch4_pct, n2o_pct)
        rows.append((name, parent, city, state, lat, lon, naics, sector,
                      year, total, co2, ch4, n2o))
    return rows


def main():
    random.seed(42)  # reproducible

    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}. Run init_database.py first.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Clear existing data
    cur.execute("DELETE FROM ghgrp_facilities")

    all_rows = []

    # ExxonMobil - 3 years with CH4 higher for oil/gas
    for year, mult in EXXON_YEAR_MULT.items():
        all_rows.extend(build_rows(EXXON_FACILITIES, year, mult, ch4_pct=0.06, n2o_pct=0.004))

    # Shell - 2022 only
    all_rows.extend(build_rows(SHELL_FACILITIES, 2022, 1.0, ch4_pct=0.05, n2o_pct=0.004))

    # Amazon - 2022 only, negligible CH4/N2O for data centers
    all_rows.extend(build_rows(AMAZON_FACILITIES, 2022, 1.0, ch4_pct=0.002, n2o_pct=0.001))

    # Chevron - 2022 only
    all_rows.extend(build_rows(CHEVRON_FACILITIES, 2022, 1.0, ch4_pct=0.055, n2o_pct=0.004))

    cur.executemany("""
        INSERT INTO ghgrp_facilities
            (facility_name, parent_company, city, state, latitude, longitude,
             naics_code, industry_sector, reporting_year,
             total_emissions_mtco2e, co2_emissions, methane_emissions, n2o_emissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, all_rows)

    conn.commit()

    # Summary
    print(f"Inserted {len(all_rows)} total facility-year rows.\n")
    print(f"{'Company':<30} {'Facilities':>10} {'Years':>8} {'Total MtCO2e':>14}")
    print("-" * 65)

    cur.execute("""
        SELECT parent_company,
               COUNT(*) as cnt,
               COUNT(DISTINCT reporting_year) as yrs,
               ROUND(SUM(total_emissions_mtco2e), 2)
        FROM ghgrp_facilities
        GROUP BY parent_company
        ORDER BY SUM(total_emissions_mtco2e) DESC
    """)
    grand_total = 0
    for parent, cnt, yrs, total in cur.fetchall():
        print(f"  {parent:<28} {cnt:>10} {yrs:>8} {total:>14.2}")
        grand_total += total

    # Also show grouped by canonical company (Exxon has XTO)
    print(f"\n{'':=<65}")
    print("Grouped by canonical company (including aliases):\n")
    for canonical, year_label, where_clause in [
        ("ExxonMobil", "2021-2023", "parent_company IN ('Exxon Mobil Corporation','XTO Energy')"),
        ("Shell",      "2022",      "parent_company IN ('Shell Oil Company','Shell Chemical LP','Shell USA, Inc.','Shell Pipeline Company')"),
        ("Amazon",     "2022",      "parent_company IN ('Amazon Data Services','Amazon.com Services LLC','Amazon.com Inc')"),
        ("Chevron",    "2022",      "parent_company IN ('Chevron U.S.A. Inc.','Chevron Phillips Chemical','Chevron Corporation')"),
    ]:
        cur.execute(f"""
            SELECT COUNT(DISTINCT facility_name), COUNT(*),
                   ROUND(SUM(total_emissions_mtco2e), 2)
            FROM ghgrp_facilities WHERE {where_clause}
        """)
        n_fac, n_rows, total = cur.fetchone()
        print(f"  {canonical:<15} {year_label:<12} {n_fac:>3} facilities  {n_rows:>4} rows  {total:>10.2f} MtCO2e")

    # ExxonMobil year-over-year
    print("\nExxonMobil year-over-year trend:")
    cur.execute("""
        SELECT reporting_year, COUNT(*), ROUND(SUM(total_emissions_mtco2e), 2)
        FROM ghgrp_facilities
        WHERE parent_company IN ('Exxon Mobil Corporation','XTO Energy')
        GROUP BY reporting_year ORDER BY reporting_year
    """)
    for yr, cnt, total in cur.fetchall():
        print(f"  {yr}: {cnt} facilities, {total:.2f} MtCO2e")

    conn.close()
    print(f"\nDone. Database: {os.path.abspath(DB_PATH)}")


if __name__ == "__main__":
    main()
