"""Compatibility shim for :mod:`apps.backend.app.routers.records`."""

from ..app.routers.records import preview_application, router, test_template

__all__ = ["router", "preview_application", "test_template"]
