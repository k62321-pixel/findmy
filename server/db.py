"""Persistence for lost-and-found items and their photos.

Two backends behind one tiny interface:
- DATABASE_URL set (postgres://…) → PostgreSQL, e.g. Neon's free tier. Used in
  production because free hosts like Render wipe their local disk on every restart.
- otherwise → a local SQLite file, for development.

Photos are stored in the database too (they are compressed client-side first),
so there is no upload folder that could disappear.

Queries are written with SQLite-style "?" placeholders; they are rewritten for
psycopg ("%s") when running on Postgres.
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DATABASE_URL = os.environ.get("DATABASE_URL", "")
IS_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))

if IS_POSTGRES:
    import psycopg
    from psycopg.rows import dict_row
else:
    DATA_DIR = Path(os.environ.get("DATA_DIR") or Path(__file__).parent)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = DATA_DIR / "items.db"

# Columns added after the first release — added to existing databases on startup.
_MIGRATED_COLUMNS = (
    "claimant_sub",
    "claimant_name",
    "claimant_email",
    "claimed_at",
    "resolved_by",
    "resolved_at",
)


class Connection:
    """Just enough of a DB-API connection for app.py: execute() returning a cursor."""

    def __init__(self, raw):
        self._raw = raw

    def execute(self, sql, params=()):
        if IS_POSTGRES:
            sql = sql.replace("?", "%s")
        cursor = self._raw.cursor()
        cursor.execute(sql, params)
        return cursor


def _connect():
    if IS_POSTGRES:
        return psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=10)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_connection() -> Iterator[Connection]:
    """Commits on success, rolls back on error, and always closes the connection."""
    raw = _connect()
    try:
        yield Connection(raw)
        raw.commit()
    except BaseException:
        raw.rollback()
        raise
    finally:
        raw.close()


def init_db(storage_location: str) -> None:
    blob = "BYTEA" if IS_POSTGRES else "BLOB"
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
        if IS_POSTGRES:
            for column in _MIGRATED_COLUMNS:
                conn.execute(f"ALTER TABLE items ADD COLUMN IF NOT EXISTS {column} TEXT")
        else:
            existing = {row["name"] for row in conn.execute("PRAGMA table_info(items)").fetchall()}
            for column in _MIGRATED_COLUMNS:
                if column not in existing:
                    conn.execute(f"ALTER TABLE items ADD COLUMN {column} TEXT")
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS images (
                filename TEXT PRIMARY KEY,
                content_type TEXT NOT NULL,
                data {blob} NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS inquiries (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                author_sub TEXT NOT NULL,
                author_name TEXT NOT NULL,
                author_email TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        # Items reported before the storage place was renamed follow the new name.
        conn.execute("UPDATE items SET storage = ? WHERE storage <> ?", (storage_location, storage_location))
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_sub)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_claimant ON items(claimant_sub)")
