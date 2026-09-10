"""Auth + lost-item API server for the Found It! app.

Two jobs:
1. Verify the Google ID token the frontend's Sign in with Google button
   produces, then issue our own httpOnly session cookie so the SPA never has
   to hold the Google credential itself.
2. Persist reported items (and their photos) in SQLite so records survive
   across browsers/devices instead of living only in one client's
   localStorage.
"""
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, make_response, request, send_from_directory
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from werkzeug.utils import secure_filename

from db import get_connection, init_db

load_dotenv()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
SESSION_SECRET = os.environ.get("SESSION_SECRET")
FRONTEND_ORIGINS = [o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if o.strip()]
PORT = int(os.environ.get("PORT", 4000))
IS_PRODUCTION = os.environ.get("FLASK_ENV") == "production"

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is not set. Copy server/.env.example to server/.env and fill it in.")
if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET is not set. Copy server/.env.example to server/.env and fill it in.")

SESSION_COOKIE = "acs_session"
SESSION_TTL_SECONDS = int(timedelta(days=7).total_seconds())

# Same-site deployment (local dev, or frontend+backend behind one domain) can use the
# browser-default "Lax" cookie. Once the frontend lives on a different domain (e.g. a
# Vercel + Render split), the cookie only survives cross-origin fetches as "None", which
# in turn requires "Secure" — browsers reject SameSite=None without it.
COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
COOKIE_SECURE = IS_PRODUCTION or COOKIE_SAMESITE == "None"

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
ALLOWED_CATEGORIES = {"electronics", "clothing", "wallet", "books", "etc"}
DEFAULT_STORAGE_LOCATION = "학생회관 1층 분실물 센터"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB, generous for a phone photo
CORS(app, supports_credentials=True, origins=FRONTEND_ORIGINS)

_google_request = google_requests.Request()
init_db()


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------

def _issue_session(response, user):
    token = jwt.encode(
        {**user, "exp": int(time.time()) + SESSION_TTL_SECONDS},
        SESSION_SECRET,
        algorithm="HS256",
    )
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        max_age=SESSION_TTL_SECONDS,
        path="/",
    )


def _current_user():
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    return {key: payload.get(key) for key in ("sub", "email", "name", "picture")}


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

    user = {
        "sub": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name", payload["email"]),
        "picture": payload.get("picture"),
    }

    response = make_response(jsonify(user=user))
    _issue_session(response, user)
    return response


@app.get("/api/me")
def me():
    user = _current_user()
    if not user:
        return jsonify(user=None), 401
    return jsonify(user=user)


@app.post("/api/logout")
def logout():
    response = make_response(jsonify(ok=True))
    response.set_cookie(SESSION_COOKIE, "", expires=0, path="/")
    return response


# ---------------------------------------------------------------------------
# Lost items
# ---------------------------------------------------------------------------

def _serialize_item(row, current_sub):
    # Absolute so it still resolves once the frontend is on a different origin
    # than the API (there's no dev proxy to lean on once deployed separately).
    image_url = f"{request.host_url.rstrip('/')}/api/uploads/{row['image_filename']}" if row["image_filename"] else None
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "status": row["status"],
        "location": row["location"],
        "storage": row["storage"],
        "foundAt": row["found_at"],
        "description": row["description"],
        "imageUrl": image_url,
        "reportedByMe": bool(current_sub) and row["reporter_sub"] == current_sub,
    }


@app.errorhandler(413)
def _file_too_large(_err):
    return jsonify(error="file_too_large"), 413


@app.get("/api/items")
def list_items():
    user = _current_user()
    current_sub = user["sub"] if user else None
    mine_only = request.args.get("mine") == "1"

    if mine_only and not user:
        return jsonify(error="unauthorized"), 401

    with get_connection() as conn:
        if mine_only:
            rows = conn.execute(
                "SELECT * FROM items WHERE reporter_sub = ? ORDER BY created_at DESC",
                (current_sub,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM items ORDER BY created_at DESC").fetchall()

    return jsonify(items=[_serialize_item(row, current_sub) for row in rows])


@app.get("/api/items/<item_id>")
def get_item(item_id):
    user = _current_user()
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify(error="not_found"), 404
    return jsonify(item=_serialize_item(row, user["sub"] if user else None))


@app.post("/api/items")
def create_item():
    user = _current_user()
    if not user:
        return jsonify(error="unauthorized"), 401

    name = (request.form.get("name") or "").strip()
    category = (request.form.get("category") or "").strip()
    location = (request.form.get("location") or "").strip()
    description = (request.form.get("description") or "").strip() or None

    if not name or not location:
        return jsonify(error="missing_fields"), 400
    if category not in ALLOWED_CATEGORIES:
        return jsonify(error="invalid_category"), 400

    image_filename = None
    photo = request.files.get("photo")
    if photo and photo.filename:
        ext = Path(secure_filename(photo.filename)).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return jsonify(error="invalid_file_type"), 400
        image_filename = f"{uuid.uuid4().hex}{ext}"
        photo.save(UPLOAD_DIR / image_filename)

    item_id = f"itm-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
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
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()

    return jsonify(item=_serialize_item(row, user["sub"])), 201


@app.post("/api/items/<item_id>/claim")
def claim_item(item_id):
    user = _current_user()
    if not user:
        return jsonify(error="unauthorized"), 401

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            return jsonify(error="not_found"), 404
        conn.execute("UPDATE items SET status = 'returned' WHERE id = ?", (item_id,))
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()

    return jsonify(item=_serialize_item(row, user["sub"]))


@app.get("/api/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=not IS_PRODUCTION)
