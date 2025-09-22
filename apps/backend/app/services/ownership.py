from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Application, Farm, Paddock


async def ensure_farm(session: AsyncSession, farm_id: uuid.UUID, owner_id: uuid.UUID) -> Farm:
    query: Select[tuple[Farm]] = select(Farm).where(Farm.id == farm_id, Farm.owner_id == owner_id)
    result = await session.execute(query)
    farm = result.scalar_one_or_none()
    if farm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


async def ensure_paddock(session: AsyncSession, paddock_id: uuid.UUID, owner_id: uuid.UUID) -> Paddock:
    query: Select[tuple[Paddock]] = select(Paddock).where(Paddock.id == paddock_id, Paddock.owner_id == owner_id)
    result = await session.execute(query)
    paddock = result.scalar_one_or_none()
    if paddock is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paddock not found")
    return paddock


async def ensure_application(
    session: AsyncSession, application_id: uuid.UUID, owner_id: uuid.UUID
) -> Application:
    query: Select[tuple[Application]] = select(Application).where(
        Application.id == application_id, Application.owner_id == owner_id
    )
    result = await session.execute(query)
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application
