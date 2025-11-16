"""
Vercel-compatible FastAPI entry point
Re-exports the app from api_server.py
"""

from api_server import app

# This is the app that Vercel will run
__all__ = ["app"]
