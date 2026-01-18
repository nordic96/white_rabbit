"""
Vercel serverless function entry point.

This wrapper enables Vercel's Python auto-detection while keeping
the existing src/main.py structure intact.
"""
from src.main import app

# Vercel looks for 'app' or 'handler' in index.py
# The FastAPI app is already ASGI-compatible
