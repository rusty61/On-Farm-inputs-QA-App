from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Mix, MixItem
from ..schemas import MixCreate, MixResponse
from ..services.serializers import serialize_mix

router = APIRouter(prefix="/api/mixes", tags=["mixes"])


@router.get("", response_model=list[MixResponse])
async def list_mixes(
    owner_id: uuid.UUID | None = Query(default=None, alias="owner_id"),
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[MixResponse]:
    if owner_id is not None and owner_id != auth.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access mixes for another owner",
        )

    target_owner_id = owner_id or auth.owner_id
    query = (
        select(Mix)
        .where(Mix.owner_id == target_owner_id)
        .options(selectinload(Mix.items))
        .order_by(Mix.created_at.desc())
    )
    result = await session.execute(query)
    mixes = result.scalars().unique().all()
    return [serialize_mix(mix) for mix in mixes]


@router.post("", response_model=MixResponse, status_code=status.HTTP_201_CREATED)
async def create_mix(
    payload: MixCreate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> MixResponse:
    if payload.owner_id != auth.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create mix for another owner",
        )

    mix = Mix(owner_id=auth.owner_id, name=payload.name, total_water_l=payload.total_water_l)
    session.add(mix)
    await session.flush()

    for item_payload in payload.items:
        item = MixItem(
            mix_id=mix.id,
            chemical=item_payload.chemical,
            rate_l_per_ha=item_payload.rate_l_per_ha,
            notes=item_payload.notes,
        )
        session.add(item)

    await session.commit()

    query = (
        select(Mix)
        .where(Mix.id == mix.id, Mix.owner_id == auth.owner_id)
        .options(selectinload(Mix.items))
    )
    result = await session.execute(query)
    created_mix = result.scalar_one()
    return serialize_mix(created_mix)
