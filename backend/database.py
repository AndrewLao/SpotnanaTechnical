import sqlite3
from contextlib import contextmanager
from pathlib import Path

# We're using SQLite for this since it's the fastest to set up
# lightweight enough for this use case.
DB_PATH = Path(__file__).parent / "chat.db"


# Connection object creation
@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


# Create the DB if it doesn't exist
# Of course, in a production environment you'd have this already done on your servers
# but because this is a demo we'll need to do this
def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )

# Insert a new row to the DB. We don't support authentication so it's only 1 user for now
# The DB creation would look different otherwise
def save_message(role: str, content: str) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO messages (role, content) VALUES (?, ?)",
            (role, content),
        )
        msg_id = cur.lastrowid
        row = conn.execute("SELECT * FROM messages WHERE id = ?", (msg_id,)).fetchone()
        return dict(row)

# Get all messages and consider the limit imposed by us
def get_all_messages(limit: int | None = None) -> list[dict]:
    with get_conn() as conn:
        if limit is None:
            rows = conn.execute("SELECT * FROM messages ORDER BY id ASC").fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM (
                    SELECT * FROM messages ORDER BY id DESC LIMIT ?
                ) ORDER BY id ASC
                """,
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]


def clear_messages():
    with get_conn() as conn:
        conn.execute("DELETE FROM messages")
