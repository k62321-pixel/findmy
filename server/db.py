"""SQLite persistence for lost-and-found items.

One file, one table — this app has no relations that would justify an ORM.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "items.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'stored',
                location TEXT NOT NULL,
                storage TEXT NOT NULL,
                found_at TEXT NOT NULL,
                description TEXT,
                image_filename TEXT,
                reporter_sub TEXT NOT NULL,
                reporter_name TEXT NOT NULL,
                reporter_email TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_sub)")
