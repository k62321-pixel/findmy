"""Auth + lost-item API server for the Found It! app.

Two jobs:
1. Verify the Google ID token the frontend's Sign in with Google button
   produces, then issue our own httpOnly session cookie so the SPA never has
   to hold the Google credential itself.
2. Persist reported items (and their photos) in SQLite so records survive
   across browsers/devices instead of living only in one client's
   localStorage.

Item lifecycle: stored (보관중) → requested (수령 신청됨, by any signed-in user)
→ returned (반환완료, only an admin listed in ADMIN_EMAILS can confirm this).
"""
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, make_response, request
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

from db import IS_POSTGRES, get_connection, init_db  # noqa: E402 — db reads DATABASE_URL from .env


def _csv_env(name, default=""):
    return [v.strip() for v in os.environ.get(name, default).split(",") if v.strip()]


GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
SESSION_SECRET = os.environ.get("SESSION_SECRET")
FRONTEND_ORIGINS = _csv_env("FRONTEND_ORIGIN", "http://localhost:5173")
# Who may confirm returns / undo them / delete posts. Checked on every request,
# so removing an address here revokes admin rights immediately.
ADMIN_EMAILS = {e.lower() for e in _csv_env("ADMIN_EMAILS")}
# Restrict sign-in to school accounts, e.g. "school.ac.kr". Empty = any Google account.
ALLOWED_EMAIL_DOMAINS = {d.lower().lstrip("@") for d in _csv_env("ALLOWED_EMAIL_DOMAINS")}
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 4000))
# Vercel sets VERCEL=1 on its build and runtime, so no extra flag is needed there.
IS_PRODUCTION = os.environ.get("FLASK_ENV") == "production" or os.environ.get("VERCEL") == "1"
# Never on by default: the Werkzeug debugger allows running arbitrary code.
DEBUG = os.environ.get("FLASK_DEBUG") == "1" and not IS_PRODUCTION

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is not set. Copy server/.env.example to server/.env and fill it in.")
if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET is not set. Copy server/.env.example to server/.env and fill it in.")
if IS_PRODUCTION and len(SESSION_SECRET) < 32:
    raise RuntimeError("SESSION_SECRET must be at least 32 characters in production.")

SESSION_COOKIE = "acs_session"
SESSION_TTL_SECONDS = int(timedelta(days=7).total_seconds())

# Default deployment proxies /api through the frontend's domain (see netlify.toml), so
# the cookie is first-party and "Lax" works everywhere, Safari included. Only a true
# cross-domain setup needs "None", which in turn requires "Secure".
COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
COOKIE_SECURE = IS_PRODUCTION or COOKIE_SAMESITE == "None"

# The frontend shrinks photos to ~300KB before upload; this cap keeps the free
# database tier (Neon: 0.5GB) from being eaten by a few uncompressed originals.
MAX_PHOTO_BYTES = 3 * 1024 * 1024
ALLOWED_CATEGORIES = {
    "electronics", "stationery", "books", "clothing", "wallet",
    "bottle", "umbrella", "bag", "accessory", "etc",
}
DEFAULT_STORAGE_LOCATION = "1층 교무실"
MAX_INQUIRY_LENGTH = 1000
MAX_INQUIRIES_PER_HOUR = 5
MAX_NAME_LENGTH = 100
MAX_LOCATION_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 1000

if os.environ.get("VERCEL") == "1" and not IS_POSTGRES:
    raise RuntimeError("DATABASE_URL must be set on Vercel — serverless functions have no persistent disk.")

app = Flask(__name__)
if os.environ.get("VERCEL") == "1":
    # Vercel's edge sets X-Forwarded-Proto/Host; trusting them makes request.host_url the
    # real https://<site>.vercel.app, so same-site writes pass the Origin check below
    # without FRONTEND_ORIGIN having to list the deployment URL.
    from werkzeug.middleware.proxy_fix import ProxyFix

    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.config["MAX_CONTENT_LENGTH"] = MAX_PHOTO_BYTES + 64 * 1024  # photo + the text fields
