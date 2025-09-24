"""Compatibility package for legacy router imports.

Historically the FastAPI routers lived under :mod:`apps.backend.routes`.  The
project reorganised the code so the canonical modules are now in
``apps.backend.app.routers``.  This package re-exports the modern router
modules so that legacy import paths continue to work without modification.
"""

from . import applications, farms, mixes, owners, paddocks, records, weather

__all__ = [
    "applications",
    "farms",
    "mixes",
    "owners",
    "paddocks",
    "records",
    "weather",
]
