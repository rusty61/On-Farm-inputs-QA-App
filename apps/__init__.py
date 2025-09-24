"""Top-level compatibility package for the project codebase.

Historically the backend application and its routers were imported from the
``apps`` namespace (for example ``apps.backend.main``).  The package became a
namespace package after the refactor, which caused import resolution issues in
some deployment environments.  Providing an explicit module ensures a standard
package object is available and allows us to re-export the backend helpers
needed by legacy imports.
"""

from importlib import import_module as _import_module

# Re-export the backend package so ``import apps.backend`` continues to work.
backend = _import_module("apps.backend")

__all__ = ["backend"]
