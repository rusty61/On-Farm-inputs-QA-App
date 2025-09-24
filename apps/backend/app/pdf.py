from __future__ import annotations

def generate_application_pdf(html_str: str) -> bytes:
    # Lazy import so the app can boot even if system libs are missing at first
    from weasyprint import HTML
    return HTML(string=html_str, base_url=".").write_pdf()

import base64
from datetime import datetime, timezone
from io import BytesIO
from typing import Iterable

import qrcode
from jinja2 import Environment, PackageLoader, select_autoescape
from weasyprint import HTML

from .config import get_settings
from .models import Application, ApplicationPaddock
from .utils import to_float

_env = Environment(
    loader=PackageLoader("apps.backend.app", "templates"),
    autoescape=select_autoescape(["html", "xml"]),
)


def _qr_data_uri(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def generate_application_pdf(application: Application) -> bytes:
    settings = get_settings()
    template = _env.get_template("application.html")
    record_url = f"{settings.public_record_base_url}/records/{application.id}" if settings.public_record_base_url else ""
    paddocks: Iterable[ApplicationPaddock] = application.paddocks
    context = {
        "application": application,
        "owner": application.owner,
        "paddocks": [
            {
                "name": link.paddock.name if link.paddock else str(link.paddock_id),
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
    html = template.render(**context)
    pdf = HTML(string=html, base_url=str(settings.public_record_base_url)).write_pdf()
    return pdf