CORS(app, supports_credentials=True, origins=FRONTEND_ORIGINS)

_google_request = google_requests.Request()
init_db(DEFAULT_STORAGE_LOCATION)

if IS_PRODUCTION and not IS_POSTGRES:
    app.logger.warning("DATABASE_URL is not set — using local SQLite, which free hosts wipe on restart.")
if not ALLOWED_EMAIL_DOMAINS:
    app.logger.warning("ALLOWED_EMAIL_DOMAINS is empty — any Google account can sign in.")
if not ADMIN_EMAILS:
    app.logger.warning("ADMIN_EMAILS is empty — nobody can confirm returns.")


# ---------------------------------------------------------------------------
# Request hardening
# ---------------------------------------------------------------------------

@app.before_request
def _reject_cross_site_writes():
    # CSRF guard: browsers always attach Origin to cross-site POSTs (including plain
    # HTML form submits), so a write from any page other than our frontend is refused.
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return None
    origin = request.headers.get("Origin")
    if origin and origin not in FRONTEND_ORIGINS and origin != request.host_url.rstrip("/"):
        return jsonify(error="forbidden_origin"), 403
    return None


@app.after_request
def _security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    return response


# Abuse limits are counted from the database rather than process memory, because
# serverless hosts (Vercel) run many short-lived instances that share no memory.
MAX_REPORTS_PER_HOUR = 10
MAX_PENDING_CLAIMS = 3


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------

def _email_allowed(email):
    email = email.lower()
    if email in ADMIN_EMAILS or not ALLOWED_EMAIL_DOMAINS:
        return True
    return email.rsplit("@", 1)[-1] in ALLOWED_EMAIL_DOMAINS


def _is_admin(user):
    return bool(user) and user["email"].lower() in ADMIN_EMAILS


def _set_session_cookie(response, value, max_age):
    # Deletion must repeat SameSite/Secure, or browsers ignore it on cross-site responses.
    response.set_cookie(
        SESSION_COOKIE,
        value,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        max_age=max_age,
        path="/",
    )


def _issue_session(response, user):
    token = jwt.encode(
        {**user, "exp": int(time.time()) + SESSION_TTL_SECONDS},
        SESSION_SECRET,
        algorithm="HS256",
    )
    _set_session_cookie(response, token, SESSION_TTL_SECONDS)


def _current_user():
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if not payload.get("sub") or not payload.get("email"):
        return None
    # Re-checked per request so tightening ALLOWED_EMAIL_DOMAINS takes effect at once.
    if not _email_allowed(payload["email"]):
        return None
    return {key: payload.get(key) for key in ("sub", "email", "name", "picture")}


def _public_user(user):
    return {**user, "isAdmin": _is_admin(user)}


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user:
            return jsonify(error="unauthorized"), 401
        return view(user, *args, **kwargs)

    return wrapper


def admin_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user:
            return jsonify(error="unauthorized"), 401
        if not _is_admin(user):
            return jsonify(error="forbidden"), 403
        return view(user, *args, **kwargs)

    return wrapper


@app.post("/api/auth/google")
def auth_google():
    credential = (request.get_json(silent=True) or {}).get("credential")
    if not credential:
        return jsonify(error="missing_credential"), 400

    try:
        payload = id_token.verify_oauth2_token(credential, _google_request, GOOGLE_CLIENT_ID)
    except ValueError as exc:
        app.logger.warning("Google ID token verification failed: %s", exc)
        return jsonify(error="invalid_token"), 401

    if not payload.get("email_verified"):
        return jsonify(error="unverified_email"), 401
    if not _email_allowed(payload["email"]):
        return jsonify(error="domain_not_allowed"), 403

    user = {
        "sub": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name", payload["email"]),
        "picture": payload.get("picture"),
    }

    response = make_response(jsonify(user=_public_user(user)))
    _issue_session(response, user)
    return response


