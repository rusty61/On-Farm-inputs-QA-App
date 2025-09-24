from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Paddock
from ..schemas import PaddockCreatePayload, PaddockGpsUpdatePayload, PaddockPublic, PaddockResponse, PaddockUpdate
from ..services.ownership import ensure_farm, ensure_paddock
from ..services.serializers import serialize_paddock, serialize_paddock_public

router = APIRouter(prefix="/api/paddocks", tags=["paddocks"])


@router.get("", response_model=list[PaddockPublic])
async def list_paddocks(
    owner_id: uuid.UUID | None = Query(default=None),
    farm_id: uuid.UUID | None = Query(default=None),
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[PaddockPublic]:
    target_owner_id = owner_id or auth.owner_id
    if target_owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view paddocks for another owner")
    query = select(Paddock).where(Paddock.owner_id == target_owner_id)
    if farm_id is not None:
        query = query.where(Paddock.farm_id == farm_id)
    query = query.order_by(Paddock.created_at.desc())
    result = await session.execute(query)
    paddocks = result.scalars().all()
    return [serialize_paddock_public(paddock) for paddock in paddocks]


@router.post("", response_model=PaddockPublic, status_code=status.HTTP_201_CREATED)
async def create_paddock_root(
    payload: PaddockCreatePayload,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> PaddockPublic:
    owner_id = payload.ownerId or auth.owner_id
    if owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create paddock for another owner")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")
    await ensure_farm(session, payload.farmId, owner_id)
    paddock = Paddock(
        owner_id=owner_id,
        farm_id=payload.farmId,
        name=name,
        area_hectares=payload.areaHectares,
        created_at=datetime.now(timezone.utc),
    )
    session.add(paddock)
    await session.commit()
    await session.refresh(paddock)
    return serialize_paddock_public(paddock)


@router.post("/{paddock_id}/gps", response_model=PaddockPublic)
async def update_paddock_gps(
    paddock_id: uuid.UUID,
    payload: PaddockGpsUpdatePayload,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> PaddockPublic:
    paddock = await ensure_paddock(session, paddock_id, auth.owner_id)
    paddock.gps_latitude = payload.latitude
    paddock.gps_longitude = payload.longitude
    paddock.gps_accuracy_m = payload.accuracy
    paddock.gps_updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(paddock)
    return serialize_paddock_public(paddock)


@router.patch("/{paddock_id}", response_model=PaddockResponse)
async def update_paddock(
    paddock_id: uuid.UUID,
    payload: PaddockUpdate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> PaddockResponse:
    paddock = await ensure_paddock(session, paddock_id, auth.owner_id)
    updated = False
    if payload.name is not None:
        paddock.name = payload.name
        updated = True
    if payload.area_hectares is not None:
        paddock.area_hectares = payload.area_hectares
        updated = True
    if payload.gps_latitude is not None:
        paddock.gps_latitude = payload.gps_latitude
        updated = True
    if payload.gps_longitude is not None:
        paddock.gps_longitude = payload.gps_longitude
        updated = True
    if payload.gps_accuracy_m is not None:
        paddock.gps_accuracy_m = payload.gps_accuracy_m
        updated = True
    if updated and (payload.gps_latitude is not None or payload.gps_longitude is not None):
        paddock.gps_updated_at = datetime.now(timezone.utc)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    await session.commit()
    await session.refresh(paddock)
    return serialize_paddock(paddock)


@router.delete("/{paddock_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paddock(
    paddock_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    paddock = await ensure_paddock(session, paddock_id, auth.owner_id)
    await session.delete(paddock)
    await session.commit()
