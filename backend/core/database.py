"""Database connection helpers for CarbonLens."""

import json
import os
import sqlite3

_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(_DIR, "..", "data", "carbonlens.db")
ALIASES_PATH = os.path.join(_DIR, "..", "data", "company_aliases.json")


def get_db() -> sqlite3.Connection:
    """Return a SQLite connection with row-factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------------------------------------------------------
# EEIO spend-based factors
# ------------------------------------------------------------------

def query_eeio_factor(sector_code: str) -> dict | None:
    """Look up an EEIO emission factor by NAICS-style sector_code."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM eeio_factors WHERE sector_code = ?", (sector_code,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def query_eeio_factor_by_name(name_fragment: str) -> list[dict]:
    """Search EEIO factors whose sector_name contains *name_fragment* (case-insensitive)."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM eeio_factors WHERE LOWER(sector_name) LIKE LOWER(?)",
        (f"%{name_fragment}%",),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ------------------------------------------------------------------
# DEFRA activity-based factors
# ------------------------------------------------------------------

def query_defra_factor(category: str, subcategory: str) -> dict | None:
    """Look up a DEFRA factor by exact category + subcategory."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM defra_factors WHERE category = ? AND subcategory = ?",
        (category, subcategory),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def query_defra_factors_by_category(category: str) -> list[dict]:
    """Return all DEFRA factors for a given category."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM defra_factors WHERE category = ?", (category,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ------------------------------------------------------------------
# GHGRP facility emissions (with company-alias resolution)
# ------------------------------------------------------------------

def _load_aliases() -> dict:
    """Load company_aliases.json → {canonical: [alias, …]}."""
    with open(ALIASES_PATH, "r") as f:
        return json.load(f)


def _resolve_aliases(company_name: str) -> list[str]:
    """Given a company name (canonical or alias), return all DB-level names to query."""
    aliases = _load_aliases()

    # Check if it matches a canonical key (case-insensitive)
    for canonical, alias_list in aliases.items():
        if company_name.lower() == canonical.lower():
            return alias_list

    # Check if it matches any alias directly
    for canonical, alias_list in aliases.items():
        for alias in alias_list:
            if company_name.lower() in alias.lower() or alias.lower() in company_name.lower():
                return alias_list

    # Fallback: just search for the name as-is
    return [company_name]


def query_ghgrp_facilities(company_name: str, year: int | None = None) -> list[dict]:
    """Return all GHGRP facility rows matching *company_name* (alias-aware).

    If *year* is given, filter to that reporting year only.
    """
    db_names = _resolve_aliases(company_name)
    placeholders = ",".join("?" for _ in db_names)

    sql = f"SELECT * FROM ghgrp_facilities WHERE parent_company IN ({placeholders})"
    params: list = list(db_names)

    if year is not None:
        sql += " AND reporting_year = ?"
        params.append(year)

    sql += " ORDER BY total_emissions_mtco2e DESC"

    conn = get_db()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ------------------------------------------------------------------
# Industry benchmarks
# ------------------------------------------------------------------

def query_industry_benchmark(sector: str) -> dict | None:
    """Look up an industry benchmark by exact sector name."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM industry_benchmarks WHERE sector = ?", (sector,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def query_all_benchmarks() -> list[dict]:
    """Return every row in industry_benchmarks."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM industry_benchmarks").fetchall()
    conn.close()
    return [dict(r) for r in rows]
