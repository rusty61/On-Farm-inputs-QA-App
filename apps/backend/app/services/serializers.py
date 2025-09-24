from __future__ import annotations

from typing import Iterable

from ..models import Application, ApplicationPaddock, Paddock
from ..schemas import (
    ApplicationPaddockResponse,
    ApplicationResponse,
    ApplicationSummary,
    PaddockResponse,
    WeatherSummary,
)
from ..utils import to_float


def serialize_paddock(paddock: Paddock) -> PaddockResponse:
    return PaddockResponse(
        id=paddock.id,
        farm_id=paddock.farm_id,
        name=paddock.name,
        area_hectares=to_float(paddock.area_hectares),
        gps_latitude=to_float(paddock.gps_latitude),
        gps_longitude=to_float(paddock.gps_longitude),
        gps_accuracy_m=to_float(paddock.gps_accuracy_m),
        gps_updated_at=paddock.gps_updated_at,
        created_at=paddock.created_at,
    )


def serialize_application(application: Application) -> ApplicationResponse:
    paddocks: Iterable[ApplicationPaddock] = application.paddocks
    return ApplicationResponse(
        id=application.id,
        owner_id=application.owner_id,
        mix_id=application.mix_id,
        operator_user_id=application.operator_user_id,
        started_at=application.started_at,
        finished_at=application.finished_at,
        finalized=application.finalized,
        notes=application.notes,
        water_source=application.water_source,
        wind_speed_ms=to_float(application.wind_speed_ms),
        wind_direction_deg=to_float(application.wind_direction_deg),
        temp_c=to_float(application.temp_c),
        humidity_pct=to_float(application.humidity_pct),
        created_at=application.created_at,
        paddocks=[
            ApplicationPaddockResponse(
                paddock_id=link.paddock_id,
                gps_latitude=to_float(link.gps_latitude),
                gps_longitude=to_float(link.gps_longitude),
                gps_accuracy_m=to_float(link.gps_accuracy_m),
                gps_captured_at=link.gps_captured_at,
            )
            for link in paddocks
        ],
    )


def serialize_application_summary(application: Application) -> ApplicationSummary:
    paddock_ids = [link.paddock_id for link in application.paddocks]
    wind_speed = to_float(application.wind_speed_ms)
    wind_direction = to_float(application.wind_direction_deg)
    temperature = to_float(application.temp_c)
    humidity = to_float(application.humidity_pct)
    weather: WeatherSummary | None = None
    if any(value is not None for value in (wind_speed, wind_direction, temperature, humidity)):
        weather = WeatherSummary(
            wind_speed_ms=wind_speed,
            wind_direction_deg=wind_direction,
            temp_c=temperature,
            humidity_pct=humidity,
        )
    return ApplicationSummary(
        id=application.id,
        owner_id=application.owner_id,
        mix_id=application.mix_id,
        paddock_ids=paddock_ids,
        started_at=application.started_at,
        finished_at=application.finished_at,
        finalized=application.finalized,
        weather=weather,
    )
