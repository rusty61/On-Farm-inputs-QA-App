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


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    owner_id: uuid.UUID = Field(alias="ownerId")
    mix_id: uuid.UUID = Field(alias="mixId")
    paddock_ids: list[uuid.UUID] = Field(alias="paddockIds", min_length=1)
    started_at: datetime = Field(alias="startedAt")
    operator_name: str | None = Field(default=None, alias="operatorName")
    notes: str | None = None
    water_source: str | None = Field(default=None, alias="waterSource")


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


class WeatherSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    wind_speed_ms: float | None = Field(default=None, serialization_alias="windSpeedMs")
    wind_direction_deg: float | None = Field(default=None, serialization_alias="windDirectionDeg")
    temp_c: float | None = Field(default=None, serialization_alias="temperatureC")
    humidity_pct: float | None = Field(default=None, serialization_alias="humidityPct")


class ApplicationSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: uuid.UUID
    owner_id: uuid.UUID = Field(serialization_alias="ownerId")
    mix_id: uuid.UUID | None = Field(default=None, serialization_alias="mixId")
    paddock_ids: list[uuid.UUID] = Field(serialization_alias="paddockIds")
    started_at: datetime = Field(serialization_alias="startedAt")
    finished_at: datetime | None = Field(default=None, serialization_alias="finishedAt")
    finalized: bool
    weather: WeatherSummary | None = Field(default=None, serialization_alias="weather")


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
