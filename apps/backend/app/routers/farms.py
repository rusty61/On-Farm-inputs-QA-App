from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..schemas import PaddockCreate, PaddockResponse
from ..services.ownership import ensure_farm
from ..services.serializers import serialize_paddock

router = APIRouter(prefix="/api/farms", tags=["farms"])


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
