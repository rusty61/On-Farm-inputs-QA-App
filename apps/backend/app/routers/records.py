from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.templating import Jinja2Templates

from ..db_supabase import (
    get_app_by_id, get_owner_by_id, get_paddock_by_id
)

router = APIRouter()

# Templates live in ``apps/backend/app/templates``.
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"
TEMPLATE_NAME = "application.html"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def kph_to_ms(value: Any) -> float | None:
    if value is None:
        return None
    return float(value) * (1000.0 / 3600.0)


def paddock_to_template(paddock: Mapping[str, Any] | None) -> Mapping[str, Any] | None:
    if not paddock:
        return None
    return {
        "name": paddock.get("paddock_name"),
        "gps_latitude": paddock.get("centroid_lat"),
        "gps_longitude": paddock.get("centroid_lng"),
        "gps_accuracy_m": "-",  # not stored in the schema
        "gps_captured_at": paddock.get("created_at"),
    }


@router.get("/applications/{application_id}/preview")
async def preview_application(request: Request, application_id: str):
    app_row = await get_app_by_id(application_id)
    if not app_row:
        raise HTTPException(404, "Application not found")

    owner = await get_owner_by_id(app_row["owner_id"]) if app_row.get("owner_id") else None
    paddock = await get_paddock_by_id(app_row["paddock_id"]) if app_row.get("paddock_id") else None

    weather = {
        "wind_speed_ms": kph_to_ms(app_row.get("weather_wind_kph")),
        "wind_direction_deg": app_row.get("weather_wind_dir"),
        "temp_c": app_row.get("weather_temp_c"),
        "humidity_pct": app_row.get("weather_rh_pct"),
    }

    context = {
        "request": request,
        "owner": {"name": owner["owner_name"] if owner else "Owner"},
        "application": {
            "id": app_row["application_id"],
            "started_at": app_row.get("started_at"),
            "finalized": app_row.get("finalized"),
            "notes": app_row.get("notes"),
        },
        "paddocks": [paddock_to_template(paddock)] if paddock else [],
        "weather": weather,
        "qr_code": None,
        "record_url": app_row.get("pdf_url"),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
    }

    return templates.TemplateResponse(TEMPLATE_NAME, context)


@router.get("/test-template")
def test_template(request: Request):
    ctx = {
        "request": request,
        "owner": {"name": "My Farm Pty Ltd"},
        "application": {
            "id": "TEST",
            "started_at": "now",
            "finalized": True,
            "notes": "hello",
        },
        "paddocks": [
            {
                "name": "North Back",
                "gps_latitude": -36.12,
                "gps_longitude": 144.75,
                "gps_accuracy_m": "-",
                "gps_captured_at": "now",
            }
        ],
        "weather": {
            "wind_speed_ms": 12.5 * (1000 / 3600),
            "wind_direction_deg": 240,
            "temp_c": 20.4,
            "humidity_pct": 58,
        },
        "qr_code": None,
        "record_url": None,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
    }
    return templates.TemplateResponse(TEMPLATE_NAME, ctx)
