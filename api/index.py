"""Vercel entry point: serves the Flask app in server/ as a Python serverless function.

vercel.json rewrites every /api/* request here; Flask still sees the original
path, so the routes in server/app.py match unchanged.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from app import app  # noqa: E402,F401 — Vercel looks for a WSGI callable named `app`
