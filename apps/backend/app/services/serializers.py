from __future__ import annotations

from typing import Iterable

from ..models import Application, ApplicationPaddock, Farm, Owner, Paddock
from ..schemas import (
    ApplicationPaddockResponse,
    ApplicationResponse,
    FarmPublic,
    GPSPoint,
    OwnerPublic,
    PaddockPublic,
    PaddockResponse,
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


def serialize_owner(owner: Owner) -> OwnerPublic:
    return OwnerPublic(id=owner.id, name=owner.name, created_at=owner.created_at)


def serialize_farm(farm: Farm) -> FarmPublic:
    return FarmPublic(
        id=farm.id,
        owner_id=farm.owner_id,
        name=farm.name,
        notes=farm.notes,
        created_at=farm.created_at,
    )


def serialize_paddock_public(paddock: Paddock) -> PaddockPublic:
    latitude = to_float(paddock.gps_latitude)
    longitude = to_float(paddock.gps_longitude)
    accuracy = to_float(paddock.gps_accuracy_m)
    gps_point = None
    if latitude is not None and longitude is not None:
        gps_point = GPSPoint(latitude=latitude, longitude=longitude, accuracy=accuracy)
    return PaddockPublic(
        id=paddock.id,
        owner_id=paddock.owner_id,
        farm_id=paddock.farm_id,
        name=paddock.name,
        area_hectares=to_float(paddock.area_hectares),
        gps_point=gps_point,
        gps_accuracy_m=accuracy,
        gps_captured_at=paddock.gps_updated_at,
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
