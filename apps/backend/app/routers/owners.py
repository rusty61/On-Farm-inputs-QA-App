from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Farm, Owner, Profile
from ..schemas import FarmCreate, FarmResponse, OwnerCreatePayload, OwnerPublic
from ..services.serializers import serialize_owner

router = APIRouter(prefix="/api/owners", tags=["owners"])


@router.get("", response_model=list[OwnerPublic])
async def list_owners(
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[OwnerPublic]:
    query = select(Owner).where(Owner.id == auth.owner_id)
    result = await session.execute(query)
    owners = result.scalars().all()
    return [serialize_owner(owner) for owner in owners]


@router.post("", response_model=OwnerPublic, status_code=status.HTTP_201_CREATED)
async def create_owner(
    payload: OwnerCreatePayload,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> OwnerPublic:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")

    owner = Owner(name=name)
    session.add(owner)
    await session.flush()

    profile = await session.get(Profile, auth.user_id)
    if profile:
        profile.owner_id = owner.id
    else:
        session.add(Profile(user_id=auth.user_id, owner_id=owner.id))

    await session.commit()
    await session.refresh(owner)
    return serialize_owner(owner)


@router.get("/me/farms", response_model=list[FarmResponse])
async def list_farms(
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[Farm]:
    query = select(Farm).where(Farm.owner_id == auth.owner_id).order_by(Farm.created_at.desc())
    result = await session.execute(query)
    farms = result.scalars().all()
    return list(farms)


@router.post("/me/farms", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
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
