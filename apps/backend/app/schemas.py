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


class MixItemCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    chemical: str = Field(..., min_length=1)
    rate_l_per_ha: float = Field(..., alias="rateLPerHa", ge=0)
    notes: str | None = None


class MixCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    owner_id: uuid.UUID = Field(alias="ownerId")
    name: str = Field(..., min_length=1)
    total_water_l: float = Field(..., alias="totalWaterL", ge=0)
    items: list[MixItemCreate]


class MixItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    chemical: str
    rate_l_per_ha: float = Field(alias="rateLPerHa")
    notes: str | None


class MixResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    owner_id: uuid.UUID = Field(alias="ownerId")
    name: str
    total_water_l: float = Field(alias="totalWaterL")
    items: list[MixItemResponse]
    created_at: datetime = Field(alias="createdAt")


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


class WeatherSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    wind_speed_ms: float | None = Field(default=None, alias="windSpeedMs")
    wind_direction_deg: float | None = Field(default=None, alias="windDirectionDeg")
    temp_c: float | None = Field(default=None, alias="temperatureC")
    humidity_pct: float | None = Field(default=None, alias="humidityPct")


class ApplicationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    owner_id: uuid.UUID = Field(alias="ownerId")
    mix_id: uuid.UUID | None = Field(default=None, alias="mixId")
    paddock_ids: list[uuid.UUID] = Field(alias="paddockIds")
    started_at: datetime = Field(alias="startedAt")
    finished_at: datetime | None = Field(default=None, alias="finishedAt")
    finalized: bool
    weather: WeatherSummary | None = None


class WeatherSnapshot(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    station_id: str = Field(alias="stationId")
    wind_speed_ms: float | None = Field(default=None, alias="windSpeedMs")
    wind_direction_deg: float | None = Field(default=None, alias="windDirectionDeg")
    temp_c: float | None = Field(default=None, alias="temperatureC")
    humidity_pct: float | None = Field(default=None, alias="humidityPct")
    fetched_at: datetime = Field(alias="fetchedAt")


class RecordResponse(BaseModel):
    application: ApplicationResponse
    paddock_names: list[str]