@app.get("/api/me")
def me():
    user = _current_user()
    if not user:
        return jsonify(user=None), 401
    return jsonify(user=_public_user(user))


@app.post("/api/logout")
def logout():
    response = make_response(jsonify(ok=True))
    _set_session_cookie(response, "", 0)
    return response


# ---------------------------------------------------------------------------
# Lost items
# ---------------------------------------------------------------------------

def _now():
    return datetime.now(timezone.utc).isoformat()


def _serialize_item(row, user):
    current_sub = user["sub"] if user else None
    item = {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "status": row["status"],
        "location": row["location"],
        "storage": row["storage"],
        "foundAt": row["found_at"],
        "description": row["description"],
        # Relative: the frontend resolves it against its API base (same origin via proxy).
        "imageUrl": f"/api/uploads/{row['image_filename']}" if row["image_filename"] else None,
        "reportedByMe": bool(current_sub) and row["reporter_sub"] == current_sub,
        "claimedByMe": bool(current_sub) and row["claimant_sub"] == current_sub,
    }
    # Personal details of reporters/claimants are for the lost & found staff only.
    if _is_admin(user):
        item["admin"] = {
            "reporterName": row["reporter_name"],
            "reporterEmail": row["reporter_email"],
            "claimantName": row["claimant_name"],
            "claimantEmail": row["claimant_email"],
            "claimedAt": row["claimed_at"],
            "resolvedBy": row["resolved_by"],
            "resolvedAt": row["resolved_at"],
        }
    return item


def _fetch_item(conn, item_id):
    return conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()


# Magic bytes → (extension, MIME type). The client-supplied filename/type is never trusted.
def _detect_image(head):
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png", "image/png"
    if head.startswith(b"\xff\xd8\xff"):
        return ".jpg", "image/jpeg"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif", "image/gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp", "image/webp"
    return None


@app.errorhandler(413)
def _file_too_large(_err):
    return jsonify(error="file_too_large"), 413


