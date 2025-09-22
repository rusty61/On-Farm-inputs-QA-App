from __future__ import annotations

from datetime import datetime, timezone
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Application, BlynkStation
from ..schemas import WeatherSnapshot
from ..services.ownership import ensure_application
from ..utils import to_float

router = APIRouter(prefix="/api/weather", tags=["weather"])


async def _get_station(
    session: AsyncSession, owner_id: uuid.UUID, station_id: str
) -> BlynkStation | None:
    query = select(BlynkStation).where(BlynkStation.owner_id == owner_id, BlynkStation.station_id == station_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def _fetch_weather_payload(station: BlynkStation) -> dict[str, float | None]:
    params: dict[str, str] = {}
    headers: dict[str, str] = {}
    if station.auth_token:
        params["token"] = station.auth_token
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(station.read_url, params=params, headers=headers)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch weather") from exc
        try:
            data = response.json()
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid weather payload") from exc
    return {
        "wind_speed_ms": to_float(data.get("wind_speed_ms")),
        "wind_direction_deg": to_float(data.get("wind_direction_deg")),
        "temp_c": to_float(data.get("temp_c")),
        "humidity_pct": to_float(data.get("humidity_pct")),
    }


@router.post("/fetch", response_model=WeatherSnapshot)
async def fetch_weather(
    station_id: str = Query(..., min_length=1),
    application_id: uuid.UUID | None = Query(default=None),
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> WeatherSnapshot:
    station = await _get_station(session, auth.owner_id, station_id)
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weather station not found")

    payload = await _fetch_weather_payload(station)
    fetched_at = datetime.now(timezone.utc)

    if application_id is not None:
        await ensure_application(session, application_id, auth.owner_id)
        await session.execute(
            update(Application)
            .where(Application.id == application_id, Application.owner_id == auth.owner_id)
            .values(
                wind_speed_ms=payload["wind_speed_ms"],
                wind_direction_deg=payload["wind_direction_deg"],
                temp_c=payload["temp_c"],
                humidity_pct=payload["humidity_pct"],
            )
        )
        await session.commit()

    return WeatherSnapshot(
        station_id=station.station_id,
        wind_speed_ms=payload["wind_speed_ms"],
        wind_direction_deg=payload["wind_direction_deg"],
        temp_c=payload["temp_c"],
        humidity_pct=payload["humidity_pct"],
        fetched_at=fetched_at,
    )
