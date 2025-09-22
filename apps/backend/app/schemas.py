from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1)
    notes: str | None = None


class FarmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    notes: str | None
    created_at: datetime


class PaddockCreate(BaseModel):
    name: str = Field(..., min_length=1)
    area_hectares: float | None = Field(default=None, ge=0)


class PaddockUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    area_hectares: Optional[float] = Field(default=None, ge=0)
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    gps_accuracy_m: Optional[float] = Field(default=None, ge=0)


class PaddockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farm_id: uuid.UUID
    name: str
    area_hectares: float | None
    gps_latitude: float | None
    gps_longitude: float | None
    gps_accuracy_m: float | None
    gps_updated_at: datetime | None
    created_at: datetime


class ApplicationPaddockPayload(BaseModel):
    paddock_id: uuid.UUID
    gps_lat: float | None = None
    gps_lng: float | None = None
    gps_accuracy_m: float | None = Field(default=None, ge=0)


class ApplicationCreate(BaseModel):
    paddocks: list[ApplicationPaddockPayload]
    mix_id: uuid.UUID | None = None
    started_at: datetime | None = None
    operator_user_id: uuid.UUID | None = None
    notes: str | None = None
    water_source: str | None = None


class ApplicationPaddockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    paddock_id: uuid.UUID
    gps_latitude: float | None
    gps_longitude: float | None
    gps_accuracy_m: float | None
    gps_captured_at: datetime | None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    mix_id: uuid.UUID | None
    operator_user_id: uuid.UUID | None
    started_at: datetime
    finished_at: datetime | None
    finalized: bool
    notes: str | None
    water_source: str | None
    wind_speed_ms: float | None
    wind_direction_deg: float | None
    temp_c: float | None
    humidity_pct: float | None
    created_at: datetime
    paddocks: list[ApplicationPaddockResponse]


class WeatherSnapshot(BaseModel):
    station_id: str
    wind_speed_ms: float | None = None
    wind_direction_deg: float | None = None
    temp_c: float | None = None
    humidity_pct: float | None = None
    fetched_at: datetime


class RecordResponse(BaseModel):
    application: ApplicationResponse
    paddock_names: list[str]
