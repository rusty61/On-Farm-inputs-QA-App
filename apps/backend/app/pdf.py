# apps/backend/app/pdf.py
from __future__ import annotations

from pathlib import Path
import base64
from datetime import datetime, timezone
from io import BytesIO
from typing import Iterable

import qrcode
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import get_settings
from .models import Application, ApplicationPaddock
from .utils import to_float

# Templates live at: apps/backend/app/templates/application.html
TEMPLATES_DIR = Path(__file__).parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)

def _qr_data_uri(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

def build_application_context(application: Application) -> dict:
    settings = get_settings()
    record_url = (
        f"{settings.public_record_base_url}/records/{application.id}"
        if settings.public_record_base_url else ""
    )
    paddocks: Iterable[ApplicationPaddock] = application.paddocks or []

    return {
        "application": application,
        "owner": application.owner,
        "paddocks": [
            {
                "name": (link.paddock.name if getattr(link, "paddock", None) else str(link.paddock_id)),
                "gps_latitude": to_float(link.gps_latitude),
                "gps_longitude": to_float(link.gps_longitude),
                "gps_accuracy_m": to_float(link.gps_accuracy_m),
                "gps_captured_at": link.gps_captured_at,
            }
            for link in paddocks
        ],
        "generated_at": datetime.now(timezone.utc),
        "qr_code": _qr_data_uri(record_url) if record_url else None,
        "record_url": record_url,
        "weather": {
            "wind_speed_ms": to_float(application.wind_speed_ms),
            "wind_direction_deg": to_float(application.wind_direction_deg),
            "temp_c": to_float(application.temp_c),
            "humidity_pct": to_float(application.humidity_pct),
        },
    }

def render_application_html(context: dict) -> str:
    template = _env.get_template("application.html")
    return template.render(**context)

def generate_pdf_from_html(html_str: str) -> bytes:
    # Lazy import so startup never fails on missing system libs
    from weasyprint import HTML
    # base_url must be a local directory so relative assets resolve
    return HTML(string=html_str, base_url=str(TEMPLATES_DIR)).write_pdf()

def generate_application_pdf(application: Application) -> bytes:
    ctx = build_application_context(application)
    html = render_application_html(ctx)
    return generate_pdf_from_html(html)
