from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Farm, Paddock
from ..schemas import FarmCreatePayload, FarmPublic, PaddockCreate, PaddockResponse
from ..services.ownership import ensure_farm
from ..services.serializers import serialize_farm, serialize_paddock

router = APIRouter(prefix="/api/farms", tags=["farms"])


@router.get("", response_model=list[FarmPublic])
async def list_farms(
    owner_id: uuid.UUID | None = Query(default=None),
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[FarmPublic]:
    target_owner_id = owner_id or auth.owner_id
    if target_owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view farms for another owner")
    query = select(Farm).where(Farm.owner_id == target_owner_id).order_by(Farm.created_at.desc())
    result = await session.execute(query)
    farms = result.scalars().all()
    return [serialize_farm(farm) for farm in farms]


@router.post("", response_model=FarmPublic, status_code=status.HTTP_201_CREATED)
async def create_farm(
    payload: FarmCreatePayload,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> FarmPublic:
    owner_id = payload.ownerId or auth.owner_id
    if owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create farm for another owner")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")
    farm = Farm(owner_id=owner_id, name=name, notes=payload.notes)
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return serialize_farm(farm)


@router.get("/{farm_id}/paddocks", response_model=list[PaddockResponse])
async def list_paddocks(
    farm_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[PaddockResponse]:
    await ensure_farm(session, farm_id, auth.owner_id)
    query = select(Paddock).where(Paddock.farm_id == farm_id, Paddock.owner_id == auth.owner_id).order_by(
        Paddock.created_at.desc()
    )
    result = await session.execute(query)
    paddocks = result.scalars().all()
    return [serialize_paddock(p) for p in paddocks]


@router.post("/{farm_id}/paddocks", response_model=PaddockResponse, status_code=status.HTTP_201_CREATED)
async def create_paddock(
    farm_id: uuid.UUID,
    payload: PaddockCreate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> PaddockResponse:
    await ensure_farm(session, farm_id, auth.owner_id)
    paddock = Paddock(
        owner_id=auth.owner_id,
        farm_id=farm_id,
        name=payload.name,
        area_hectares=payload.area_hectares,
        created_at=datetime.now(timezone.utc),
    )
    session.add(paddock)
    await session.commit()
    await session.refresh(paddock)
    return serialize_paddock(paddock)


