"""Compatibility package for legacy backend imports.

Legacy deployment scripts historically referenced modules such as
``apps.backend.main`` and ``apps.backend.routes``.  The backend code now lives
primarily under :mod:`apps.backend.app`, so we re-export the relevant modules
here to preserve the old import paths.
"""

from importlib import import_module as _import_module

app = _import_module("apps.backend.app")
main = _import_module("apps.backend.main")
routes = _import_module("apps.backend.routes")

__all__ = ["app", "main", "routes"]
