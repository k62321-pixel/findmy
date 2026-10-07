"""SQLite persistence for lost-and-found items.

One file, one table — this app has no relations that would justify an ORM.
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

# DATA_DIR lets a host mount a persistent disk (e.g. Render Disk at /var/data)
# so the DB and uploaded photos survive redeploys. Defaults to this folder.
DATA_DIR = Path(os.environ.get("DATA_DIR") or Path(__file__).parent)
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "items.db"

# Columns added after the first release — ALTERed into existing databases on startup.
_MIGRATED_COLUMNS = {
    "claimant_sub": "TEXT",
    "claimant_name": "TEXT",
    "claimant_email": "TEXT",
    "claimed_at": "TEXT",
    "resolved_by": "TEXT",
    "resolved_at": "TEXT",
}


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Commits on success, rolls back on error, and always closes the connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        with conn:
            yield conn
    finally:
        conn.close()


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
        existing = {row["name"] for row in conn.execute("PRAGMA table_info(items)")}
        for column, column_type in _MIGRATED_COLUMNS.items():
            if column not in existing:
                conn.execute(f"ALTER TABLE items ADD COLUMN {column} {column_type}")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_sub)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_claimant ON items(claimant_sub)")
