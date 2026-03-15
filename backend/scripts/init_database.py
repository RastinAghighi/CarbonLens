"""Initialize the CarbonLens SQLite database with schema and seed data."""

import sqlite3
import os

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "carbonlens.db")


def create_tables(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS eeio_factors (
            id INTEGER PRIMARY KEY,
            sector_code TEXT,
            sector_name TEXT,
            ef_kgco2e_per_usd REAL,
            ef_year INTEGER,
            source TEXT DEFAULT 'EPA_EEIO'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS defra_factors (
            id INTEGER PRIMARY KEY,
            category TEXT,
            subcategory TEXT,
            unit TEXT,
            ef_value REAL,
            ef_year INTEGER,
            source TEXT DEFAULT 'DEFRA'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ghgrp_facilities (
            id INTEGER PRIMARY KEY,
            facility_name TEXT,
            parent_company TEXT,
            city TEXT,
            state TEXT,
            latitude REAL,
            longitude REAL,
            naics_code TEXT,
            industry_sector TEXT,
            reporting_year INTEGER,
            total_emissions_mtco2e REAL,
            co2_emissions REAL,
            methane_emissions REAL,
            n2o_emissions REAL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS industry_benchmarks (
            id INTEGER PRIMARY KEY,
            sector TEXT,
            avg_intensity_tco2e_per_m_revenue REAL,
            median_intensity REAL,
            p25_intensity REAL,
            p75_intensity REAL,
            sample_size INTEGER,
            source TEXT,
            year INTEGER
        )
    """)


def seed_industry_benchmarks(cur):
    """Populate from SECTOR_INTENSITIES in ARCHITECTURE.md."""
    rows = [
        # (sector, avg_intensity, median, p25, p75, sample_size, source, year)
        ("Oil & Gas - Integrated",          210,  195,  150,  270,  12, "IEA/EPA", 2022),
        ("Oil & Gas - Exploration & Production", 280, 260, 200, 350, 15, "IEA/EPA", 2022),
        ("Technology - Internet Services",   15,   12,    8,   20,  20, "EPA EEIO", 2022),
        ("Technology - Hardware",            25,   22,   15,   33,  18, "EPA EEIO", 2022),
        ("Technology - Software",             8,    7,    4,   12,  25, "EPA EEIO", 2022),
        ("Utilities - Electric",            900,  850,  600, 1200,  30, "EPA",      2022),
        ("Automotive",                       35,   32,   20,   48,  14, "EPA EEIO", 2022),
        ("Airlines",                        350,  330,  280,  420,  10, "IEA",      2022),
        ("Cement & Building Materials",     800,  750,  600, 1000,   8, "EPA",      2022),
        ("Steel & Metals",                  450,  420,  320,  580,  11, "EPA",      2022),
        ("Retail - General",                 10,    9,    5,   14,  22, "EPA EEIO", 2022),
        ("Pharmaceuticals",                  15,   13,    8,   20,  16, "EPA EEIO", 2022),
        ("Financial Services",                5,    4,    2,    7,  35, "EPA EEIO", 2022),
        ("Food & Beverage",                  45,   40,   28,   60,  19, "EPA EEIO", 2022),
        ("Chemicals",                       200,  185,  130,  270,  13, "EPA",      2022),
    ]
    cur.executemany("""
        INSERT INTO industry_benchmarks
            (sector, avg_intensity_tco2e_per_m_revenue, median_intensity,
             p25_intensity, p75_intensity, sample_size, source, year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    return len(rows)


def seed_eeio_factors(cur):
    """~35 representative EPA EEIO spend-based emission factors (kgCO2e per USD)."""
    rows = [
        # (sector_code, sector_name, ef_kgco2e_per_usd, ef_year)
        ("324110", "Petroleum refineries",                   1.28,  2022),
        ("324190", "Other petroleum and coal products",      0.95,  2022),
        ("211120", "Crude petroleum extraction",             0.82,  2022),
        ("221100", "Electric power generation",              1.76,  2022),
        ("221200", "Natural gas distribution",               0.98,  2022),
        ("331110", "Iron and steel mills",                   1.42,  2022),
        ("331310", "Alumina and aluminum production",        1.65,  2022),
        ("331400", "Nonferrous metal production",            0.89,  2022),
        ("325110", "Petrochemical manufacturing",            1.15,  2022),
        ("325211", "Plastics material and resin mfg",        0.92,  2022),
        ("325400", "Pharmaceutical and medicine mfg",        0.18,  2022),
        ("326100", "Plastics product manufacturing",         0.58,  2022),
        ("327310", "Cement manufacturing",                   1.82,  2022),
        ("327400", "Lime and gypsum product mfg",            1.35,  2022),
        ("334400", "Semiconductor and electronic component", 0.35,  2022),
        ("334410", "Semiconductor manufacturing",            0.38,  2022),
        ("334412", "Bare printed circuit board mfg",         0.42,  2022),
        ("334100", "Computer and peripheral equipment",      0.22,  2022),
        ("336100", "Motor vehicle manufacturing",            0.44,  2022),
        ("336400", "Aerospace product and parts mfg",        0.32,  2022),
        ("481000", "Air transportation",                     1.10,  2022),
        ("484000", "Truck transportation",                   0.75,  2022),
        ("483000", "Water transportation (ocean freight)",   0.40,  2022),
        ("482000", "Rail transportation",                    0.30,  2022),
        ("493000", "Warehousing and storage",                0.25,  2022),
        ("511200", "Software publishers",                    0.06,  2022),
        ("518200", "Data processing and hosting",            0.12,  2022),
        ("541100", "Legal services",                         0.08,  2022),
        ("541600", "Management consulting services",         0.10,  2022),
        ("541700", "Scientific research and development",    0.14,  2022),
        ("522000", "Financial services (banking)",           0.05,  2022),
        ("524100", "Insurance carriers",                     0.06,  2022),
        ("722500", "Restaurants and food services",          0.48,  2022),
        ("424100", "Paper and paper product wholesalers",    0.35,  2022),
        ("453200", "Office supplies and stationery stores",  0.30,  2022),
        ("311000", "Food manufacturing",                     0.52,  2022),
        ("312100", "Beverage manufacturing",                 0.38,  2022),
    ]
    cur.executemany("""
        INSERT INTO eeio_factors (sector_code, sector_name, ef_kgco2e_per_usd, ef_year)
        VALUES (?, ?, ?, ?)
    """, rows)
    return len(rows)


def seed_defra_factors(cur):
    """~20 common DEFRA activity-based emission factors."""
    rows = [
        # (category, subcategory, unit, ef_value, ef_year)
        ("Electricity",     "UK grid average",              "kgCO2e/kWh",         0.233,  2023),
        ("Electricity",     "US grid average",              "kgCO2e/kWh",         0.417,  2023),
        ("Electricity",     "Renewable (market-based)",     "kgCO2e/kWh",         0.0,    2023),
        ("Natural Gas",     "Combustion",                   "kgCO2e/therm",       5.31,   2023),
        ("Natural Gas",     "Combustion",                   "kgCO2e/kWh",         0.182,  2023),
        ("Air Travel",      "Domestic (average)",           "kgCO2e/passenger-km", 0.246, 2023),
        ("Air Travel",      "Short-haul international",     "kgCO2e/passenger-km", 0.156, 2023),
        ("Air Travel",      "Long-haul international",      "kgCO2e/passenger-km", 0.195, 2023),
        ("Air Travel",      "Domestic (with RF)",           "kgCO2e/passenger-km", 0.428, 2023),
        ("Air Travel",      "Long-haul intl (with RF)",     "kgCO2e/passenger-km", 0.339, 2023),
        ("Hotel",           "UK hotel night",               "kgCO2e/night",       10.4,   2023),
        ("Hotel",           "Average hotel night",          "kgCO2e/night",       13.9,   2023),
        ("Car Rental",      "Average car (unknown fuel)",   "kgCO2e/km",          0.171,  2023),
        ("Car Rental",      "Medium diesel car",            "kgCO2e/km",          0.165,  2023),
        ("Car Rental",      "Medium petrol car",            "kgCO2e/km",          0.175,  2023),
        ("Freight",         "HGV - all diesel",             "kgCO2e/tonne-km",    0.115,  2023),
        ("Freight",         "Truck (articulated >33t)",     "kgCO2e/tonne-km",    0.089,  2023),
        ("Freight",         "Ocean freight (container)",    "kgCO2e/tonne-km",    0.016,  2023),
        ("Freight",         "Ocean freight (bulk carrier)", "kgCO2e/tonne-km",    0.005,  2023),
        ("Freight",         "Rail freight",                 "kgCO2e/tonne-km",    0.028,  2023),
        ("Freight",         "Air freight (domestic)",       "kgCO2e/tonne-km",    1.128,  2023),
        ("Freight",         "Air freight (international)",  "kgCO2e/tonne-km",    0.602,  2023),
    ]
    cur.executemany("""
        INSERT INTO defra_factors (category, subcategory, unit, ef_value, ef_year)
        VALUES (?, ?, ?, ?, ?)
    """, rows)
    return len(rows)


def main():
    os.makedirs(DB_DIR, exist_ok=True)

    # Remove existing DB to start fresh
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    create_tables(cur)
    print("Created 4 tables: eeio_factors, defra_factors, ghgrp_facilities, industry_benchmarks")

    n_benchmarks = seed_industry_benchmarks(cur)
    print(f"Inserted {n_benchmarks} rows into industry_benchmarks")

    n_eeio = seed_eeio_factors(cur)
    print(f"Inserted {n_eeio} rows into eeio_factors")

    n_defra = seed_defra_factors(cur)
    print(f"Inserted {n_defra} rows into defra_factors")

    # Verify
    cur.execute("SELECT COUNT(*) FROM eeio_factors")
    print(f"\nVerification:")
    print(f"  eeio_factors:        {cur.fetchone()[0]} rows")
    cur.execute("SELECT COUNT(*) FROM defra_factors")
    print(f"  defra_factors:       {cur.fetchone()[0]} rows")
    cur.execute("SELECT COUNT(*) FROM industry_benchmarks")
    print(f"  industry_benchmarks: {cur.fetchone()[0]} rows")
    cur.execute("SELECT COUNT(*) FROM ghgrp_facilities")
    print(f"  ghgrp_facilities:    {cur.fetchone()[0]} rows (empty - loaded in next task)")

    conn.commit()
    conn.close()
    print(f"\nDatabase created at: {os.path.abspath(DB_PATH)}")


if __name__ == "__main__":
    main()
