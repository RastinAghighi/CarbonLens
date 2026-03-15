"""SQLite persistence for completed job results.

Jobs are saved after pipeline completion so they survive server restarts
and can be loaded on direct URL access (e.g. /verify/report/:id).
"""

import json
import sqlite3
from pathlib import Path

_DB_PATH = Path(__file__).resolve().parent / "jobs.db"


def init_db() -> None:
    with sqlite3.connect(_DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_type    TEXT NOT NULL,
                job_id      TEXT NOT NULL,
                company_name TEXT,
                result      TEXT NOT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (job_type, job_id)
            )
        """)
        conn.commit()


def save_job(job_type: str, job_id: str, result: dict, company_name: str | None = None) -> None:
    with sqlite3.connect(_DB_PATH) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO jobs (job_type, job_id, company_name, result) VALUES (?, ?, ?, ?)",
            (job_type, job_id, company_name, json.dumps(result)),
        )
        conn.commit()


def load_job(job_type: str, job_id: str) -> dict | None:
    with sqlite3.connect(_DB_PATH) as conn:
        row = conn.execute(
            "SELECT job_id, company_name, result FROM jobs WHERE job_type = ? AND job_id = ?",
            (job_type, job_id),
        ).fetchone()
    if row is None:
        return None
    return {
        "job_id": row[0],
        "company_name": row[1],
        "status": "complete",
        "current_agent": 0,
        "agents": [],
        "result": json.loads(row[2]),
    }
