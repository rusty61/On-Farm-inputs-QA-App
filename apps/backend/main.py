"""Compatibility wrapper for the FastAPI application.

Render deployments historically imported ``apps.backend.main:app``.
This module now simply re-exports the actual application defined in
``apps.backend.app.main`` so the legacy import path continues to work.
"""

from apps.backend.app.main import app as _app

__all__ = ["app"]

app = _app