@app.get("/api/items")
def list_items():
    user = _current_user()
    mine_only = request.args.get("mine") == "1"

    if mine_only and not user:
        return jsonify(error="unauthorized"), 401

    with get_connection() as conn:
        if mine_only:
            rows = conn.execute(
                "SELECT * FROM items WHERE reporter_sub = ? OR claimant_sub = ? ORDER BY created_at DESC",
                (user["sub"], user["sub"]),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM items ORDER BY created_at DESC").fetchall()

    return jsonify(items=[_serialize_item(row, user) for row in rows])


@app.get("/api/items/<item_id>")
def get_item(item_id):
    user = _current_user()
    with get_connection() as conn:
        row = _fetch_item(conn, item_id)
    if not row:
        return jsonify(error="not_found"), 404
    return jsonify(item=_serialize_item(row, user))


@app.post("/api/items")
@login_required
def create_item(user):
    name = (request.form.get("name") or "").strip()
    category = (request.form.get("category") or "").strip()
    location = (request.form.get("location") or "").strip()
    description = (request.form.get("description") or "").strip() or None

    if not name or not location:
        return jsonify(error="missing_fields"), 400
    if (
        len(name) > MAX_NAME_LENGTH
        or len(location) > MAX_LOCATION_LENGTH
        or (description and len(description) > MAX_DESCRIPTION_LENGTH)
    ):
        return jsonify(error="field_too_long"), 400
    if category not in ALLOWED_CATEGORIES:
        return jsonify(error="invalid_category"), 400
    if not _is_admin(user):
        an_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        with get_connection() as conn:
            recent = conn.execute(
                "SELECT COUNT(*) AS n FROM items WHERE reporter_sub = ? AND created_at > ?",
                (user["sub"], an_hour_ago),
            ).fetchone()["n"]
        if recent >= MAX_REPORTS_PER_HOUR:
            return jsonify(error="rate_limited"), 429

    photo = request.files.get("photo")
    photo_data = image_filename = content_type = None
    if photo and photo.filename:
        photo_data = photo.read(MAX_PHOTO_BYTES + 1)
        if len(photo_data) > MAX_PHOTO_BYTES:
            return jsonify(error="file_too_large"), 413
        detected = _detect_image(photo_data[:12])
        if not detected:
            return jsonify(error="invalid_file_type"), 400
        ext, content_type = detected
        image_filename = f"{uuid.uuid4().hex}{ext}"

    item_id = f"itm-{uuid.uuid4().hex[:12]}"
    now = _now()

    with get_connection() as conn:
        if image_filename:
            conn.execute(
                "INSERT INTO images (filename, content_type, data) VALUES (?, ?, ?)",
                (image_filename, content_type, photo_data),
            )
        conn.execute(
            """
            INSERT INTO items (
                id, name, category, status, location, storage, found_at,
                description, image_filename, reporter_sub, reporter_name, reporter_email, created_at
            ) VALUES (?, ?, ?, 'stored', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                name,
                category,
                location,
                DEFAULT_STORAGE_LOCATION,
                now,
                description,
                image_filename,
                user["sub"],
                user["name"],
                user["email"],
                now,
            ),
        )
        row = _fetch_item(conn, item_id)

    return jsonify(item=_serialize_item(row, user)), 201


@app.post("/api/items/<item_id>/claim")
@login_required
def claim_item(user, item_id):
    """Any signed-in user can *request* pickup; only an admin can mark it returned."""
    with get_connection() as conn:
        row = _fetch_item(conn, item_id)
        if not row:
            return jsonify(error="not_found"), 404
        if row["reporter_sub"] == user["sub"]:
            return jsonify(error="own_item"), 400
        # Stops one account from parking requests on many items at once.
        pending = conn.execute(
            "SELECT COUNT(*) AS n FROM items WHERE claimant_sub = ? AND status = 'requested'",
            (user["sub"],),
        ).fetchone()["n"]
        if pending >= MAX_PENDING_CLAIMS:
            return jsonify(error="too_many_claims"), 429
        # Conditional UPDATE so two people can't both claim the same item at once.
        updated = conn.execute(
            """
            UPDATE items
               SET status = 'requested', claimant_sub = ?, claimant_name = ?, claimant_email = ?, claimed_at = ?
             WHERE id = ? AND status = 'stored'
            """,
            (user["sub"], user["name"], user["email"], _now(), item_id),
        ).rowcount
        if not updated:
            return jsonify(error="already_returned" if row["status"] == "returned" else "already_requested"), 409
        row = _fetch_item(conn, item_id)

    return jsonify(item=_serialize_item(row, user))


@app.post("/api/items/<item_id>/claim/cancel")
@login_required
def cancel_claim(user, item_id):
    with get_connection() as conn:
        updated = conn.execute(
            """
            UPDATE items
               SET status = 'stored', claimant_sub = NULL, claimant_name = NULL, claimant_email = NULL, claimed_at = NULL
             WHERE id = ? AND status = 'requested' AND claimant_sub = ?
            """,
            (item_id, user["sub"]),
        ).rowcount
        if not updated:
            return jsonify(error="not_claimant"), 409
        row = _fetch_item(conn, item_id)

    return jsonify(item=_serialize_item(row, user))


@app.post("/api/items/<item_id>/status")
@admin_required
def set_item_status(user, item_id):
    """Admin only. 'returned' confirms a handover; 'stored' rejects a request or undoes a return
    (an undone return that had a pickup request goes back to 'requested', not 'stored')."""
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("stored", "returned"):
        return jsonify(error="invalid_status"), 400

    with get_connection() as conn:
        row = _fetch_item(conn, item_id)
        if not row:
            return jsonify(error="not_found"), 404
        if status == "stored" and row["status"] == "returned" and row["claimant_sub"]:
            # Undoing a return keeps the pickup request: back to 'requested', claimant intact.
            conn.execute(
                "UPDATE items SET status = 'requested', resolved_by = NULL, resolved_at = NULL WHERE id = ?",
                (item_id,),
            )
        elif status == "returned":
            conn.execute(
                "UPDATE items SET status = 'returned', resolved_by = ?, resolved_at = ? WHERE id = ?",
                (user["email"], _now(), item_id),
            )
        else:
            conn.execute(
                """
                UPDATE items
                   SET status = 'stored', claimant_sub = NULL, claimant_name = NULL, claimant_email = NULL,
                       claimed_at = NULL, resolved_by = NULL, resolved_at = NULL
                 WHERE id = ?
                """,
                (item_id,),
            )
        row = _fetch_item(conn, item_id)

    app.logger.info("Admin %s set item %s to %s", user["email"], item_id, status)
    return jsonify(item=_serialize_item(row, user))


@app.delete("/api/items/<item_id>")
@admin_required
def delete_item(user, item_id):
    with get_connection() as conn:
        row = _fetch_item(conn, item_id)
        if not row:
            return jsonify(error="not_found"), 404
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        if row["image_filename"]:
            conn.execute("DELETE FROM images WHERE filename = ?", (row["image_filename"],))

    app.logger.info("Admin %s deleted item %s", user["email"], item_id)
    return jsonify(ok=True)


# ---------------------------------------------------------------------------
# Inquiries (문의사항)
# ---------------------------------------------------------------------------

def _serialize_inquiry(row):
    return {
        "id": row["id"],
        "content": row["content"],
        "authorName": row["author_name"],
        "authorEmail": row["author_email"],
        "createdAt": row["created_at"],
    }


@app.post("/api/inquiries")
@login_required
def create_inquiry(user):
    content = ((request.get_json(silent=True) or {}).get("content") or "").strip()
    if not content:
        return jsonify(error="missing_fields"), 400
    if len(content) > MAX_INQUIRY_LENGTH:
        return jsonify(error="field_too_long"), 400

    with get_connection() as conn:
        if not _is_admin(user):
            an_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
            recent = conn.execute(
                "SELECT COUNT(*) AS n FROM inquiries WHERE author_sub = ? AND created_at > ?",
                (user["sub"], an_hour_ago),
            ).fetchone()["n"]
            if recent >= MAX_INQUIRIES_PER_HOUR:
                return jsonify(error="inquiry_rate_limited"), 429
        conn.execute(
            """
            INSERT INTO inquiries (id, content, author_sub, author_name, author_email, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (f"inq-{uuid.uuid4().hex[:12]}", content, user["sub"], user["name"], user["email"], _now()),
        )

    return jsonify(ok=True), 201


@app.get("/api/inquiries")
@admin_required
def list_inquiries(user):
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM inquiries ORDER BY created_at DESC").fetchall()
    return jsonify(inquiries=[_serialize_inquiry(row) for row in rows])


@app.delete("/api/inquiries/<inquiry_id>")
@admin_required
def delete_inquiry(user, inquiry_id):
    with get_connection() as conn:
        deleted = conn.execute("DELETE FROM inquiries WHERE id = ?", (inquiry_id,)).rowcount
    if not deleted:
        return jsonify(error="not_found"), 404
    return jsonify(ok=True)


@app.get("/api/uploads/<filename>")
def uploaded_file(filename):
    with get_connection() as conn:
        row = conn.execute("SELECT content_type, data FROM images WHERE filename = ?", (filename,)).fetchone()
    if not row:
        return jsonify(error="not_found"), 404
    response = Response(bytes(row["data"]), mimetype=row["content_type"])
    # Filenames are random and never reused, so the photo can be cached for good.
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
