"""Utilities for rendering spray application PDFs."""
from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Mapping

import qrcode
from jinja2 import Environment, PackageLoader, select_autoescape
from weasyprint import HTML

TEMPLATE_NAME = "templates.html"

env = Environment(
    loader=PackageLoader("apps.backend", "templates"),
    autoescape=select_autoescape(["html", "xml"]),
)


@dataclass(slots=True)
class RecordContext:
    """Serializable context passed to the Jinja template."""

    application: Mapping[str, Any]
    owner: Mapping[str, Any]
    paddocks: list[Mapping[str, Any]]
    weather: Mapping[str, Any]
    generated_at: datetime
    qr_code: str | None
    record_url: str | None


def _to_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):  # pragma: no cover - defensive conversion
        return None


def _qr_data_uri(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def build_context(
    application: Mapping[str, Any],
    *,
    owner: Mapping[str, Any] | None,
    paddocks: list[Mapping[str, Any]],
    record_url: str | None,
) -> RecordContext:
    application_id = application.get("application_id") or application.get("id")
    paddock_items = [
        {
            "name": paddock.get("paddock_name") or paddock.get("name") or str(paddock.get("paddock_id")),
            "gps_latitude": _to_float(paddock.get("centroid_lat") or paddock.get("gps_latitude")),
            "gps_longitude": _to_float(paddock.get("centroid_lng") or paddock.get("gps_longitude")),
            "gps_accuracy_m": _to_float(paddock.get("gps_accuracy_m")),
            "gps_captured_at": paddock.get("gps_captured_at") or paddock.get("created_at"),
        }
        for paddock in paddocks
    ]
    wind_kph = _to_float(application.get("weather_wind_kph"))
    weather = {
        "wind_speed_ms": wind_kph * (1000.0 / 3600.0) if wind_kph is not None else _to_float(application.get("weather_wind_ms")),
        "wind_direction_deg": _to_float(application.get("weather_wind_dir")),
        "temp_c": _to_float(application.get("weather_temp_c")),
        "humidity_pct": _to_float(application.get("weather_rh_pct")),
    }
    owner_mapping = {"name": "Owner"}
    if owner:
        owner_mapping = {"name": owner.get("owner_name") or owner.get("name") or "Owner"}
    context = RecordContext(
        application={
            "id": application_id,
            "started_at": application.get("started_at"),
            "finalized": bool(application.get("finalized")),
            "notes": application.get("notes"),
        },
        owner=owner_mapping,
        paddocks=paddock_items,
        weather=weather,
        generated_at=datetime.now(timezone.utc),
        qr_code=_qr_data_uri(record_url) if record_url else None,
        record_url=record_url,
    )
    return context


def context_to_template_kwargs(context: RecordContext) -> dict[str, Any]:
    return {
        "application": context.application,
        "owner": context.owner,
        "paddocks": context.paddocks,
        "weather": context.weather,
        "generated_at": context.generated_at,
        "qr_code": context.qr_code,
        "record_url": context.record_url,
    }


def render_html(context: RecordContext) -> str:
    template = env.get_template(TEMPLATE_NAME)
    return template.render(**context_to_template_kwargs(context))


def render_pdf(context: RecordContext, *, base_url: str | None = None) -> bytes:
    html = render_html(context)
    return HTML(string=html, base_url=base_url).write_pdf()
