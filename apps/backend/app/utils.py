from __future__ import annotations

from decimal import Decimal
from typing import Any


def to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return value  # type: ignore[return-value]
