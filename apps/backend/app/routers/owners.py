from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Farm
from ..schemas import FarmCreate, FarmResponse

router = APIRouter(prefix="/api/owners/me", tags=["owners"])


@router.get("/farms", response_model=list[FarmResponse])
async def list_farms(
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[Farm]:
    query = select(Farm).where(Farm.owner_id == auth.owner_id).order_by(Farm.created_at.desc())
    result = await session.execute(query)
    farms = result.scalars().all()
    return list(farms)


@router.post("/farms", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
    name: str | None = Query(default=None, min_length=1),
    payload: FarmCreate | None = Body(default=None),
) -> Farm:
    final_name = name or (payload.name if payload else None)
    if not final_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")
    notes = payload.notes if payload else None
    farm = Farm(owner_id=auth.owner_id, name=final_name, notes=notes)
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return farm
